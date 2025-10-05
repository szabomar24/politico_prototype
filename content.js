(function () {
  // Enable debug mode for detailed logging
  const DEBUG = true;
  
  // Helper function for logging
  function log(message, ...args) {
    if (DEBUG) {
      console.log(`[GN-Politics] ${message}`, ...args);
    }
  }
  
  // Helper function for error logging
  function logError(message, ...args) {
    console.error(`[GN-Politics] ${message}`, ...args);
  }
  
  // Flag to track if politics content is loaded
  window.__gn_politics_loaded = false;
  
  // Run immediately with retries
  log('Extension loaded on page:', window.location.href);
  
  // Debug the page structure to find the navbar
  function debugPageStructure() {
    log('Debugging page structure to find navbar...');
    
    // Look for all potential navbar elements
    const navElements = [
      document.querySelectorAll('nav'),
      document.querySelectorAll('header'),
      document.querySelectorAll('.navbar'),
      document.querySelectorAll('[role="navigation"]'),
      document.querySelectorAll('ul')
    ];
    
    // Log what we found
    navElements.forEach((elements, i) => {
      const types = ['nav', 'header', '.navbar', '[role="navigation"]', 'ul'];
      log(`Found ${elements.length} ${types[i]} elements`);
      
      // Log details of each element
      Array.from(elements).forEach((el, j) => {
        log(`${types[i]} #${j}: id=${el.id}, class=${el.className}, children=${el.children.length}`);
        
        // Look for potential navbar items
        const links = el.querySelectorAll('a');
        if (links.length > 0) {
          log(`- Contains ${links.length} links:`);
          Array.from(links).slice(0, 3).forEach(link => {
            log(`  - ${link.textContent}: id=${link.id}, href=${link.getAttribute('href')}`);
          });
          if (links.length > 3) {
            log(`  - ... and ${links.length - 3} more links`);
          }
        }
      });
    });
    
    // Specifically look for the Blindspot link
    const blindspotLinks = document.querySelectorAll('a[href*="blindspot"], a#header-navbar-blindspot');
    log(`Found ${blindspotLinks.length} potential Blindspot links`);
    Array.from(blindspotLinks).forEach((link, i) => {
      log(`Blindspot link #${i}: id=${link.id}, text=${link.textContent}, href=${link.getAttribute('href')}`);
    });
  }
  
  // Function to inject the Politics link into the navbar
  function injectPoliticsLink() {
    log('Attempting to inject Politics link...');
    
    // Find the navbar - look for common elements and specific Ground News selectors
    // First look for the Blindspot link as a reference point
    const blindspotLink = document.querySelector('#header-navbar-blindspot');
    
    if (blindspotLink) {
      log('Found Blindspot link, using it as reference');
      // If we found the Blindspot link, we can use its parent as a reference
      const blindspotWrapper = blindspotLink.parentElement;
      
      // Check if we already injected the link
      if (document.querySelector('#gn-politics-link') || document.querySelector('#header-navbar-politics')) {
        log('Politics link already exists');
        return;
      }
      
      // Clone the wrapper div (to preserve flex-col structure and styling)
      const politicsWrapper = blindspotWrapper.cloneNode(true);
      
      // Update the link inside
      const link = politicsWrapper.querySelector('a');
      if (link) {
        link.id = 'header-navbar-politics';
        link.href = '/politics-prototype';
        link.textContent = 'Politics';
        
        // Add click handler
        link.addEventListener('click', function(e) {
          e.preventDefault();
          log('Politics link clicked');
          
          // Update URL without reloading
          window.history.pushState({}, '', '/politics-prototype');
          
          // Highlight this link
          highlightPoliticsLink();
          
          // Load politics content
          loadPoliticsContent();
        });
        
        // Insert after Blindspot wrapper
        blindspotWrapper.insertAdjacentElement('afterend', politicsWrapper);
        log('Politics link injected successfully via Blindspot reference');
        return;
      }
    }
    
    // If we couldn't find the Blindspot link, try general navbar detection
    const navbar = document.querySelector('nav ul') || 
                  document.querySelector('.navbar') || 
                  document.querySelector('header ul') ||
                  document.querySelector('[role="navigation"]') ||
                  document.querySelector('header nav') ||
                  document.querySelector('.nav-links');
    
    if (!navbar) {
      log('Could not find navbar, will retry later');
      setTimeout(injectPoliticsLink, 500);
      return;
    }
    
    // Check if we already injected the link
    if (document.querySelector('#gn-politics-link')) {
      log('Politics link already exists');
      return;
    }
    
    // Create the Politics link
    const politicsLi = document.createElement('li');
    politicsLi.className = navbar.children[0]?.className || '';
    
    const politicsLink = document.createElement('a');
    politicsLink.id = 'gn-politics-link';
    politicsLink.href = '/politics-prototype';
    politicsLink.textContent = 'Politics';
    politicsLink.className = navbar.querySelector('a')?.className || '';
    
    // Add click handler
    politicsLink.addEventListener('click', function(e) {
      e.preventDefault();
      log('Politics link clicked');
      
      // Update URL without reloading
      window.history.pushState({}, '', '/politics-prototype');
      
      // Highlight this link
      highlightPoliticsLink();
      
      // Load politics content
      loadPoliticsContent();
    });
    
    politicsLi.appendChild(politicsLink);
    
    // Insert after the first few items
    if (navbar.children.length > 2) {
      navbar.insertBefore(politicsLi, navbar.children[2]);
    } else {
      navbar.appendChild(politicsLi);
    }
    
    log('Politics link injected successfully');
  }
  
  // Function to highlight the Politics link
  function highlightPoliticsLink() {
    // Find all navbar links
    const navLinks = document.querySelectorAll('nav a, .navbar a, header ul a');
    
    // Remove active class from all links
    navLinks.forEach(link => {
      if (link.classList.contains('active')) {
        link.classList.remove('active');
      }
      // Also check for custom active classes
      if (link.className.includes('active')) {
        link.className = link.className.replace(/active/g, '').trim();
      }
    });
    
    // Add active class to politics link
    const politicsLink = document.querySelector('#gn-politics-link') || document.querySelector('#header-navbar-politics');
    if (politicsLink) {
      politicsLink.classList.add('active');
    }
  }
  
  // Function to load politics content
  function loadPoliticsContent() {
    log('Loading politics content...');
    
    // Find the main content area
    const mainContent = document.querySelector('main') || 
                        document.querySelector('#content') || 
                        document.querySelector('.content') || 
                        document.querySelector('.container');
    
    if (!mainContent) {
      logError('Could not find main content area');
      return;
    }
    
    // Store original content for restoration
    if (!window.__gn_original_content) {
      window.__gn_original_content = mainContent.innerHTML;
    }
    
    // Check if we have a location set
    if (window.__gn_politics_location) {
      // If location is set, show the location-specific politics page
      loadPoliticsLocationPage(mainContent, window.__gn_politics_location);
    } else {
      // If no location is set, show the location prompt
      showLocationPrompt(mainContent);
    }
    
    // Set loaded flag
    window.__gn_politics_loaded = true;
    
    log('Politics content loaded successfully');
  }
  
  // Function to show the location prompt
  function showLocationPrompt(mainContent) {
    log('Showing location prompt...');
    
    // Create politics container with location prompt that matches the Local page style
    const politicsContainer = document.createElement('div');
    politicsContainer.id = 'gn-politics-container';
    politicsContainer.innerHTML = `
      <article class="max-w-screen-wide mx-auto max-md:mx-[0.6rem]">
        <div class="hideElementSiteWide flex flex-col rounded-lg px-[0.9rem] py-[6.3rem] mx-auto items-center justify-center gap-[1.3rem] w-max pt-[1.3rem] pb-[2.5rem] tablet:pt-[3.8rem] tablet:pb-[7.5rem] desktop:pt-[6.3rem] desktop:pb-[10rem] leading-tightest">
          <h1 class="text-32 font-bold text-center max-w-5xl">Choose a location to create a custom politics feed</h1>
          <span class="text-18 font-normal text-center max-w-3xl">Get updates on local political news, events, and figures relevant to your area</span>
          
          <div class="flex w-full" style="max-width: 26.25rem;">
            <div class="w-full text-14 border border-ground-black dark:border-dark-ground-black relative">
              <input id="politics-location-input" placeholder="Enter your city's name" autocomplete="on" class="w-full py-[0.6rem] text-16 border-none focus:underline focus:underline-offset-1 dark:bg-ground-black placeholder-[var(--gray-200)] dark:placeholder-[var(--gray-200)] dark:text-light-primary bg-light-primary text-dark-primary" type="text" value="Amsterdam, Netherlands" name="searchLocation" style="box-shadow: none;">
              <div class="flex flex-col gap-[6px] tablet:gap-[8px] overflow-scroll absolute bg-light-light dark:bg-[var(--gray-100)] w-full box-content shadow border-l border-b border-r border-dark-primary false location_scroll-bar__YQSyq" style="max-height: 6.25rem; left: -1px;"></div>
            </div>
          </div>
          
          <div class="w-full max-w-2xl">
            <button id="set-location-btn" type="button" class="cursor-pointer bg-dark-primary dark:bg-light-primary flex justify-center py-[1.3rem] rounded-lg text-light-primary dark:text-dark-primary text-16 w-full h-[3.1rem] items-center">Set Your Location</button>
            <div class="flex justify-center">
              <button id="detect-location-btn" type="button" class="cursor-pointer flex gap-[0.6rem] mt-[0.9rem] text-14 justify-center underline font-semibold relative">Or, enable location permissions</button>
            </div>
          </div>
        </div>
      </article>
    `;
    
    // Replace main content
    mainContent.innerHTML = '';
    mainContent.appendChild(politicsContainer);
    
    // Add event listeners after the content is added to the DOM
    setTimeout(() => {
      // Set location button
      const setLocationBtn = document.getElementById('set-location-btn');
      if (setLocationBtn) {
        setLocationBtn.addEventListener('click', () => {
          const locationInput = document.getElementById('politics-location-input');
          const location = locationInput ? locationInput.value : 'Netherlands';
          window.__gn_politics_location = location;
          
          // Update URL to reflect the location
          window.history.pushState({}, '', `/politics-prototype/${location.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);
          
          // Load the location-specific politics page
          loadPoliticsLocationPage(mainContent, location);
        });
      }
      
      // Location chips
      const locationChips = document.querySelectorAll('.location-chip');
      locationChips.forEach(chip => {
        chip.addEventListener('click', () => {
          const locationInput = document.getElementById('politics-location-input');
          if (locationInput) {
            locationInput.value = chip.textContent;
          }
        });
      });
    }, 100);
  }
  
  // Function to load the location-specific politics page
  function loadPoliticsLocationPage(mainContent, location) {
    log(`Loading politics page for location: ${location}`);
    
    // Default to Netherlands if no location is provided
    const displayLocation = location || 'Netherlands';
    
    // Store the active tab (default to News)
    window.__gn_politics_active_tab = window.__gn_politics_active_tab || 'News';
    
    // Create the location-specific politics page
    const politicsContainer = document.createElement('div');
    politicsContainer.id = 'gn-politics-location-container';
    politicsContainer.innerHTML = `
      <div class="politics-location-header">
        <div class="location-info">
          <h1>Politics: ${displayLocation}</h1>
          <div class="location-actions">
            <button class="change-location-btn">Change Location</button>
            <button class="filter-btn">Filter</button>
          </div>
        </div>
        <div class="location-tabs">
          <button class="tab-btn" data-tab="News">News</button>
          <button class="tab-btn" data-tab="Events">Events</button>
          <button class="tab-btn" data-tab="Politicians">Politicians</button>
          <button class="tab-btn" data-tab="Issues">Issues</button>
        </div>
      </div>
      
      <div class="politics-location-content">
        <!-- Tab content will be loaded here -->
      </div>
    `;
    
    // Replace main content
    mainContent.innerHTML = '';
    mainContent.appendChild(politicsContainer);
    
    // Add event listeners after the content is added to the DOM
    setTimeout(() => {
      // Change location button
      const changeLocationBtn = document.querySelector('.change-location-btn');
      if (changeLocationBtn) {
        changeLocationBtn.addEventListener('click', () => {
          // Clear the location and show the prompt again
          window.__gn_politics_location = null;
          showLocationPrompt(mainContent);
        });
      }
      
      // Tab buttons
      const tabButtons = document.querySelectorAll('.tab-btn');
      tabButtons.forEach(button => {
        const tabName = button.getAttribute('data-tab');
        
        // Mark the active tab
        if (tabName === window.__gn_politics_active_tab) {
          button.classList.add('active');
        }
        
        button.addEventListener('click', () => {
          // Update active tab
          tabButtons.forEach(btn => btn.classList.remove('active'));
          button.classList.add('active');
          
          // Store the active tab
          window.__gn_politics_active_tab = tabName;
          
          // Load the tab content
          loadTabContent(tabName, displayLocation);
        });
      });
      
      // Load the default tab content (News)
      loadTabContent(window.__gn_politics_active_tab, displayLocation);
    }, 100);
  }
  
  // Function to load the content for a specific tab
  function loadTabContent(tabName, location) {
    log(`Loading ${tabName} tab content for ${location}`);
    
    const contentContainer = document.querySelector('.politics-location-content');
    if (!contentContainer) {
      logError('Could not find politics content container');
      return;
    }
    
    // Clear existing content
    contentContainer.innerHTML = '';
    
    // Load content based on tab name
    switch(tabName) {
      case 'News':
        loadNewsTabContent(contentContainer, location);
        break;
      case 'Events':
        loadEventsTabContent(contentContainer, location);
        break;
      case 'Politicians':
        loadPoliticiansTabContent(contentContainer, location);
        break;
      case 'Issues':
        loadIssuesTabContent(contentContainer, location);
        break;
      default:
        loadNewsTabContent(contentContainer, location);
    }
  }
  
  // Function to load the News tab content
  function loadNewsTabContent(container, location) {
    container.innerHTML = `
      <div class="news-tab-content">
        <div class="featured-story">
          <img src="https://via.placeholder.com/800x400" alt="Featured story">
          <div class="story-details">
            <div class="story-meta">
              <span class="story-category">FEATURED</span>
              <span class="bias-indicator center">Center</span>
            </div>
            <h2>Supreme Court Rules on Major Election Law Case</h2>
            <p>The Supreme Court issued a landmark ruling today that will have significant implications for upcoming elections across the country...</p>
            <div class="coverage-meter">
              <div class="meter-bar" style="width: 85%"></div>
              <span>85% Coverage</span>
            </div>
            <div class="story-footer">
              <div class="sources">
                <span>12 sources</span>
              </div>
              <div class="time">2 hours ago</div>
            </div>
          </div>
        </div>
        
        <div class="stories-grid">
          <div class="story-card">
            <img src="https://via.placeholder.com/400x200" alt="Story image">
            <div class="story-details">
              <div class="story-meta">
                <span class="story-category">POLICY</span>
                <span class="bias-indicator left">Left</span>
              </div>
              <h3>New Major Healthcare Bill Advances in Senate</h3>
              <p>The controversial healthcare bill has advanced to the next stage after a narrow vote...</p>
              <div class="coverage-meter">
                <div class="meter-bar" style="width: 65%"></div>
                <span>65% Coverage</span>
              </div>
              <div class="story-footer">
                <div class="sources">8 sources</div>
                <div class="time">5 hours ago</div>
              </div>
            </div>
          </div>
          
          <div class="story-card">
            <img src="https://via.placeholder.com/400x200" alt="Story image">
            <div class="story-details">
              <div class="story-meta">
                <span class="story-category">INTERNATIONAL</span>
                <span class="bias-indicator right">Right</span>
              </div>
              <h3>Trade Agreement with European Union Finalized</h3>
              <p>After months of negotiations, the new trade agreement has been finalized...</p>
              <div class="coverage-meter">
                <div class="meter-bar" style="width: 72%"></div>
                <span>72% Coverage</span>
              </div>
              <div class="story-footer">
                <div class="sources">10 sources</div>
                <div class="time">1 day ago</div>
              </div>
            </div>
          </div>
          
          <div class="story-card">
            <img src="https://via.placeholder.com/400x200" alt="Story image">
            <div class="story-details">
              <div class="story-meta">
                <span class="story-category">ELECTION</span>
                <span class="bias-indicator center-right">Center-Right</span>
              </div>
              <h3>Presidential Debate Ratings Hit Record High</h3>
              <p>Last night's presidential debate drew the highest viewership in history...</p>
              <div class="coverage-meter">
                <div class="meter-bar" style="width: 90%"></div>
                <span>90% Coverage</span>
              </div>
              <div class="story-footer">
                <div class="sources">15 sources</div>
                <div class="time">12 hours ago</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="politics-footer">
          <div class="story-count">Showing 4 of 42 stories</div>
          <button class="load-more-btn">Load More Stories</button>
        </div>
      </div>
    `;
  }
  // Function to load the Events tab content
  function loadEventsTabContent(container, location) {
    container.innerHTML = `
      <div class="events-tab-content">
        <div class="events-header">
          <h2>Upcoming Political Events in ${location}</h2>
          <div class="events-filters">
            <button class="filter-btn">Filter by Type</button>
            <button class="sort-btn">Sort by Date</button>
          </div>
        </div>
        
        <div class="events-list">
          <div class="event-card large">
            <div class="event-date">
              <span class="event-month">Oct</span>
              <span class="event-day">15</span>
            </div>
            <div class="event-details">
              <h3>Parliamentary Debate on Climate Policy</h3>
              <p class="event-description">The Dutch Parliament will debate new climate policy measures including carbon emission targets and agricultural regulations.</p>
              <p class="event-location">Dutch Parliament, The Hague</p>
              <p class="event-time">14:00 - 17:30</p>
              <div class="event-tags">
                <span class="event-tag">Climate</span>
                <span class="event-tag">Parliament</span>
                <span class="event-tag">Legislation</span>
              </div>
              <div class="event-actions">
                <button class="event-reminder-btn">Set Reminder</button>
                <button class="event-calendar-btn">Add to Calendar</button>
                <button class="event-share-btn">Share</button>
              </div>
            </div>
          </div>
          
          <div class="event-card large">
            <div class="event-date">
              <span class="event-month">Oct</span>
              <span class="event-day">18</span>
            </div>
            <div class="event-details">
              <h3>Public Forum: Housing Crisis Solutions</h3>
              <p class="event-description">City officials and housing experts will discuss solutions to the ongoing housing shortage and affordability crisis in Amsterdam.</p>
              <p class="event-location">Amsterdam City Hall</p>
              <p class="event-time">18:00 - 20:00</p>
              <div class="event-tags">
                <span class="event-tag">Housing</span>
                <span class="event-tag">Public Forum</span>
                <span class="event-tag">Urban Planning</span>
              </div>
              <div class="event-actions">
                <button class="event-reminder-btn">Set Reminder</button>
                <button class="event-calendar-btn">Add to Calendar</button>
                <button class="event-share-btn">Share</button>
              </div>
            </div>
          </div>
          
          <div class="event-card large">
            <div class="event-date">
              <span class="event-month">Oct</span>
              <span class="event-day">22</span>
            </div>
            <div class="event-details">
              <h3>EU Agricultural Policy Town Hall</h3>
              <p class="event-description">EU representatives will discuss the impact of new agricultural policies on Dutch farmers and the agricultural sector.</p>
              <p class="event-location">Rotterdam Convention Center</p>
              <p class="event-time">10:00 - 12:30</p>
              <div class="event-tags">
                <span class="event-tag">Agriculture</span>
                <span class="event-tag">EU Policy</span>
                <span class="event-tag">Town Hall</span>
              </div>
              <div class="event-actions">
                <button class="event-reminder-btn">Set Reminder</button>
                <button class="event-calendar-btn">Add to Calendar</button>
                <button class="event-share-btn">Share</button>
              </div>
            </div>
          </div>
          
          <div class="event-card large">
            <div class="event-date">
              <span class="event-month">Oct</span>
              <span class="event-day">25</span>
            </div>
            <div class="event-details">
              <h3>Immigration Policy Debate</h3>
              <p class="event-description">Political party representatives will debate current immigration policies and proposed reforms.</p>
              <p class="event-location">University of Amsterdam</p>
              <p class="event-time">19:00 - 21:00</p>
              <div class="event-tags">
                <span class="event-tag">Immigration</span>
                <span class="event-tag">Debate</span>
                <span class="event-tag">Policy</span>
              </div>
              <div class="event-actions">
                <button class="event-reminder-btn">Set Reminder</button>
                <button class="event-calendar-btn">Add to Calendar</button>
                <button class="event-share-btn">Share</button>
              </div>
            </div>
          </div>
          
          <div class="event-card large">
            <div class="event-date">
              <span class="event-month">Oct</span>
              <span class="event-day">30</span>
            </div>
            <div class="event-details">
              <h3>Digital Privacy and Security Conference</h3>
              <p class="event-description">Government officials and tech experts discuss digital privacy laws and cybersecurity policies.</p>
              <p class="event-location">Eindhoven Technology Center</p>
              <p class="event-time">09:00 - 17:00</p>
              <div class="event-tags">
                <span class="event-tag">Technology</span>
                <span class="event-tag">Privacy</span>
                <span class="event-tag">Conference</span>
              </div>
              <div class="event-actions">
                <button class="event-reminder-btn">Set Reminder</button>
                <button class="event-calendar-btn">Add to Calendar</button>
                <button class="event-share-btn">Share</button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="events-footer">
          <div class="event-count">Showing 5 of 18 events</div>
          <button class="load-more-btn">Load More Events</button>
        </div>
      </div>
    `;
  }
  
  // Function to load the Politicians tab content
  function loadPoliticiansTabContent(container, location) {
    container.innerHTML = `
      <div class="politicians-tab-content">
        <div class="politicians-header">
          <h2>Key Political Figures in ${location}</h2>
          <div class="politicians-filters">
            <button class="filter-btn">Filter by Party</button>
            <button class="sort-btn">Sort by Influence</button>
          </div>
        </div>
        
        <div class="politicians-grid">
          <div class="politician-card">
            <img src="https://via.placeholder.com/300x300" alt="Mark Rutte" class="politician-image">
            <div class="politician-details">
              <h3>Mark Rutte</h3>
              <p class="politician-position">Prime Minister</p>
              <p class="politician-party">VVD (People's Party for Freedom and Democracy)</p>
              <div class="politician-stats">
                <div class="stat">
                  <span class="stat-label">In Office Since</span>
                  <span class="stat-value">2010</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Approval</span>
                  <span class="stat-value">54%</span>
                </div>
              </div>
              <div class="politician-bias">
                <span class="bias-label">Political Leaning:</span>
                <span class="bias-indicator center-right">Center-Right</span>
              </div>
              <div class="politician-actions">
                <button class="view-profile-btn">View Full Profile</button>
                <button class="follow-btn">Follow</button>
              </div>
            </div>
          </div>
          
          <div class="politician-card">
            <img src="https://via.placeholder.com/300x300" alt="Sigrid Kaag" class="politician-image">
            <div class="politician-details">
              <h3>Sigrid Kaag</h3>
              <p class="politician-position">Minister of Finance</p>
              <p class="politician-party">D66 (Democrats 66)</p>
              <div class="politician-stats">
                <div class="stat">
                  <span class="stat-label">In Office Since</span>
                  <span class="stat-value">2021</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Approval</span>
                  <span class="stat-value">48%</span>
                </div>
              </div>
              <div class="politician-bias">
                <span class="bias-label">Political Leaning:</span>
                <span class="bias-indicator center">Center</span>
              </div>
              <div class="politician-actions">
                <button class="view-profile-btn">View Full Profile</button>
                <button class="follow-btn">Follow</button>
              </div>
            </div>
          </div>
          
          <div class="politician-card">
            <img src="https://via.placeholder.com/300x300" alt="Geert Wilders" class="politician-image">
            <div class="politician-details">
              <h3>Geert Wilders</h3>
              <p class="politician-position">Party Leader</p>
              <p class="politician-party">PVV (Party for Freedom)</p>
              <div class="politician-stats">
                <div class="stat">
                  <span class="stat-label">In Parliament Since</span>
                  <span class="stat-value">1998</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Approval</span>
                  <span class="stat-value">37%</span>
                </div>
              </div>
              <div class="politician-bias">
                <span class="bias-label">Political Leaning:</span>
                <span class="bias-indicator right">Right</span>
              </div>
              <div class="politician-actions">
                <button class="view-profile-btn">View Full Profile</button>
                <button class="follow-btn">Follow</button>
              </div>
            </div>
          </div>
          
          <div class="politician-card">
            <img src="https://via.placeholder.com/300x300" alt="Jesse Klaver" class="politician-image">
            <div class="politician-details">
              <h3>Jesse Klaver</h3>
              <p class="politician-position">Party Leader</p>
              <p class="politician-party">GroenLinks (GreenLeft)</p>
              <div class="politician-stats">
                <div class="stat">
                  <span class="stat-label">In Parliament Since</span>
                  <span class="stat-value">2010</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Approval</span>
                  <span class="stat-value">42%</span>
                </div>
              </div>
              <div class="politician-bias">
                <span class="bias-label">Political Leaning:</span>
                <span class="bias-indicator left">Left</span>
              </div>
              <div class="politician-actions">
                <button class="view-profile-btn">View Full Profile</button>
                <button class="follow-btn">Follow</button>
              </div>
            </div>
          </div>
          
          <div class="politician-card">
            <img src="https://via.placeholder.com/300x300" alt="Wopke Hoekstra" class="politician-image">
            <div class="politician-details">
              <h3>Wopke Hoekstra</h3>
              <p class="politician-position">Party Leader</p>
              <p class="politician-party">CDA (Christian Democratic Appeal)</p>
              <div class="politician-stats">
                <div class="stat">
                  <span class="stat-label">In Office Since</span>
                  <span class="stat-value">2017</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Approval</span>
                  <span class="stat-value">39%</span>
                </div>
              </div>
              <div class="politician-bias">
                <span class="bias-label">Political Leaning:</span>
                <span class="bias-indicator center-right">Center-Right</span>
              </div>
              <div class="politician-actions">
                <button class="view-profile-btn">View Full Profile</button>
                <button class="follow-btn">Follow</button>
              </div>
            </div>
          </div>
          
          <div class="politician-card">
            <img src="https://via.placeholder.com/300x300" alt="Lilian Marijnissen" class="politician-image">
            <div class="politician-details">
              <h3>Lilian Marijnissen</h3>
              <p class="politician-position">Party Leader</p>
              <p class="politician-party">SP (Socialist Party)</p>
              <div class="politician-stats">
                <div class="stat">
                  <span class="stat-label">In Parliament Since</span>
                  <span class="stat-value">2017</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Approval</span>
                  <span class="stat-value">35%</span>
                </div>
              </div>
              <div class="politician-bias">
                <span class="bias-label">Political Leaning:</span>
                <span class="bias-indicator left">Left</span>
              </div>
              <div class="politician-actions">
                <button class="view-profile-btn">View Full Profile</button>
                <button class="follow-btn">Follow</button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="politicians-footer">
          <div class="politician-count">Showing 6 of 24 politicians</div>
          <button class="load-more-btn">Load More Politicians</button>
        </div>
      </div>
    `;
  }
  
  // Function to load the Issues tab content
  function loadIssuesTabContent(container, location) {
    container.innerHTML = `
      <div class="issues-tab-content">
        <div class="issues-header">
          <h2>Trending Political Issues in ${location}</h2>
          <div class="issues-filters">
            <button class="filter-btn">Filter by Category</button>
            <button class="sort-btn">Sort by Trending</button>
          </div>
        </div>
        
        <div class="issues-grid">
          <div class="issue-card large">
            <div class="issue-header">
              <h3>Housing Crisis</h3>
              <div class="issue-trend trending-up">↑ 24%</div>
            </div>
            <div class="issue-content">
              <p class="issue-description">Housing shortages and affordability concerns continue to be a major political issue across the Netherlands, with particular impact in urban areas like Amsterdam and Utrecht.</p>
              <div class="issue-stats">
                <div class="stat">
                  <span class="stat-label">Media Coverage</span>
                  <div class="coverage-meter">
                    <div class="meter-bar" style="width: 85%"></div>
                    <span>85%</span>
                  </div>
                </div>
                <div class="stat">
                  <span class="stat-label">Public Interest</span>
                  <div class="coverage-meter">
                    <div class="meter-bar" style="width: 92%"></div>
                    <span>92%</span>
                  </div>
                </div>
              </div>
              <div class="issue-positions">
                <h4>Political Positions</h4>
                <div class="position-spectrum">
                  <div class="position left">
                    <span class="position-label">Left</span>
                    <p>Increase social housing, rent controls</p>
                  </div>
                  <div class="position center">
                    <span class="position-label">Center</span>
                    <p>Mixed approach, targeted subsidies</p>
                  </div>
                  <div class="position right">
                    <span class="position-label">Right</span>
                    <p>Market solutions, reduce regulations</p>
                  </div>
                </div>
              </div>
              <div class="issue-sources">
                <span>18 sources</span>
                <button class="view-sources-btn">View Sources</button>
              </div>
            </div>
          </div>
          
          <div class="issue-card large">
            <div class="issue-header">
              <h3>Climate Policy</h3>
              <div class="issue-trend trending-up">↑ 12%</div>
            </div>
            <div class="issue-content">
              <p class="issue-description">Debates over emissions targets and agricultural regulations are intensifying as the EU pushes for stricter climate measures, with significant implications for Dutch industry and agriculture.</p>
              <div class="issue-stats">
                <div class="stat">
                  <span class="stat-label">Media Coverage</span>
                  <div class="coverage-meter">
                    <div class="meter-bar" style="width: 72%"></div>
                    <span>72%</span>
                  </div>
                </div>
                <div class="stat">
                  <span class="stat-label">Public Interest</span>
                  <div class="coverage-meter">
                    <div class="meter-bar" style="width: 68%"></div>
                    <span>68%</span>
                  </div>
                </div>
              </div>
              <div class="issue-positions">
                <h4>Political Positions</h4>
                <div class="position-spectrum">
                  <div class="position left">
                    <span class="position-label">Left</span>
                    <p>Aggressive climate targets, green transition</p>
                  </div>
                  <div class="position center">
                    <span class="position-label">Center</span>
                    <p>Balanced approach, gradual implementation</p>
                  </div>
                  <div class="position right">
                    <span class="position-label">Right</span>
                    <p>Economic concerns first, slower transition</p>
                  </div>
                </div>
              </div>
              <div class="issue-sources">
                <span>14 sources</span>
                <button class="view-sources-btn">View Sources</button>
              </div>
            </div>
          </div>
          
          <div class="issue-card large">
            <div class="issue-header">
              <h3>Immigration Reform</h3>
              <div class="issue-trend trending-down">↓ 8%</div>
            </div>
            <div class="issue-content">
              <p class="issue-description">Discussions about immigration policy and integration continue, with parties divided on approach and implementation of asylum procedures and integration programs.</p>
              <div class="issue-stats">
                <div class="stat">
                  <span class="stat-label">Media Coverage</span>
                  <div class="coverage-meter">
                    <div class="meter-bar" style="width: 65%"></div>
                    <span>65%</span>
                  </div>
                </div>
                <div class="stat">
                  <span class="stat-label">Public Interest</span>
                  <div class="coverage-meter">
                    <div class="meter-bar" style="width: 58%"></div>
                    <span>58%</span>
                  </div>
                </div>
              </div>
              <div class="issue-positions">
                <h4>Political Positions</h4>
                <div class="position-spectrum">
                  <div class="position left">
                    <span class="position-label">Left</span>
                    <p>More open policies, humanitarian focus</p>
                  </div>
                  <div class="position center">
                    <span class="position-label">Center</span>
                    <p>Controlled immigration, better integration</p>
                  </div>
                  <div class="position right">
                    <span class="position-label">Right</span>
                    <p>Stricter controls, reduced immigration</p>
                  </div>
                </div>
              </div>
              <div class="issue-sources">
                <span>12 sources</span>
                <button class="view-sources-btn">View Sources</button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="issues-footer">
          <div class="issue-count">Showing 3 of 15 issues</div>
          <button class="load-more-btn">Load More Issues</button>
        </div>
      </div>
    `;
  }
  
  // Function to restore original content
  function restoreOriginalContent() {
    log('Attempting to restore original content');
    
    try {
      // First, remove our politics containers if they exist
      const politicsContainers = [
        document.querySelector('#gn-politics-container'),
        document.querySelector('#gn-politics-location-container')
      ];
      
      politicsContainers.forEach(container => {
        if (container && container.parentNode) {
          try {
            container.parentNode.removeChild(container);
            log('Removed politics container');
          } catch (e) {
            log('Error removing politics container:', e);
            // If we can't remove it, hide it
            container.style.display = 'none';
          }
        }
      });
      
      // Reset our flags
      window.__gn_politics_loaded = false;
      window.__gn_politics_location = null;
      
      log('Original content restoration complete');
      
      // We don't need to restore the original content manually anymore
      // as we're letting the site's router handle the navigation
      return true;
    } catch (e) {
      logError('Error in restoreOriginalContent:', e);
      return false;
    }
  }
  
  // Listen for clicks on other navbar links and all anchor tags when on politics page
  document.addEventListener('click', function(e) {
    // If we're not on the politics page, don't interfere
    if (!window.__gn_politics_loaded) {
      return;
    }
    
    // Find if the click was on any link
    const clickedLink = e.target.closest('a');
    if (!clickedLink) {
      return; // Not a link click
    }
    
    // Don't interfere with our own politics links
    if (clickedLink.id === 'gn-politics-link' || clickedLink.id === 'header-navbar-politics') {
      return;
    }
    
    // Get the href to navigate to
    const href = clickedLink.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) {
      return; // Not a navigation link
    }
    
    log('Intercepted click on link:', clickedLink.textContent, 'href:', href);
    
    // Prevent default to handle navigation ourselves
    e.preventDefault();
    e.stopPropagation();
    
    // Use full page reload for ALL navigation from politics page
    log('Using full page reload for navigation to:', href);
    
    // Set a flag to indicate we're navigating away
    window.__gn_politics_navigating_away = true;
    
    // Use setTimeout to ensure our event handler completes before reload
    setTimeout(() => {
      window.location.href = href;
    }, 0);
  }, true); // Use capture phase to intercept before React
  
  // Set up a mutation observer to detect if our link gets removed
  const observer = new MutationObserver(function(mutations) {
    if (!document.querySelector('#gn-politics-link') && !document.querySelector('#header-navbar-politics')) {
      injectPoliticsLink();
    }
  });
  
  // Start observing the document
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Run debug after a short delay
  setTimeout(debugPageStructure, 1000);
  
  // Try to inject the politics link multiple times
  injectPoliticsLink();
  
  // Set up multiple retries with increasing delays
  const retryDelays = [500, 1000, 2000, 3000, 5000];
  retryDelays.forEach(delay => {
    setTimeout(injectPoliticsLink, delay);
  });
  
  // Check if we're on the politics page
  if (window.location.pathname.includes('politics-prototype')) {
    setTimeout(loadPoliticsContent, 500);
  }
  
  // Add a cleanup function to run when the extension is unloaded
  function cleanup() {
    log('Cleaning up extension...');
    
    try {
      // If we're navigating away from the politics page, don't do anything
      // as we're doing a full page reload anyway
      if (window.__gn_politics_navigating_away) {
        log('Navigating away, skipping cleanup');
        return;
      }
      
      // Disconnect the observer
      if (observer) {
        observer.disconnect();
      }
      
      // Remove our politics containers if they exist
      const elementsToRemove = [
        '#gn-politics-container',
        '#gn-politics-location-container',
        '#gn-politics-link',
        '#header-navbar-politics'
      ];
      
      elementsToRemove.forEach(selector => {
        const element = document.querySelector(selector);
        if (element && element.parentNode) {
          try {
            element.parentNode.removeChild(element);
            log(`Removed ${selector}`);
          } catch (e) {
            log(`Error removing ${selector}:`, e);
            // If we can't remove it, hide it
            element.style.display = 'none';
          }
        }
      });
      
      // Remove any global variables we've added
      const globalsToRemove = [
        '__gn_politics_loaded',
        '__gn_politics_location',
        '__gn_original_content',
        '__gn_content_injection_mode',
        '__gn_politics_navigation_active',
        '__gn_politics_navigating_away',
        '__gn_politics_injected',
        '__gn_politics_active_tab'
      ];
      
      globalsToRemove.forEach(varName => {
        if (window[varName] !== undefined) {
          try {
            delete window[varName];
            log(`Removed global variable ${varName}`);
          } catch (e) {
            log(`Error removing global variable ${varName}:`, e);
          }
        }
      });
      
      log('Extension cleanup complete');
    } catch (e) {
      logError('Error during extension cleanup:', e);
    }
  }
  
  // Register the cleanup function to run when the extension is unloaded
  window.addEventListener('beforeunload', cleanup);
  
  // Handle back button navigation
  window.addEventListener('popstate', function(e) {
    log('Popstate event detected');
    
    // If we're on the politics page and the user hits back
    if (window.__gn_politics_loaded) {
      log('On politics page and popstate detected, doing full reload');
      
      // Set the navigating away flag
      window.__gn_politics_navigating_away = true;
      
      // Force a full page reload to ensure clean state
      window.location.reload();
    }
  });
})();

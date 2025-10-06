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
        
        button.addEventListener('click', async () => {
          // Update active tab
          tabButtons.forEach(btn => btn.classList.remove('active'));
          button.classList.add('active');
          
          // Store the active tab
          window.__gn_politics_active_tab = tabName;
          
          // Load the tab content (async)
          try {
            await loadTabContent(tabName, displayLocation);
          } catch (error) {
            logError(`Error loading ${tabName} tab: ${error.message}`);
          }
        });
      });
      
      // Load the default tab content (News)
      (async () => {
        try {
          await loadTabContent(window.__gn_politics_active_tab, displayLocation);
        } catch (error) {
          logError(`Error loading initial tab: ${error.message}`);
        }
      })();
    }, 100);
  }
  
  // Function to load the content for a specific tab
  async function loadTabContent(tabName, location) {
    log(`Loading ${tabName} tab content for ${location}`);
    
    const contentContainer = document.querySelector('.politics-location-content');
    if (!contentContainer) {
      logError('Could not find politics content container');
      return;
    }
    
    // Clear existing content
    contentContainer.innerHTML = '';
    
    // Show loading indicator
    contentContainer.innerHTML = '<div class="loading-indicator">Loading content...</div>';
    
    try {
      // Load content based on tab name
      switch(tabName) {
        case 'News':
          // Handle async loading for News tab
          await loadNewsTabContent(contentContainer, location);
          break;
        case 'Events':
          loadEventsTabContent(contentContainer, location);
          break;
        case 'Politicians':
          // Handle async loading for Politicians tab
          await loadPoliticiansTabContent(contentContainer, location);
          break;
        case 'Issues':
          loadIssuesTabContent(contentContainer, location);
          break;
        default:
          // Handle async loading for default News tab
          await loadNewsTabContent(contentContainer, location);
      }
    } catch (error) {
      logError(`Error loading ${tabName} tab: ${error.message}`);
      contentContainer.innerHTML = `<div class="error-message">Error loading content. Please try again.</div>`;
    }
  }
  
  // Function to load the News tab content
  async function loadNewsTabContent(container, location) {
    // Show loading indicator
    container.innerHTML = '<div class="loading-indicator">Loading news content...</div>';
    
    try {
      // Get URLs for all news images
      const supremeCourtImgUrl = getExtensionResourceUrl('media/supreme_court.jpg');
      const healthcareBillImgUrl = getExtensionResourceUrl('media/healthcare_bill.jpg');
      const euTradeImgUrl = getExtensionResourceUrl('media/eu_trade.jpg');
      const presidentialDebateImgUrl = getExtensionResourceUrl('media/presidential_debate.jpeg');
      
      // Debug log the image URLs
      log('News Image URLs:');
      log('- Supreme Court:', supremeCourtImgUrl);
      log('- Healthcare Bill:', healthcareBillImgUrl);
      log('- EU Trade:', euTradeImgUrl);
      log('- Presidential Debate:', presidentialDebateImgUrl);
      
      // Try to preload all images
      const [supremeCourtImg, healthcareBillImg, euTradeImg, presidentialDebateImg] = 
        await Promise.all([
          preloadImage(supremeCourtImgUrl).catch(() => 'https://via.placeholder.com/800x400?text=Supreme+Court'),
          preloadImage(healthcareBillImgUrl).catch(() => 'https://via.placeholder.com/400x200?text=Healthcare+Bill'),
          preloadImage(euTradeImgUrl).catch(() => 'https://via.placeholder.com/400x200?text=EU+Trade'),
          preloadImage(presidentialDebateImgUrl).catch(() => 'https://via.placeholder.com/400x200?text=Presidential+Debate')
        ]);
      
      // Log successful image loading
      log('All news images loaded successfully');
      
      container.innerHTML = `
      <div class="news-tab-content">
        <div class="featured-story">
          <img src="${supremeCourtImg}" alt="Supreme Court Rules on Major Election Law Case">
          <div class="story-details">
            <div class="story-meta">
              <span class="story-category">FEATURED</span>
              <span class="bias-indicator center">Center</span>
            </div>
            <h2>Supreme Court Rules on Major Election Law Case</h2>
            <p>The Supreme Court issued a landmark ruling today that will have significant implications for upcoming elections across the country...</p>
            <div class="coverage-meter">
              <div class="meter-container">
                <div class="meter-left" style="width: 25%"></div>
                <div class="meter-center" style="width: 30%"></div>
                <div class="meter-right" style="width: 45%"></div>
              </div>
              <span>45% Right Coverage</span>
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
            <img src="${healthcareBillImg}" alt="New Major Healthcare Bill Advances in Senate">
            <div class="story-details">
              <div class="story-meta">
                <span class="story-category">POLICY</span>
                <span class="bias-indicator left">Left</span>
              </div>
              <h3>New Major Healthcare Bill Advances in Senate</h3>
              <p>The controversial healthcare bill has advanced to the next stage after a narrow vote...</p>
              <div class="coverage-meter">
                <div class="meter-container">
                  <div class="meter-left" style="width: 65%"></div>
                  <div class="meter-center" style="width: 20%"></div>
                  <div class="meter-right" style="width: 15%"></div>
                </div>
                <span>65% Left Coverage</span>
              </div>
              <div class="story-footer">
                <div class="sources">8 sources</div>
                <div class="time">5 hours ago</div>
              </div>
            </div>
          </div>
          
          <div class="story-card">
            <img src="${euTradeImg}" alt="Trade Agreement with European Union Finalized">
            <div class="story-details">
              <div class="story-meta">
                <span class="story-category">INTERNATIONAL</span>
                <span class="bias-indicator right">Right</span>
              </div>
              <h3>Trade Agreement with European Union Finalized</h3>
              <p>After months of negotiations, the new trade agreement has been finalized...</p>
              <div class="coverage-meter">
                <div class="meter-container">
                  <div class="meter-left" style="width: 15%"></div>
                  <div class="meter-center" style="width: 13%"></div>
                  <div class="meter-right" style="width: 72%"></div>
                </div>
                <span>72% Right Coverage</span>
              </div>
              <div class="story-footer">
                <div class="sources">10 sources</div>
                <div class="time">1 day ago</div>
              </div>
            </div>
          </div>
          
          <div class="story-card">
            <img src="${presidentialDebateImg}" alt="Presidential Debate Ratings Hit Record High">
            <div class="story-details">
              <div class="story-meta">
                <span class="story-category">ELECTION</span>
                <span class="bias-indicator center-right">Center-Right</span>
              </div>
              <h3>Presidential Debate Ratings Hit Record High</h3>
              <p>Last night's presidential debate drew the highest viewership in history...</p>
              <div class="coverage-meter">
                <div class="meter-container">
                  <div class="meter-left" style="width: 20%"></div>
                  <div class="meter-center" style="width: 50%"></div>
                  <div class="meter-right" style="width: 30%"></div>
                </div>
                <span>50% Center Coverage</span>
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
    } catch (error) {
      logError(`Error loading news images: ${error.message}`);
      
      // Fallback to placeholder images if image loading fails
      container.innerHTML = `
      <div class="news-tab-content">
        <div class="featured-story">
          <img src="https://via.placeholder.com/800x400?text=Featured+Story" alt="Featured story">
          <div class="story-details">
            <div class="story-meta">
              <span class="story-category">FEATURED</span>
              <span class="bias-indicator center">Center</span>
            </div>
            <h2>Supreme Court Rules on Major Election Law Case</h2>
            <p>The Supreme Court issued a landmark ruling today that will have significant implications for upcoming elections across the country...</p>
            <!-- Rest of the featured story content -->
          </div>
        </div>
        
        <div class="stories-grid">
          <!-- Placeholder story cards -->
        </div>
        
        <div class="politics-footer">
          <div class="story-count">Showing 4 of 42 stories</div>
          <button class="load-more-btn">Load More Stories</button>
        </div>
      </div>
      `;
    }
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
  
  // Function to preload an image and check if it can be loaded
  function preloadImage(src) {
    return new Promise((resolve, reject) => {
      try {
        // Create a new image element
        const img = new Image();
        
        // Set a timeout to prevent hanging on slow image loads
        const timeout = setTimeout(() => {
          log(`Image load timeout for: ${src}`);
          resolve('https://via.placeholder.com/300x300/cccccc/666666?text=Image+Timeout');
        }, 5000); // 5 second timeout
        
        // Set up event handlers
        img.onload = () => {
          clearTimeout(timeout);
          log(`Successfully loaded image: ${src}`);
          resolve(src);
        };
        
        img.onerror = () => {
          clearTimeout(timeout);
          log(`Failed to load image: ${src}`);
          resolve('https://via.placeholder.com/300x300/cccccc/666666?text=Image+Error');
        };
        
        // Start loading the image
        img.src = src;
      } catch (error) {
        log(`Error in preloadImage: ${error.message}`);
        resolve('https://via.placeholder.com/300x300/cccccc/666666?text=Image+Error');
      }
    });
  }
  
  // Function to check if browser supports AVIF format
  function checkAvifSupport() {
    // Create a test image element
    const img = new Image();
    
    // Set up event handlers
    return new Promise((resolve) => {
      img.onload = function() {
        // If image loads, AVIF is supported
        resolve(true);
      };
      
      img.onerror = function() {
        // If error occurs, AVIF is not supported
        resolve(false);
      };
      
      // Use a data URL with AVIF signature
      img.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK';
    });
  }
  
  // Function to get the extension's base URL for resources
  function getExtensionResourceUrl(resourcePath) {
    // For Chrome extensions
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      return chrome.runtime.getURL(resourcePath);
    }
    
    // For Firefox extensions
    if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.getURL) {
      return browser.runtime.getURL(resourcePath);
    }
    
    // Fallback to relative path if not in extension context
    return resourcePath;
  }
  
  // Function to load the Politicians tab content
  async function loadPoliticiansTabContent(container, location) {
    // Check if browser supports AVIF format
    const avifSupported = await checkAvifSupport();
    
    // Get URLs for all politician images
    const dickSchoofImgUrl = getExtensionResourceUrl('media/dick_schoof.jpg');
    const sigridKaagImgUrl = getExtensionResourceUrl('media/sigrid_kaag.png');
    const jesseKlaverImgUrl = getExtensionResourceUrl('media/jesse_klaver.jpg');
    
    // Debug log the image URLs
    log('Image URLs:');
    log('- Dick Schoof:', dickSchoofImgUrl);
    log('- Sigrid Kaag:', sigridKaagImgUrl);
    log('- Jesse Klaver:', jesseKlaverImgUrl);
    
    // Get URLs for AVIF images with fallbacks
    const geertWildersImgUrl = avifSupported ? 
      getExtensionResourceUrl('media/geert_wilders.avif') : 
      'https://via.placeholder.com/300x300/ef4444/ffffff?text=Geert+Wilders';
      
    const wopkeHoekstraImgUrl = avifSupported ? 
      getExtensionResourceUrl('media/wopke_hoekstra.avif') : 
      'https://via.placeholder.com/300x300/3b82f6/ffffff?text=Wopke+Hoekstra';
      
    const lilianMarijnissenImgUrl = avifSupported ? 
      getExtensionResourceUrl('media/lilian_marijnissen.avif') : 
      'https://via.placeholder.com/300x300/ef4444/ffffff?text=Lilian+Marijnissen';
    
    // Try to preload all images
    try {
      const [dickSchoofImg, sigridKaagImg, jesseKlaverImg, geertWildersImg, wopkeHoekstraImg, lilianMarijnissenImg] = 
        await Promise.all([
          preloadImage(dickSchoofImgUrl).catch(() => 'https://via.placeholder.com/300x300/3b82f6/ffffff?text=Dick+Schoof'),
          preloadImage(sigridKaagImgUrl).catch(() => 'https://via.placeholder.com/300x300/3b82f6/ffffff?text=Sigrid+Kaag'),
          preloadImage(jesseKlaverImgUrl).catch(() => 'https://via.placeholder.com/300x300/ef4444/ffffff?text=Jesse+Klaver'),
          preloadImage(geertWildersImgUrl).catch(() => 'https://via.placeholder.com/300x300/ef4444/ffffff?text=Geert+Wilders'),
          preloadImage(wopkeHoekstraImgUrl).catch(() => 'https://via.placeholder.com/300x300/3b82f6/ffffff?text=Wopke+Hoekstra'),
          preloadImage(lilianMarijnissenImgUrl).catch(() => 'https://via.placeholder.com/300x300/ef4444/ffffff?text=Lilian+Marijnissen')
        ]);
      
      // Log successful image loading
      log('All politician images loaded successfully');
      
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
            <img src="${dickSchoofImg}" alt="Dick Schoof" class="politician-image">
            <div class="politician-details">
              <h3>Dick Schoof</h3>
              <p class="politician-position">Prime Minister</p>
              <p class="politician-party">VVD (People's Party for Freedom and Democracy)</p>
              <div class="politician-stats">
                <div class="stat">
                  <span class="stat-label">In Office Since</span>
                  <span class="stat-value">2024</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Approval</span>
                  <span class="stat-value">62%</span>
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
            <img src="${sigridKaagImg}" alt="Sigrid Kaag" class="politician-image">
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
            <img src="${geertWildersImg}" alt="Geert Wilders" class="politician-image">
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
            <img src="${jesseKlaverImg}" alt="Jesse Klaver" class="politician-image">
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
            <img src="${wopkeHoekstraImg}" alt="Wopke Hoekstra" class="politician-image">
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
            <img src="${lilianMarijnissenImg}" alt="Lilian Marijnissen" class="politician-image">
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
    // After setting container.innerHTML in loadPoliticiansTabContent function
    // Add this code right before the closing of the try block

    // Add event listeners to profile buttons
    const dickSchoofProfileBtn = container.querySelector('.politician-card:first-child .view-profile-btn');
    if (dickSchoofProfileBtn) {
    dickSchoofProfileBtn.addEventListener('click', () => {
        // Show Dick Schoof's profile
        displayPoliticianProfile(container, 'dick-schoof', location);
    });
    }

    // For other politicians, show a "coming soon" message
    const otherProfileBtns = container.querySelectorAll('.politician-card:not(:first-child) .view-profile-btn');
    otherProfileBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Show generic profile page
        displayPoliticianProfile(container, 'other', location);
    });
    });
    } catch (error) {
      logError(`Error loading politician images: ${error.message}`);
      
      // Fallback to placeholder images if image loading fails
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
            <img src="https://via.placeholder.com/300x300/3b82f6/ffffff?text=Dick+Schoof" alt="Dick Schoof" class="politician-image">
            <!-- Rest of the politician cards with placeholder images -->
          </div>
          <!-- Add more placeholder cards as needed -->
        </div>
        
        <div class="politicians-footer">
          <div class="politician-count">Showing 6 of 24 politicians</div>
          <button class="load-more-btn">Load More Politicians</button>
        </div>
      </div>
      `;
    }
  }
  
  // Function to display a politician profile page
  async function displayPoliticianProfile(container, politicianId, location) {
    // Show loading indicator
    container.innerHTML = '<div class="loading-indicator">Loading profile...</div>';
    
    try {
      // For now, we only have Dick Schoof's profile implemented
      if (politicianId === 'dick-schoof') {
        // Get URL for Dick Schoof's image
        const dickSchoofImgUrl = getExtensionResourceUrl('media/dick_schoof.jpg');
        
        // Try to preload the image
        const dickSchoofImg = await preloadImage(dickSchoofImgUrl)
          .catch(() => 'https://via.placeholder.com/400x500/3b82f6/ffffff?text=Dick+Schoof');
        
        // Render the profile page
        container.innerHTML = `
          <div class="politician-profile">
            <div class="profile-header">
              <button class="back-button">← Back to Politicians</button>
              <h1>Dick Schoof</h1>
              <p class="politician-role">Prime Minister of the Netherlands</p>
            </div>
            
            <div class="profile-content">
              <div class="profile-sidebar">
                <div class="profile-image-container">
                  <img src="${dickSchoofImg}" alt="Dick Schoof" class="profile-image">
                </div>
                
                <div class="profile-stats">
                  <h3>Key Information</h3>
                  <div class="profile-stat">
                    <span class="stat-label">Political Party</span>
                    <span class="stat-value">VVD (People's Party for Freedom and Democracy)</span>
                  </div>
                  <div class="profile-stat">
                    <span class="stat-label">In Office Since</span>
                    <span class="stat-value">2024</span>
                  </div>
                  <div class="profile-stat">
                    <span class="stat-label">Previous Position</span>
                    <span class="stat-value">Head of Intelligence Service</span>
                  </div>
                  <div class="profile-stat">
                    <span class="stat-label">Born</span>
                    <span class="stat-value">February 6, 1957</span>
                  </div>
                  <div class="profile-stat">
                    <span class="stat-label">Education</span>
                    <span class="stat-value">Utrecht University (Law)</span>
                  </div>
                </div>
                
                <div class="profile-actions">
                  <button class="follow-btn large">Follow</button>
                  <button class="compare-btn">Compare with Other Politicians</button>
                </div>
              </div>
              
              <div class="profile-main">
                <div class="profile-section">
                  <div class="video-header">
                    <h2>Video Summary</h2>
                    <img src="${getExtensionResourceUrl('media/icons8-ai-48.png')}" alt="AI Generated" class="ai-icon">
                  </div>
                  <div class="video-container">
                    <div class="video-placeholder" style="background-image: url('${getExtensionResourceUrl('media/dick-schoof-video-cover.jpg')}'); background-size: cover; background-position: center;">
                      <img src="${getExtensionResourceUrl('media/icons8-play-30.png')}" alt="Play" class="play-button">
                    </div>
                  </div>
                </div>
                
                <div class="profile-section">
                  <div class="video-header">
                    <h2>Biography</h2>
                    <img src="${getExtensionResourceUrl('media/icons8-ai-48.png')}" alt="AI Generated" class="ai-icon">
                  </div>
                  <p>Dick Schoof is a Dutch politician and civil servant who became Prime Minister of the Netherlands in 2024. Before his appointment as Prime Minister, Schoof served as the head of the Dutch General Intelligence and Security Service (AIVD).</p>
                  <p>With a background in national security and public administration, Schoof has held various high-ranking positions within the Dutch government. His leadership style is characterized by pragmatism and a focus on security issues.</p>
                  <p>As Prime Minister, he leads a coalition government and has prioritized economic stability, national security, and European cooperation in his policy agenda.</p>
                </div>
                
                <div class="profile-section">
                  <div class="video-header">
                    <h2>Key Policy Positions</h2>
                    <img src="${getExtensionResourceUrl('media/icons8-ai-48.png')}" alt="AI Generated" class="ai-icon">
                  </div>
                  <div class="policy-position">
                    <h3>Economy</h3>
                    <div class="position-meter">
                      <div class="meter-container">
                        <div class="meter-fill" style="width: 65%"></div>
                      </div>
                      <span>Center-Right</span>
                    </div>
                    <p>Advocates for fiscal discipline, tax cuts for businesses, and reduced government regulation to stimulate economic growth.</p>
                  </div>
                  
                  <div class="policy-position">
                    <h3>Immigration</h3>
                    <div class="position-meter">
                      <div class="meter-container">
                        <div class="meter-fill" style="width: 70%"></div>
                      </div>
                      <span>Center-Right</span>
                    </div>
                    <p>Supports controlled immigration with an emphasis on integration and contribution to Dutch society and economy.</p>
                  </div>
                  
                  <div class="policy-position">
                    <h3>European Union</h3>
                    <div class="position-meter">
                      <div class="meter-container">
                        <div class="meter-fill" style="width: 55%"></div>
                      </div>
                      <span>Moderate</span>
                    </div>
                    <p>Favors European cooperation but emphasizes the importance of national sovereignty on key issues.</p>
                  </div>
                </div>
                
                <div class="profile-section">
                  <h2>Recent Activity</h2>
                  <div class="activity-timeline">
                    <div class="activity-item">
                      <div class="activity-date">October 2, 2025</div>
                      <div class="activity-content">
                        <h3>Speech at EU Summit</h3>
                        <p>Addressed European leaders on security cooperation and economic challenges facing the EU.</p>
                      </div>
                    </div>
                    
                    <div class="activity-item">
                      <div class="activity-date">September 28, 2025</div>
                      <div class="activity-content">
                        <h3>Proposed Budget Reforms</h3>
                        <p>Introduced a package of fiscal reforms aimed at reducing government debt while maintaining essential services.</p>
                      </div>
                    </div>
                    
                    <div class="activity-item">
                      <div class="activity-date">September 15, 2025</div>
                      <div class="activity-content">
                        <h3>Meeting with NATO Secretary General</h3>
                        <p>Discussed the Netherlands' commitment to NATO and regional security concerns.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
        
        // Add event listener to the back button
        const backButton = container.querySelector('.back-button');
        if (backButton) {
          backButton.addEventListener('click', () => {
            // Go back to the politicians tab
            loadTabContent('Politicians', location);
          });
        }
        
        // Add event listener to the video placeholder
        const videoPlaceholder = container.querySelector('.video-placeholder');
        if (videoPlaceholder) {
          videoPlaceholder.addEventListener('click', () => {
            // For the prototype, just show an alert
            alert('Video playback would start here in the full implementation.');
          });
        }
      } else {
        // For other politicians, show a "coming soon" message
        container.innerHTML = `
          <div class="politician-profile">
            <div class="profile-header">
              <button class="back-button">← Back to Politicians</button>
              <h1>Profile Coming Soon</h1>
            </div>
            <div class="profile-content">
              <p>Detailed profile for this politician is under development.</p>
            </div>
          </div>
        `;
        
        // Add event listener to the back button
        const backButton = container.querySelector('.back-button');
        if (backButton) {
          backButton.addEventListener('click', () => {
            // Go back to the politicians tab
            loadTabContent('Politicians', location);
          });
        }
      }
    } catch (error) {
      logError(`Error loading politician profile: ${error.message}`);
      container.innerHTML = `<div class="error-message">Error loading profile. Please try again.</div>`;
    }
  }
  
  // Function to display a detailed issue page
  async function displayIssueDetail(container, location, issueTitle) {
    log(`Displaying detailed page for issue: ${issueTitle}`);
    
    try {
      // Get URL for issue cover image
      let coverImageUrl;
      if (issueTitle === "Housing Crisis") {
        coverImageUrl = getExtensionResourceUrl('media/housing_crisis.webp');
      } else if (issueTitle === "Climate Policy") {
        coverImageUrl = getExtensionResourceUrl('media/climate_policy.jpg');
      } else if (issueTitle === "Immigration Reform") {
        coverImageUrl = getExtensionResourceUrl('media/immigration_reform.jpg');
      } else {
        coverImageUrl = 'https://via.placeholder.com/800x400?text=Issue+Image';
      }
      
      // Try to preload the image
      const coverImage = await preloadImage(coverImageUrl).catch(() => coverImageUrl);
      
      if (issueTitle === "Housing Crisis") {
        container.innerHTML = `
          <div class="issue-detail">
            <div class="issue-detail-header">
              <button class="back-button">← Back to Issues</button>
              <div class="issue-title-container">
                <h1>Housing Crisis</h1>
                <div class="issue-trend trending-up">↑ 24%</div>
              </div>
              <p class="issue-subtitle">A comprehensive analysis of the housing shortage in the Netherlands</p>
            </div>
            
            <div class="issue-detail-section">
              <div class="video-header">
                <h2>Video Summary</h2>
                <img src="${getExtensionResourceUrl('media/icons8-ai-48.png')}" alt="AI Generated" class="ai-icon">
              </div>
              <div class="video-container">
                <div class="video-placeholder" style="background-image: url('${coverImage}'); background-size: cover; background-position: center;">
                  <img src="${getExtensionResourceUrl('media/icons8-play-30.png')}" alt="Play" class="play-button">
                </div>
              </div>
            </div>
            
            <div class="issue-detail-content">
              <div class="issue-detail-section">
                <div class="video-header">
                  <h2>Overview</h2>
                  <img src="${getExtensionResourceUrl('media/icons8-ai-48.png')}" alt="AI Generated" class="ai-icon">
                </div>
                <p>The Netherlands is facing one of its most severe housing crises in recent history. Housing shortages and affordability concerns continue to be a major political issue across the country, with particular impact in urban areas like Amsterdam and Utrecht. The crisis affects various segments of the population, from students to middle-income families, and has become a key political issue.</p>
                <p>The housing shortage is estimated at approximately 330,000 homes nationwide, with projections suggesting this number could grow to 400,000 by 2030 without significant intervention. Housing prices have increased by over 60% in the past decade, while rental prices in the private sector have seen similar increases.</p>
              </div>
              
              <div class="issue-detail-section">
                <div class="video-header">
                  <h2>Key Statistics</h2>
                </div>
                <div class="issue-stats-grid">
                  <div class="issue-stat-card">
                    <div class="stat-number">330,000</div>
                    <div class="stat-description">Current housing shortage</div>
                  </div>
                  <div class="issue-stat-card">
                    <div class="stat-number">+60%</div>
                    <div class="stat-description">Housing price increase in last decade</div>
                  </div>
                  <div class="issue-stat-card">
                    <div class="stat-number">10+ years</div>
                    <div class="stat-description">Average wait time for social housing</div>
                  </div>
                  <div class="issue-stat-card">
                    <div class="stat-number">35%</div>
                    <div class="stat-description">Of income spent on housing (average)</div>
                  </div>
                </div>
              </div>
              
              <div class="issue-detail-section">
                <div class="video-header">
                  <h2>Political Positions</h2>
                  <img src="${getExtensionResourceUrl('media/icons8-ai-48.png')}" alt="AI Generated" class="ai-icon">
                </div>
                <div class="position-spectrum detailed">
                  <div class="position left">
                    <span class="position-label">Left</span>
                    <h3>Increase Social Housing</h3>
                    <p>Left-leaning parties advocate for significant government investment in social housing, implementing strict rent controls, and limiting the influence of private investors in the housing market.</p>
                    <p>Key proposals include:</p>
                    <ul>
                      <li>Building 100,000 new social housing units per year</li>
                      <li>Implementing national rent caps</li>
                      <li>Restricting buy-to-let investments</li>
                      <li>Increasing taxes on multiple property ownership</li>
                    </ul>
                  </div>
                  <div class="position center">
                    <span class="position-label">Center</span>
                    <h3>Mixed Approach</h3>
                    <p>Centrist parties favor a balanced approach combining market incentives with targeted government intervention and subsidies for specific groups.</p>
                    <p>Key proposals include:</p>
                    <ul>
                      <li>Public-private partnerships for housing development</li>
                      <li>Targeted subsidies for first-time buyers</li>
                      <li>Streamlining building permit processes</li>
                      <li>Moderate expansion of social housing stock</li>
                    </ul>
                  </div>
                  <div class="position right">
                    <span class="position-label">Right</span>
                    <h3>Market Solutions</h3>
                    <p>Right-leaning parties emphasize reducing regulations to stimulate private sector development, arguing that market forces will eventually correct the housing shortage.</p>
                    <p>Key proposals include:</p>
                    <ul>
                      <li>Relaxing zoning restrictions</li>
                      <li>Tax incentives for developers</li>
                      <li>Reducing environmental regulations for new construction</li>
                      <li>Privatizing portions of the social housing sector</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div class="issue-detail-section">
                <div class="video-header">
                  <h2>Recent Developments</h2>
                </div>
                <div class="timeline">
                  <div class="timeline-item">
                    <div class="timeline-date">Sept 2025</div>
                    <div class="timeline-content">
                      <h3>National Housing Accord</h3>
                      <p>The government announced a new National Housing Accord aimed at building 900,000 new homes by 2030, with specific targets for affordable and social housing units.</p>
                    </div>
                  </div>
                  <div class="timeline-item">
                    <div class="timeline-date">July 2025</div>
                    <div class="timeline-content">
                      <h3>Rent Control Legislation</h3>
                      <p>Parliament passed controversial legislation extending rent control measures to more segments of the private rental market in major cities.</p>
                    </div>
                  </div>
                  <div class="timeline-item">
                    <div class="timeline-date">May 2025</div>
                    <div class="timeline-content">
                      <h3>Housing Protests</h3>
                      <p>Major demonstrations took place in Amsterdam, Rotterdam, and Utrecht, with protesters demanding immediate government action on the housing crisis.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="issue-detail-section">
                <div class="video-header">
                  <h2>Media Coverage Analysis</h2>
                  <img src="${getExtensionResourceUrl('media/icons8-ai-48.png')}" alt="AI Generated" class="ai-icon">
                </div>
                <div class="coverage-analysis">
                  <div class="media-analysis-card full-width">
                    <h3>Political Leaning of Coverage</h3>
                    <div class="coverage-meter">
                      <div class="meter-container">
                        <div class="meter-left" style="width: 30%"></div>
                        <div class="meter-center" style="width: 30%"></div>
                        <div class="meter-right" style="width: 40%"></div>
                      </div>
                      <span>40% Right Coverage</span>
                    </div>
                  </div>
                  
                  <div class="media-analysis-insight">
                    <h3>Key Insights</h3>
                    <p>Media coverage of the housing crisis tends to reflect political divisions, with left-leaning outlets emphasizing social inequality aspects and right-leaning sources focusing on regulatory barriers to development. The majority of coverage (40%) comes from right-leaning sources, which typically frame the issue in terms of market solutions and regulatory reform.</p>
                  </div>
                  
                  <div class="media-sources-grid">
                    <div class="media-source-card">
                      <div class="source-icon left">DV</div>
                      <div class="source-details">
                        <h4>De Volkskrant</h4>
                        <div class="source-stats">
                          <span>18 articles</span>
                          <span class="bias-indicator left">Left-leaning</span>
                        </div>
                      </div>
                    </div>
                    
                    <div class="media-source-card">
                      <div class="source-icon center">NRC</div>
                      <div class="source-details">
                        <h4>NRC Handelsblad</h4>
                        <div class="source-stats">
                          <span>15 articles</span>
                          <span class="bias-indicator center">Center</span>
                        </div>
                      </div>
                    </div>
                    
                    <div class="media-source-card">
                      <div class="source-icon right">RTL</div>
                      <div class="source-details">
                        <h4>RTL Nieuws</h4>
                        <div class="source-stats">
                          <span>12 articles</span>
                          <span class="bias-indicator right">Right-leaning</span>
                        </div>
                      </div>
                    </div>
                    
                    <div class="media-source-card">
                      <div class="source-icon center">NOS</div>
                      <div class="source-details">
                        <h4>NOS</h4>
                        <div class="source-stats">
                          <span>10 articles</span>
                          <span class="bias-indicator center">Center</span>
                        </div>
                      </div>
                    </div>
                    
                    <div class="media-source-card">
                      <div class="source-icon right">FD</div>
                      <div class="source-details">
                        <h4>Het Financieele Dagblad</h4>
                        <div class="source-stats">
                          <span>9 articles</span>
                          <span class="bias-indicator right">Right-leaning</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
        
        // Add event listener to the back button
        const backButton = container.querySelector('.back-button');
        if (backButton) {
          backButton.addEventListener('click', () => {
            // Go back to the issues tab
            loadTabContent('Issues', location);
          });
        }
        
        // Add event listener to the video placeholder
        const videoPlaceholder = container.querySelector('.video-placeholder');
        if (videoPlaceholder) {
          videoPlaceholder.addEventListener('click', () => {
            // For the prototype, just show an alert
            alert('Video playback would start here in the full implementation.');
          });
        }
      } else {
        // For other issues, show a "coming soon" message
        container.innerHTML = `
          <div class="issue-detail">
            <div class="issue-detail-header">
              <button class="back-button">← Back to Issues</button>
              <h1>Issue Detail Coming Soon</h1>
            </div>
            <div class="issue-detail-content">
              <p>Detailed information for this issue is under development.</p>
            </div>
          </div>
        `;
        
        // Add event listener to the back button
        const backButton = container.querySelector('.back-button');
        if (backButton) {
          backButton.addEventListener('click', () => {
            // Go back to the issues tab
            loadTabContent('Issues', location);
          });
        }
      }
    } catch (error) {
      logError(`Error displaying issue detail: ${error.message}`);
      container.innerHTML = `
        <div class="error-message">
          <h2>Error Loading Issue Detail</h2>
          <p>Sorry, there was a problem loading the issue details. Please try again later.</p>
          <button class="back-button">← Back to Issues</button>
        </div>
      `;
      
      // Add event listener to the back button
      const backButton = container.querySelector('.back-button');
      if (backButton) {
        backButton.addEventListener('click', () => {
          // Go back to the issues tab
          loadTabContent('Issues', location);
        });
      }
    }
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
              <div class="issue-title">
                <h3>Housing Crisis</h3>
                <img src="${getExtensionResourceUrl('media/icons8-ai-48.png')}" alt="AI Generated" class="ai-icon">
              </div>
              <div class="issue-trend trending-up">↑ 24%</div>
            </div>
            <div class="issue-image">
              <img src="${getExtensionResourceUrl('media/housing_crisis.webp')}" alt="Housing Crisis" class="issue-cover-image">
            </div>
            <div class="issue-content">
              <p class="issue-description">Housing shortages and affordability concerns continue to be a major political issue across the Netherlands, with particular impact in urban areas like Amsterdam and Utrecht.</p>
              <div class="issue-stats">
                <div class="stat">
                  <span class="stat-label">Media Coverage</span>
                  <div class="coverage-meter">
                    <div class="meter-container">
                      <div class="meter-left" style="width: 30%"></div>
                      <div class="meter-center" style="width: 30%"></div>
                      <div class="meter-right" style="width: 40%"></div>
                    </div>
                    <span>40% Left Coverage</span>
                  </div>
                </div>
                <div class="stat">
                  <span class="stat-label">Public Interest</span>
                  <div class="coverage-meter">
                    <div class="meter-container">
                      <div class="meter-left" style="width: 30%"></div>
                      <div class="meter-center" style="width: 30%"></div>
                      <div class="meter-right" style="width: 40%"></div>
                    </div>
                    <span>50% Right Interest</span>
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
                <button class="read-more-btn">Read More</button>
              </div>
            </div>
          </div>
          
          <div class="issue-card large">
            <div class="issue-header">
              <div class="issue-title">
                <h3>Climate Policy</h3>
                <img src="${getExtensionResourceUrl('media/icons8-ai-48.png')}" alt="AI Generated" class="ai-icon">
              </div>
              <div class="issue-trend trending-up">↑ 12%</div>
            </div>
            <div class="issue-image">
              <img src="${getExtensionResourceUrl('media/climate_policy.jpg')}" alt="Climate Policy" class="issue-cover-image">
            </div>
            <div class="issue-content">
              <p class="issue-description">Debates over emissions targets and agricultural regulations are intensifying as the EU pushes for stricter climate measures, with significant implications for Dutch industry and agriculture.</p>
              <div class="issue-stats">
                <div class="stat">
                  <span class="stat-label">Media Coverage</span>
                  <div class="coverage-meter">
                    <div class="meter-container">
                      <div class="meter-left" style="width: 30%"></div>
                      <div class="meter-center" style="width: 30%"></div>
                      <div class="meter-right" style="width: 40%"></div>
                    </div>
                    <span>45% Center Coverage</span>
                  </div>
                </div>
                <div class="stat">
                  <span class="stat-label">Public Interest</span>
                  <div class="coverage-meter">
                    <div class="meter-container">
                      <div class="meter-left" style="width: 30%"></div>
                      <div class="meter-center" style="width: 30%"></div>
                      <div class="meter-right" style="width: 40%"></div>
                    </div>
                    <span>68% Left Interest</span>
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
                <button class="read-more-btn">Read More</button>
              </div>
            </div>
          </div>
          
          <div class="issue-card large">
            <div class="issue-header">
              <div class="issue-title">
                <h3>Immigration Reform</h3>
                <img src="${getExtensionResourceUrl('media/icons8-ai-48.png')}" alt="AI Generated" class="ai-icon">
              </div>
              <div class="issue-trend trending-down">↓ 8%</div>
            </div>
            <div class="issue-image">
              <img src="${getExtensionResourceUrl('media/immigration_reform.jpg')}" alt="Immigration Reform" class="issue-cover-image">
            </div>
            <div class="issue-content">
              <p class="issue-description">Discussions about immigration policy and integration continue, with parties divided on approach and implementation of asylum procedures and integration programs.</p>
              <div class="issue-stats">
                <div class="stat">
                  <span class="stat-label">Media Coverage</span>
                  <div class="coverage-meter">
                    <div class="meter-container">
                      <div class="meter-left" style="width: 30%"></div>
                      <div class="meter-center" style="width: 30%"></div>
                      <div class="meter-right" style="width: 40%"></div>
                    </div>
                    <span>65% Right Coverage</span>
                  </div>
                </div>
                <div class="stat">
                  <span class="stat-label">Public Interest</span>
                  <div class="coverage-meter">
                    <div class="meter-container">
                      <div class="meter-left" style="width: 30%"></div>
                      <div class="meter-center" style="width: 30%"></div>
                      <div class="meter-right" style="width: 40%"></div>
                    </div>
                    <span>58% Center Interest</span>
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
                <button class="read-more-btn">Read More</button>
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
    
    // Add event listeners to the Read More buttons
    const readMoreButtons = container.querySelectorAll('.read-more-btn');
    readMoreButtons.forEach((button, index) => {
      button.addEventListener('click', () => {
        // Get the issue title from the parent card
        const issueCard = button.closest('.issue-card');
        const issueTitle = issueCard.querySelector('.issue-title h3').textContent;
        
        // Display the detailed issue page
        displayIssueDetail(container, location, issueTitle);
      });
    });
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

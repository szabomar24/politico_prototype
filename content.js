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
    
    // Create politics container
    const politicsContainer = document.createElement('div');
    politicsContainer.id = 'gn-politics-container';
    politicsContainer.innerHTML = `
      <div class="politics-header">
        <h1>Politics</h1>
        <div class="politics-actions">
          <button class="filter-btn">Filter</button>
          <button class="sort-btn">Sort</button>
        </div>
      </div>
      
      <div class="politics-content">
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
              <h3>New Healthcare Bill Advances in Senate</h3>
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
        
        <div class="bias-spectrum">
          <h2>Political Bias Spectrum</h2>
          <div class="spectrum-bar">
            <span class="left-label">Far Left</span>
            <span class="center-label">Center</span>
            <span class="right-label">Far Right</span>
          </div>
          <p>Ground News helps you identify political bias in news coverage. The color indicators show where each story falls on the political spectrum.</p>
        </div>
        
        <div class="politics-footer">
          <button class="load-more-btn">Load More Stories</button>
          <div class="story-count">Showing 4 of 42 stories</div>
        </div>
      </div>
    `;
    
    // Replace main content
    mainContent.innerHTML = '';
    mainContent.appendChild(politicsContainer);
    
    // Set loaded flag
    window.__gn_politics_loaded = true;
    
    log('Politics content loaded successfully');
  }
  
  // Function to restore original content
  function restoreOriginalContent() {
    if (!window.__gn_original_content) {
      log('No original content to restore');
      return;
    }
    
    const mainContent = document.querySelector('main') || 
                        document.querySelector('#content') || 
                        document.querySelector('.content') || 
                        document.querySelector('.container');
    
    if (mainContent) {
      mainContent.innerHTML = window.__gn_original_content;
      window.__gn_politics_loaded = false;
      log('Original content restored');
    }
  }
  
  // Listen for clicks on other navbar links
  document.addEventListener('click', function(e) {
    // Find if the click was on a navbar link that's not our politics link
    const navLink = e.target.closest('nav a, .navbar a, header ul a');
    if (navLink && navLink.id !== 'gn-politics-link' && navLink.id !== 'header-navbar-politics') {
      // If politics content is loaded, restore original content
      if (window.__gn_politics_loaded) {
        restoreOriginalContent();
      }
    }
  });
  
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
})();

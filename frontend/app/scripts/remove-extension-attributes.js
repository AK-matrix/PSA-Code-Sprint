// Remove browser extension attributes that cause hydration mismatches
(function() {
  'use strict';
  
  // Function to remove extension attributes
  function removeExtensionAttributes() {
    const attributes = ['bis_skin_checked', 'data-bis_skin_checked'];
    
    attributes.forEach(attr => {
      const elements = document.querySelectorAll(`[${attr}]`);
      elements.forEach(element => {
        element.removeAttribute(attr);
      });
    });
  }
  
  // Run immediately
  removeExtensionAttributes();
  
  // Set up observer for dynamic content
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'attributes') {
        const target = mutation.target;
        const attributeName = mutation.attributeName;
        
        if (attributeName && attributeName.includes('bis_skin_checked')) {
          target.removeAttribute(attributeName);
        }
      }
    });
  });
  
  // Start observing when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['bis_skin_checked', 'data-bis_skin_checked'],
        subtree: true
      });
    });
  } else {
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['bis_skin_checked', 'data-bis_skin_checked'],
      subtree: true
    });
  }
  
  // Clean up on page unload
  window.addEventListener('beforeunload', function() {
    observer.disconnect();
  });
})();

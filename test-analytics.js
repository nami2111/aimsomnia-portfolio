// Verification script for Juno Analytics integration
// This script can be used to verify that the analytics are working properly

// Check if the Juno Analytics module is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded and parsed');
  
  // Try to access the analytics module
  import("https://cdn.jsdelivr.net/npm/@junobuild/analytics@0.2.0/+esm")
    .then((module) => {
      console.log('Juno Analytics module loaded successfully:', module);
      
      // Check if initOrbiter function exists
      if (typeof module.initOrbiter === 'function') {
        console.log('initOrbiter function is available');
      } else {
        console.warn('initOrbiter function is not available');
      }
    })
    .catch((error) => {
      console.error('Failed to load Juno Analytics module:', error);
    });
});
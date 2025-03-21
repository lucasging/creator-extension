const checkbox = document.getElementById('checkbox');
const resetPositionButton = document.getElementById('reset-position-button');

// Load the stored checkbox state (if it exists)
chrome.storage.local.get('skipState', function(result) {
  if (result.skipState !== undefined) {
    checkbox.checked = result.skipState;
  } else {
    // If no stored state exists, set it to checked by default
    checkbox.checked = true;
    chrome.storage.local.set({ 'skipState': true }); // Save the default state
  }
});

// Save the checkbox state when changed
checkbox.addEventListener('change', function() {
  chrome.storage.local.set({ 'skipState': checkbox.checked });
});

// Reset the panel position when the button is clicked
resetPositionButton.addEventListener('click', function() {
    // Reset the panel position in Chrome storage
    chrome.storage.local.set({
        panelPosition: {
            top: 20, // Default top position
            left: 20  // Default left position
        }
    }, function() {
        console.log('Panel position reset to default values.');

        // Send a message to the background script to refresh the page
        chrome.runtime.sendMessage({ action: "refreshPage" });
    });
});
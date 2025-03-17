const checkbox = document.getElementById('checkbox');

// Load the stored checkbox state (if it exists)
chrome.storage.local.get('skipState', function(result) {
  if (result.checkboxState !== undefined) {
    checkbox.checked = result.checkboxState;
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
document.getElementById('show-panel-button').addEventListener('click', () => {
    // Get the active tab in the current window
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0].id;

        // Execute the function (or inject the script) on the active tab
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            function: showPanelFunction  // This is the function you want to trigger on the page
        });
    });
});
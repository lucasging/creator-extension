chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openProfile') {
        chrome.tabs.create({ url: request.url }, (tab) => {
            sendResponse({ success: true, tabId: tab.id });
        });
        return true; // Keep the message channel open for sendResponse
    }
    if (request.action === "refreshPage") {
        // Get the active tab and refresh it
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.reload(tabs[0].id); // Refresh the active tab
            }
        });
    }
});

chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.action === "closeTab" && sender.tab) {
        chrome.tabs.remove(sender.tab.id);
    }
});
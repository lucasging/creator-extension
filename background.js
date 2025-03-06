chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openProfile') {
        chrome.tabs.create({ url: request.url }, (tab) => {
            sendResponse({ success: true, tabId: tab.id });
        });
        return true; // Keep the message channel open for sendResponse
    }
});

chrome.webNavigation.onCompleted.addListener(function(details) {
    if (details.url.match('https://*.creator.co/')) {
        chrome.scripting.executeScript({
            target: { tabId: details.tabId },
            files: ['creator.js']  // Manually inject creator.js again on page load
        });
    }
}, { url: [{ hostContains: 'creator.co' }] });

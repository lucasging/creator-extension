chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openProfile') {
        chrome.tabs.create({ url: request.url }, (tab) => {
            sendResponse({ success: true, tabId: tab.id });
        });
        return true; // Keep the message channel open for sendResponse
    }
}); 

chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.action === "closeTab" && sender.tab) {
        chrome.tabs.remove(sender.tab.id);
    }
});
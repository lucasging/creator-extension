// 
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    // opens the first profile in a new tab
    if (request.action === 'openProfile') {
        chrome.tabs.create({ url: request.url });
    }

    // Get the active tab and refresh it
    if (request.action === "refreshPage") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.reload(tabs[0].id);
            }
        });
    }
    // creator.co button (just closes the tab)
    if (message.action === "closeTab" && sender.tab) {
        chrome.tabs.remove(sender.tab.id);
    }
});
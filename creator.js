function addButtonToSearchResults() {
    const searchResultsDiv = document.querySelector('.search-results');

    if (searchResultsDiv) {
        console.log('Found search-results element:', searchResultsDiv);
        
        // Find the header inside search-results
        const header = searchResultsDiv.querySelector('.header');
        if (header) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'ant-btn ant-btn-primary';
            button.style.margin = '10px';
            button.textContent = 'Use Extension';

            header.appendChild(button);
            
            const button2 = document.createElement('button');
            button2.type = 'button';
            button2.className = 'ant-btn ant-btn-primary';
            button2.style.margin = '10px';
            button2.textContent = 'Update';

            header.appendChild(button2);

            button.addEventListener('click', () => {

                chrome.storage.local.set({ 
                    currentIndex: 0,
                    responses: []
                });

                const links = getInstagramLinks();
                console.log('Found Instagram links:', links);
                uploadLinksToProfiles(links);
                const firstProfileUrl = links[0]; // Get the first profile URL
                // Open the first profile in a new tab
                chrome.runtime.sendMessage({ action: 'openProfile', url: firstProfileUrl + "reels/" }, (response) => {
                    if (response.success) {
                        console.log('Profile opened in a new tab:', response.tabId);
                    } else {
                        console.error('Failed to open profile.');
                    }
                });
            });

            button2.addEventListener('click', () => {
                retrieveResponses();
            })
        } else {
            console.log('Header not found inside search-results');
        }
    } else {
        console.log('Search results div not found, waiting for it to load...');

        // Use MutationObserver to detect when search-results appears
        const observer = new MutationObserver((mutations, obs) => {
            const newSearchResultsDiv = document.querySelector('.search-results');
            if (newSearchResultsDiv) {
                obs.disconnect(); // Stop observing
                addButtonToSearchResults(); // Retry function now that it's loaded
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }
}

function retrieveResponses() {
    chrome.storage.local.get(["currentIndex", "responses"], (data) => {
        if (chrome.runtime.lastError) {
            console.error("Error retrieving data:", chrome.runtime.lastError);
        } else {
            console.log("Retrieved data:", data);
            const currentIndex = data.currentIndex || 0;
            const responses = data.responses || [];
    
            console.log("Current Index:", currentIndex);
            console.log("Responses:", responses);

            checkBoxes(responses);
        }
    });
}

function getInstagramLinks() {
    // Get all anchor tags on the page
    const links = document.querySelectorAll('a[href*="instagram.com"]');
    
    // Extract href attributes
    const instagramLinks = Array.from(links).map(link => link.href);

    return instagramLinks;
}

// Function to upload links to profiles.json format
function uploadLinksToProfiles(links) {
    const profilesObject = { profiles: links };

    // Save to chrome.storage.local
    chrome.storage.local.set({ profiles: profilesObject, newListAdded: true }, () => {
        console.log('Profiles saved to storage:', profilesObject);
    });
}

function checkBoxes(whichBoxes) {
    console.log("hi");
    var checkboxes = document.querySelectorAll('input[type="checkbox"]');
    console.log("checkboxes:", checkboxes);
    var startIndex = 1;
    for (var i = startIndex; i < whichBoxes.length+1; i++) {
        if (whichBoxes[i-1]) {
            if (!checkboxes[i].checked) {
                checkboxes[i].click();
            }
        }
    }
}

window.addEventListener('load', () => {
    console.log('Page fully loaded');
    addButtonToSearchResults();
});
let searchResultsFound = false; // Variable to track if the search results div is found

function addButtonToSearchResults() {
    const searchResultsDiv = document.querySelector('.search-results');

    if (searchResultsDiv) {
        // Find the header inside search-results
        const header = searchResultsDiv.querySelector('.header');
        if (header && header.children.length==4) {
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
                var links = getLinks();
                console.log('Found links:', links);

                chrome.storage.local.get(["currentIndex", "profiles", "responses"], (data) => {
                    const currentIndex = data.currentIndex || 0;
                    // Add error handling for undefined profiles
                    if (!data.profiles) {
                        console.log('No existing profiles found, creating new list');
                        var sameList = false;
                        var responses = [];
                        var index = 0;
                    } else {
                        const profiles = data.profiles.profiles;
                        
                        var sameList = true;
                        for (var i = 0; i < 5; i++) {
                            console.log(i, profiles[i], links[i]);
                            if (profiles[i] != links[i]) {
                                sameList = false;
                            }
                        }

                        var index = 0;
                        if (sameList) {
                            index = currentIndex;
                            var responses = data.responses || [];
                        } else {
                            var responses = [];
                        }
                    }

                    if (index >= links.length) {
                        alert("Click load more until you get back to where you were!")
                    } else {
                        uploadLinksToProfiles(links);
                        for (index; (index < links.length && links[index] == 'skip'); index++) {
                            responses.push(false);
                            console.log(index);
                        }

                        chrome.storage.local.set({ 
                            currentIndex: index,
                            profiles: { profiles: links }, // Ensure profiles is properly structured
                            responses: responses
                        });

                        const firstProfileUrl = links[index]; // Get the first profile URL
    
                        // Open the first profile in a new tab
                        chrome.runtime.sendMessage({ action: 'openProfile', url: firstProfileUrl }, (response) => {
                            if (response.success) {
                                console.log('Profile opened in a new tab:', response.tabId);
                            } else {
                                console.error('Failed to open profile.');
                            }
                        });
                    }
                });
            });

            button2.addEventListener('click', () => {
                retrieveResponses();
            });
        }
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

function getLinks() {
    const searchResultsDiv = document.querySelector('.search-results');
    const body = Array.from(searchResultsDiv.querySelectorAll('.body-row')); // Select all rows
    let links = [];
    chrome.storage.local.get('checkboxState', function(result) {
        const isChecked = result.checkboxState;
        console.log("Checkbox is checked:", isChecked);
              
        body.forEach((row, index) => {
            const listsInfoDiv = row.querySelector('div.lists-info'); // Find the div with class .lists-info
            const isEmpty = listsInfoDiv && listsInfoDiv.classList.contains('empty'); // Check if it has the .empty class
            let link = row.querySelector('a[href*="instagram.com"]'); // Find Instagram link inside
            if (!link) {
                link = row.querySelector('a[href*="tiktok.com"]'); // Find Instagram link inside
            }

            if (link && (isEmpty || !isChecked)) {
                links.push(link.href);
            } else {
                console.log(`Link found: ${link} Is Empty: ${isEmpty}`);
                links.push('skip');
            }
        });
      });

    return links;
}

// Function to upload links to profiles.json format
function uploadLinksToProfiles(links) {
    const profilesObject = { profiles: links };

    // Save to chrome.storage.local
    chrome.storage.local.set({ profiles: profilesObject }, () => {
        console.log('Profiles saved to storage:', profilesObject);
    });
}

function checkBoxes(whichBoxes) {
    var checkboxes = document.querySelectorAll('input[type="checkbox"]');

    var filteredCheckboxes = Array.from(checkboxes).filter(checkbox => 
        !checkbox.matches('input#isVerified.ant-checkbox-input') && 
        !checkbox.matches('input#usernameOperator.ant-checkbox-input') && 
        !checkbox.matches('input#registered.ant-checkbox-input')
    );

    var startIndex = 1;
    for (var i = startIndex; i < whichBoxes.length+1; i++) {
        if (whichBoxes[i-1]) {
            if (!filteredCheckboxes[i].checked) {
                filteredCheckboxes[i].click();
            }
        }
    }
}

function checkForSearchResults() {
    setInterval(() => {
        addButtonToSearchResults(); // This function is called every 3 seconds
    }, 3000); // Check every 3 seconds
}

window.addEventListener('popstate', () => {
    // URL has changed, trigger addButtonToSearchResults again
    addButtonToSearchResults();
});


window.addEventListener('load', () => {
    console.log('Page fully loaded');
    addButtonToSearchResults();
});

checkForSearchResults();
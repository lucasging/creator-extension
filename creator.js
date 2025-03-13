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

            button.addEventListener('click', () => {
                var links = getLinks();
                console.log('Found links:', links);

                chrome.storage.local.get(["currentIndex", "profiles", "responses"], (data) => {
                    const currentIndex = data.currentIndex || 0;
                    // If first time, create new list
                    if (!data.profiles) {
                        console.log('No existing profiles found, creating new list');
                        var responses = [];
                        var index = 0;
                    } else {
                        const profiles = data.profiles.profiles;
                        // if same list, use current index and saved responses
                        var index = 0;
                        if (sameFive(profiles, links)) {
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
                        // skip first profiles if already in lists
                        for (index; (index < links.length && links[index].slice(0, 4) == 'skip'); index++) {
                            responses.push(false);
                            console.log(index);
                        }

                        chrome.storage.local.set({ 
                            currentIndex: index,
                            profiles: { profiles: links }, // Ensure profiles is properly structured
                            responses: responses
                        });
    
                        // Open the first profile in a new tab
                        chrome.runtime.sendMessage({ action: 'openProfile', url: links[index]});
                    }
                });
            });
        }
    }
}

function retrieveResponses() {
    var links = getLinks();
    chrome.storage.local.get(["profiles", "responses"], (data) => {
        const profiles = data.profiles.profiles;
        if (sameFive(profiles, links)) {
            var responses = data.responses || [];
            checkBoxes(responses);
        }
    })
}

function getLinks() {
    const searchResultsDiv = document.querySelector('.search-results');
    const body = Array.from(searchResultsDiv.querySelectorAll('.body-row')); // Select all rows
    let links = [];
    chrome.storage.local.get('checkboxState', function(result) {
        const isChecked = result.checkboxState;
              
        body.forEach((row) => {
            const listsInfoDiv = row.querySelector('div.lists-info'); // Find the div with class .lists-info
            const isEmpty = listsInfoDiv && listsInfoDiv.classList.contains('empty'); // Check if it has the .empty class]

            // disgusting code idk how to make better but just adds reels/ to the ig links
            let link = row.querySelector('a[href*="instagram.com"]'); // Find Instagram link inside
            if (!link) {
                link = row.querySelector('a[href*="tiktok.com"]');
                if (link){
                    link = link.href
                }
            } else {
                link = link.href.concat("reels/");
            }

            if (link && (isEmpty || !isChecked)) {
                links.push(link);
            } else {
                console.log(`Link found: ${link} Is Empty: ${isEmpty}`);
                links.push('skip' + link);
            }
        });
      });

    return links;
}

// checks first 5 profiles to see if the list is the same
function sameFive(profiles, links) {
    var sameList = true;
    for (var i = 0; i < 5; i++) {
        if (profiles[i] != links[i] && profiles[i] != links[i].slice(4)) {
            sameList = false;
        }
    }
    return sameList;
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
        retrieveResponses()
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
// OLD DASHBOARD

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
            button.textContent = 'Select Faster';

            header.appendChild(button);

            button.addEventListener('click', () => {
                var checkboxes = getCheckboxes()
                manualClickedCheckboxes(checkboxes);
                firstCheckboxUncheckAll(checkboxes);
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
                        // skip first profiles if already in lists
                        for (index; (index < links.length && links[index].slice(0, 4) == 'skip'); index++) {
                            responses.push(false);
                            console.log(index);
                        }

                        chrome.storage.local.set({ 
                            currentIndex: index,
                            profiles: { profiles: links }, // Ensure profiles is properly structured
                            responses: responses,
                            back: []
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
    chrome.storage.local.get(["profiles", "responses", "back"], (data) => {
        const profiles = data.profiles.profiles;
        const back = data.back;
        if (sameFive(profiles, links)) {
            var responses = data.responses || [];
            backCheckboxes(back);
            checkBoxes(responses);
        }
    })
}

function getCheckboxes() {
    var checkboxes = document.querySelectorAll('input[type="checkbox"]');

    var filteredCheckboxes = Array.from(checkboxes).filter(checkbox => 
        !checkbox.matches('input#isVerified.ant-checkbox-input') && 
        !checkbox.matches('input#usernameOperator.ant-checkbox-input') && 
        !checkbox.matches('input#registered.ant-checkbox-input')
    );

    return filteredCheckboxes;
}

function backCheckboxes(listOfIndex) {
    if (listOfIndex.length > 0) {
        for (var i = 0; i < listOfIndex.length; i++) {
            var checkboxes = getCheckboxes()
            if (checkboxes[listOfIndex[i]+1].checked) {
                checkboxes[listOfIndex[i]+1].click();
            }
        }
        chrome.storage.local.set({back: []});
    }
}

function getLinks() {
    const searchResultsDiv = document.querySelector('.search-results');
    if (!searchResultsDiv) {
        return [];
    }
    const body = Array.from(searchResultsDiv.querySelectorAll('.body-row')); // Select all rows
    let links = [];
    chrome.storage.local.get('skipState', function(result) {
        const isChecked = result.skipState;
              
        body.forEach((row) => {
            const listsInfoDiv = row.querySelector('div.lists-info'); // Find the div with class .lists-info
            const isEmpty = listsInfoDiv && listsInfoDiv.classList.contains('empty'); // Check if it has the .empty class]

            // disgusting code idk how to make better but just adds reels/ to the ig links
            let link = row.querySelector('a[href*="instagram.com"]'); // Find Instagram link inside
            if (!link) {
                link = row.querySelector('a[href*="tiktok.com"]');
                if (!link) {
                    link = row.querySelector('a[href*="youtube.com"]')
                }
                if (link){
                    link = link.href
                }
            } else {
                link = link.href.concat("reels/");
            }

            if (link && (isEmpty || !isChecked)) {
                links.push(link);
            } else {
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

function checkBoxes(whichBoxes) {
    var checkboxes = getCheckboxes()
    for (var i = 1; i < whichBoxes.length+1; i++) {
        if (whichBoxes[i-1]) {
            if (!checkboxes[i].checked) {
                checkboxes[i].click();
            }
        }
    }
}

function manualClickedCheckboxes(checkboxes) {
    for (var i = 0; i < checkboxes.length; i++) {
        (function(index) {
            checkboxes[index].addEventListener("change", (event) => {
                chrome.storage.local.get(["responses"], (data) => {
                    const responses = data.responses;
                    responses[index] = event.target.checked;
                    chrome.storage.local.set({"responses": responses});
                });
            });
        })(i);
    }
};

function firstCheckboxUncheckAll(checkboxes) {
    checkboxes[0].addEventListener("change", () => {
        var n = checkboxes.length;
        chrome.storage.local.set({"responses": Array(n).fill(false)})
    })
}

function checkForSearchResults() {
    setInterval(() => {
        addButtonToSearchResults(); // This function is called every 3 seconds
        retrieveResponses()
    }, 3000); // Check every 3 seconds
}

checkForSearchResults();
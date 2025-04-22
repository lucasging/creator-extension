let searchResultsFound = false; // Variable to track if the search results div is found

function addButtonToSearchResults() {
    const searchResultsDiv = document.querySelector('.table-wrapper');

    if (searchResultsDiv) {
        // Find the header inside search-results
        const header = searchResultsDiv.querySelector('.ant-table-thead');
        const rows = header.querySelectorAll('th');
        const row = rows[rows.length-1];
        if (header && row.children.length==0) {
            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.justifyContent = 'flex-end';
            wrapper.style.width = '100%';

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'ant-btn ant-btn-primary';
            button.style.margin = '10px';
            button.textContent = 'Select Faster';

            wrapper.appendChild(button);
            row.appendChild(wrapper);

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
                        uploadLinksToProfiles(links);
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
    const wrapper = document.querySelector('.table-wrapper');
    const table = wrapper.querySelector('.sc-bvCBbN.lpiclk');
    var checkboxes = table.querySelectorAll('input[type="checkbox"]');
    return checkboxes;
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

// Returns array of links
function getLinks() {
    // find the table
    const searchResultsDiv = document.querySelector('.table-wrapper');
    if (!searchResultsDiv) {return []};    // no table found

    // find all the rows
    const body = Array.from(searchResultsDiv.querySelectorAll('.ant-table-row.ant-table-row-level-0'));
    let links = [];

    // get the state of whether the skip creators in lists button is checked
    chrome.storage.local.get('skipState', function(result) {
        const isChecked = result.skipState;
        // cycle through each row, adding the link to a list
        body.forEach((row) => {
            // to be added: check if already in list
            var link = makeLink(row);
            // if (link && (isEmpty || !isChecked)) { -- old code for when we have smt to check if a profile is in a list
            if (link) {
                links.push(link);
            }
            // else {
            //     links.push('skip' + link);
            // } -- old code for skip links
        });
      });
    return links;
}

// return a working link given a row
function makeLink(row) {
    let link = row.querySelector('a[href*="instagram.com"]');
    if (!link) {
        link = row.querySelector('a[href*="tiktok.com"]');
        if (link) {
            // the tiktok link given is a redirect so I'm going to change it to what it redirects to
            // this is because the extension only shows up on urls in the list so when it redirects it doesnt show up
            var usernameElement = row.querySelector('.ant-flex a');
            var username = usernameElement ? usernameElement.textContent.trim() : null;
            link = "https://www.tiktok.com/" + username;
        }
        if (!link) {
            link = row.querySelector('a[href*="youtube.com"]')
            link = link.href
        }
    } else {
        link = link.href.concat("reels/");
    }
    return link;
}

// checks first 5 profiles to see if the list is the same
function sameFive(profiles, links) {
    var sameList = true;
    for (var i = 0; i < (links.length < 5 ? links.length : 5); i++) {
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
    for (var i = 1; i < checkboxes.length; i++) {
        (function(index) {
            checkboxes[index].addEventListener("change", (event) => {
                chrome.storage.local.get(["responses"], (data) => {
                    const responses = data.responses;
                    responses[index - 1] = event.target.checked;
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
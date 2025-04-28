// current add button, but will be replaced later
function addButton() {
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
                onButtonClick();
            });
        }
    }
}

// when button is clicked update all variables and open first profile
function onButtonClick() {
    var checkboxes = getCheckboxes()
    manualClickedCheckboxes(checkboxes);
    var links = getLinks();
    console.log('Found links:', links);

    chrome.storage.local.get(["currentIndex", "profiles", "responses"], (data) => {
        // reset list or if same list, pull last info
        const currentIndex = data.currentIndex || 0;
        var index = 0;
        var responses = [];
        if (data.profiles) {
            const profiles = data.profiles.profiles;
            // if same list, use current index and saved responses
            if (sameFive(profiles, links)) {
                index = currentIndex;
                var responses = data.responses || [];
            }
        }

        if (index >= links.length) {
            alert("Click load more until you get back to where you were!")
        } else {
            // skip first profiles if already in lists
            for (index; (index < links.length && links[index].slice(0, 4) == 'skip'); index++) {
                responses.push(false);
            }

            chrome.storage.local.set({ 
                currentIndex: index,
                profiles: { profiles: links }, // Ensure profiles is properly structured- dont ask why its structured this way idk
                responses: responses,
                back: []
            });

            // Open the first profile in a new tab
            chrome.runtime.sendMessage({ action: 'openProfile', url: links[index]});
        }
    });
}

// retrieves responses and updates the checkboxes
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

// finds all the checkboxes
function getCheckboxes() {
    const wrapper = document.querySelector('.table-wrapper');
    const table = wrapper.querySelector('.ant-table-tbody');
    var checkboxes = table.querySelectorAll('input[type="checkbox"]');
    return checkboxes;
}

// checks if any items have been added to the back query in which case we unselect them and clear the list
function backCheckboxes(listOfIndex) {
    if (listOfIndex.length > 0) {
        for (var i = 0; i < listOfIndex.length; i++) {
            var checkboxes = getCheckboxes()
            if (checkboxes[listOfIndex[i]].checked) {
                checkboxes[listOfIndex[i]].click();
            }
        }
        chrome.storage.local.set({back: []});
    }
}

// returns the array of links, adding "skip" to those which are already in lists
function getLinks() {
    // find the table
    const searchResultsDiv = document.querySelector('.table-wrapper');
    if (!searchResultsDiv) {return []};    // no table found

    // find all the rows
    const body = Array.from(searchResultsDiv.querySelectorAll('.ant-table-row.ant-table-row-level-0'));
    let links = [];

    // get the state of whether the skip creators in lists button is checked
    chrome.storage.local.get('skipState', function(result) {
        // const isChecked = result.skipState;
        // cycle through each row, adding the link to a list
        body.forEach((row) => {
            // to be added: check if already in list
            // const listsInfoDiv = row.querySelector('div.lists-info'); // Find the div with class .lists-info
            // const isEmpty = listsInfoDiv && listsInfoDiv.classList.contains('empty'); // Check if it has the .empty class]

            var link = makeLink(row);
            // if (link && (isEmpty || !isChecked)) { -- old code for when we have smt to check if a profile is in a list
            if (link) {
                links.push(link);
            }
            // else {
            //     links.push('skip' + link);
            // }
            // old code for skip links
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

// updates checkboxes and looks for action bar
function checkBoxes(whichBoxes) {
    var checkboxes = getCheckboxes()
    for (var i = 0; i < whichBoxes.length+1; i++) {
        if (whichBoxes[i]) {
            if (!checkboxes[i].checked) {
                checkboxes[i].click();
            }
        }
    }
    var action_bar = document.querySelector('.action-bar');
    if (action_bar) {
        firstCheckboxUncheckAll(action_bar, checkboxes);
    }
}

// if someone manually clicks a checkbox it updates the list
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

// the action bar checkbox and clear selection button will reset the list
function firstCheckboxUncheckAll(action_bar, checkboxes) {
    var checkbox = action_bar.querySelector('input[type="checkbox"]');
    var text = action_bar.querySelector('.ant-btn');
    checkbox.addEventListener("change", () => {
        var n = checkboxes.length;
        chrome.storage.local.set({"responses": Array(n).fill(false)})
    })
    text.addEventListener("click", () => {
        var n = checkboxes.length;
        chrome.storage.local.set({"responses": Array(n).fill(false)})
    })
}

// inject into the new button
function injectExtension() {
    const button = document.querySelector(''); // New Button
    if (button) {
      const labelDiv = button.querySelector('div.ant-flex');
      if (labelDiv) {
        for (let node of labelDiv.childNodes) {
          if (node.nodeType === Node.TEXT_NODE || node.nodeType === 3) {
            if (node.textContent.trim() === "Select Faster") {
              return;
            }
            node.textContent = ''; // clear any raw text nodes
          }
        }
  
        labelDiv.append("Select Faster");
      }
      button.addEventListener(
        'click',
        (e) => {
          e.stopPropagation();
          e.preventDefault();
          onButtonClick();
        },
        true
      );
    }
  }  

// polling for the button and retriving the responses
// not the best method but I couldn't get anything else to work
function polling() {
    setInterval(() => {
        addButton(); // change to injectExtension() when new button
        retrieveResponses();
    }, 3000); // Check every 3 seconds
}

polling();
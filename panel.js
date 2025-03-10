console.log('Content script loaded!');

function initializePanel() {
    // Create the panel
    const panel = document.createElement('div');

    // Get extension URL for images
    const checkImageUrl = chrome.runtime.getURL('assets/check.png');
    const xImageUrl = chrome.runtime.getURL('assets/x.png');

    const igPanel = `
    <head>
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap" rel="stylesheet">
    </head>
    <div id="creator-panel" style="
        position: fixed;
        top: 20px;
        right: 20px;
        width: 150px;
        background: white;
        border: 4px solid #F6F6F6;
        border-radius: 15px;
        padding: 15px;
        z-index: 999999;
        box-shadow: 0 2px 20px rgba(0,0,0,0.2);
    ">
        <div class="buttons-container" style="
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-bottom: 15px;
        ">
            <button id="check-button" class="button" style="
                border: none;
                padding: 15px;
                cursor: pointer;
                background: #F6F6F6;
                border-radius: 50%;
            ">
                <img src="${checkImageUrl}" width="40"/>
            </button>
            <button id="x-button" class="button" style="
                border: none;
                padding: 15px;
                cursor: pointer;
                background: #F6F6F6;
                border-radius: 50%;
            ">
                <img src="${xImageUrl}" width="40"/>
            </button>
        </div>
        <div class="completion-message" style="
            display: none;
            text-align: center;
            padding: 5px;
            font-size: 14px;
            font-family: 'Monteserrat', sans-serif;
        "></div>
        <div id="display-text" style="
            text-align: center;
            margin-top: 10px;
            font-size: 14px;
            color: #333;
            font-family: 'Monteserrat', sans-serif;
        ">
        </div>
    </div>
    `

    const ttPanel = `
        <head>
            <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap" rel="stylesheet">
        </head>
        <div id="creator-panel" style="
            position: fixed;
            top: 20px;
            right: 20px;
            width: 200px;
            height: 150px;
            background: white;
            border: 4px solid #F6F6F6;
            border-radius: 15px;
            padding: 15px;
            z-index: 999999;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            box-sizing: border-box;
        ">
            <div class="buttons-container" style="
                display: flex;
                justify-content: center;
                gap: 20px;
                margin-bottom: 15px;
            ">
                <button id="check-button" class="button" style="
                    border: none;
                    padding: 15px;
                    cursor: pointer;
                    background: #F6F6F6;
                    border-radius: 50%;
                ">
                    <img src="${checkImageUrl}" width="40"/>
                </button>
                <button id="x-button" class="button" style="
                    border: none;
                    padding: 15px;
                    cursor: pointer;
                    background: #F6F6F6;
                    border-radius: 50%;
                ">
                    <img src="${xImageUrl}" width="40"/>
                </button>
            </div>
            <div class="completion-message" style="
                display: none;
                text-align: center;
                padding: 5px;
                font-size: 14px;
                font-family: 'Monteserrat', sans-serif;
            "></div>
            <div id="display-text" style="
                text-align: center;
                margin-top: 10px;
                font-size: 14px;
                color: #333;
                font-family: 'Monteserrat', sans-serif;
            ">
            </div>
        </div>
    `;

    if (document.URL.includes('instagram.com')) {
        panel.innerHTML = igPanel;
    } else if (document.URL.includes('tiktok.com')) {
        panel.innerHTML = ttPanel;
    }

    // First add panel to page
    document.body.appendChild(panel);
    console.log('Panel added to page');

    // Then load profiles and set up event listeners
    let profiles = [];

    // Load saved state first
    chrome.storage.local.get(['currentIndex', 'responses', 'newListAdded', 'continuedList'], (result) => {
        let index = result.currentIndex || 0;
        let responses = result.responses || [];
        const newListAdded = result.newListAdded || false; // Get the newListAdded flag
        const continuedList = result.continuedList || false; // Get the newListAdded flag
        console.log('Loaded saved state:', { index, responses, newListAdded });

        // Check if a new list was added
        if (newListAdded && !continuedList) {
            index = 0; // Reset current index to 0
            chrome.storage.local.set({ 
                currentIndex: index
            })
            responses = new Array(profiles.length).fill(null); // Reset responses array
            console.log('New list added. Current index reset to 0 and responses cleared.');

            // Reset the newListAdded flag
            chrome.storage.local.set({ newListAdded: false }, () => {
                console.log('New list added flag reset to false.');
            });
        } else if (continuedList) {
            // Reset the newListAdded flag
            chrome.storage.local.set({ newListAdded: false }, () => {
                console.log('New list added flag reset to false.');
            });
        }

        // Then load profiles from chrome.storage.local
        chrome.storage.local.get(['profiles'], (profileResult) => {
            if (profileResult.profiles) {
                profiles = profileResult.profiles.profiles; // Access the profiles array
                console.log('Loaded profiles from storage:', profiles);
                if (responses.length === 0) {
                    responses = new Array(profiles.length).fill(null);
                }
                console.log('Initial state:', { index, profiles });

                if (!profiles.includes(document.URL) && !profiles.includes(document.URL.replace("www.", ""))) {
                    document.body.removeChild(panel);
                } else {
                    setupEventListeners();
                }

            } else {
                console.error('No profiles found in storage.');
            }
            document.getElementById("display-text").innerHTML = "<b>" + responses.filter(Boolean).length.toString() + " Selected</b>  -  " + index.toString() + "/" + profiles.length.toString();
        });
    });

    function setupEventListeners() {
        // Now set up event listeners after everything is loaded
        const checkButton = panel.querySelector('#check-button');
        const xButton = panel.querySelector('#x-button');
        const buttonsContainer = panel.querySelector('.buttons-container');
        const messageElement = panel.querySelector('.completion-message');
        

        function handleButtonClick(isCheck) {
            chrome.storage.local.get(['currentIndex', 'responses'], (state) => {
                let index = state.currentIndex || 0;
                let currentResponses = state.responses || new Array(profiles.length).fill(null);
                
                console.log('Button clicked! Current state:', { index, profiles });
                
                if (profiles.length > 0 && index < profiles.length) {
                    // Record response for current profile
                    currentResponses[index] = isCheck;
                    index++; // Move to the next profile
                    
                    // Save state to chrome.storage, then navigate
                    chrome.storage.local.set({ 
                        currentIndex: index,
                        responses: currentResponses
                    }, () => {
                        console.log('State saved, new index:', index);
                        // Navigate after state is saved
                        if (index < profiles.length) {
                            console.log('Moving to profile:', profiles[index]);
                            if (profiles[index] == 'skip') {
                                handleButtonClick(false);
                            } else {
                                window.location.href = profiles[index]; // Navigate to the next profile
                            }
                        } else {
                            const selectedCount = currentResponses.filter(response => response === true).length;
                            buttonsContainer.style.display = 'none';
                            document.getElementById("display-text").innerText = "";
                            messageElement.style.display = 'block';
                            messageElement.textContent = `You selected ${selectedCount} out of ${profiles.length} profiles`;

                            chrome.storage.local.set({ responses: currentResponses }, () => {
                                console.log('Responses saved to storage:', currentResponses);
                            });
                        }
                    });
                }
            });
        }

        // Function to handle keydown events
        function handleKeyDown(event) {
            console.log("Key pressed:", event.key);
            if (event.key === 'Enter' || event.key === '1') {
                handleButtonClick(true)
            } else if (event.key === 'Backspace' || event.key === '2') {
                handleButtonClick(false)
            }
        }

        checkButton.addEventListener('click', () => handleButtonClick(true));
        xButton.addEventListener('click', () => handleButtonClick(false));
        document.addEventListener("keydown", handleKeyDown);
    }
}

// Start the initialization when the document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePanel);

} else {
    initializePanel();
}
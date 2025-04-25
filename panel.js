console.log('Content script loaded!');

let displayText; // Declare the variable in a broader scope

function initializePanel() {
    // Create the panel
    const panel = document.createElement('div');
    // Then load profiles and set up event listeners
    let profiles = [];

    // Load saved state first
    chrome.storage.local.get(['currentIndex', 'responses'], (result) => {
        let index = result.currentIndex || 0;
        let responses = result.responses || [];
        console.log('Loaded saved state:', { index, responses });

        displayText = "Selected: " + responses.filter(Boolean).length.toString(); // Set the value

        // Then load profiles from chrome.storage.local
        chrome.storage.local.get(['profiles'], (profileResult) => {
            if (profileResult.profiles) {
                profiles = profileResult.profiles.profiles; // Access the profiles array
                console.log('Loaded profiles from storage:', profiles);
                if (responses.length === 0) {
                    responses = new Array(profiles.length).fill(null);
                }
                console.log('Initial state:', { index, profiles });

                if (profiles.includes(document.URL) || profiles.includes(document.URL.replace("www.", "")) || profiles.includes(document.URL.concat("reels/"))) {
                    if (document.URL.includes('instagram.com')) {
                        panel.innerHTML = makePanel("ig");
                    } else if (document.URL.includes('tiktok.com')) {
                        panel.innerHTML = makePanel("tt");
                    } else if (document.URL.includes('youtube.com')) {
                        panel.innerHTML = makePanel("yt");
                    }
                    addTooltips(panel);
                    // First add panel to page
                    document.body.appendChild(panel);
                    console.log('Panel added to page');
                    setupEventListeners();
                }

            } else {
                console.error('No profiles found in storage.');
            }
            document.getElementById("display-text").innerHTML = "<b>" + responses.filter(Boolean).length.toString() + " Selected</b>  -  " + (index+1).toString() + "/" + profiles.length.toString();
        });
    });

    function setupEventListeners() {
        // Now set up event listeners after everything is loaded
        const checkButton = panel.querySelector('#check-button');
        const xButton = panel.querySelector('#x-button');
        const buttonsContainer = panel.querySelector('#main-buttons');
        const messageElement = panel.querySelector('.completion-message');
        const backButton = panel.querySelector('#back-button');
        const creatorButton = panel.querySelector('#creator-button');
        const moveButton = panel.querySelector('#move-button');
        const panelElement = panel.querySelector("#creator-panel");
        

        function handleButtonClick(isCheck) {
            chrome.storage.local.get(['currentIndex', 'responses'], (state) => {
                let index = state.currentIndex || 0;
                let currentResponses = state.responses || new Array(profiles.length).fill(null);
                
                if (profiles.length > 0 && index < profiles.length) {
                    // Record response for current profile
                    currentResponses[index] = isCheck;
                    index++; // Move to the next profile
                    
                    // Save state to chrome.storage, then navigate
                    chrome.storage.local.set({ 
                        currentIndex: index,
                        responses: currentResponses
                    }, () => {
                        // Navigate after state is saved
                        if (index < profiles.length) {
                            if (profiles[index].slice(0, 4) == 'skip') {
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
                            if (panelElement.style.height == '140px') {
                                panelElement.style.height = '85px';
                            } else {
                                panelElement.style.height = '130px';
                            }

                            chrome.storage.local.set({ responses: currentResponses }, () => {
                                console.log('Responses saved to storage:', currentResponses);
                            });
                        }
                    });
                }
            });
        }

        function back() {
            chrome.storage.local.get(['currentIndex', 'responses', 'back'], (state) => {
                let index = state.currentIndex || 0;
                let currentResponses = state.responses || new Array(profiles.length).fill(null);
                let listOfBack = state.back;

                if (index > 0) {
                    index--;
                    listOfBack.push(index);
                    currentResponses[index] = false;
                    chrome.storage.local.set({ 
                        currentIndex: index,
                        responses: currentResponses,
                        back: listOfBack
                    }, () => {
                        if (profiles[index].slice(0, 4) == 'skip') {
                            back();
                        } else {
                            window.location.href = profiles[index];
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
            } else if (event.key === '4') {
                back()
            }
        }

        checkButton.addEventListener('click', () => handleButtonClick(true));
        xButton.addEventListener('click', () => handleButtonClick(false));
        document.addEventListener("keydown", handleKeyDown);
        backButton.addEventListener("click", () => back());
        creatorButton.addEventListener("click", () => chrome.runtime.sendMessage({ action: "closeTab" }));

        let isDragging = false;
        let offsetX, offsetY;

        // Event listener for mouse down on the move button
        moveButton.addEventListener("mousedown", (e) => {
            isDragging = true;
            offsetX = e.clientX - panelElement.getBoundingClientRect().left;
            offsetY = e.clientY - panelElement.getBoundingClientRect().top;
            moveButton.style.cursor = "grabbing"; // Change cursor to grabbing on the move button
        });

        // Event listener for mouse move on the document
        document.addEventListener("mousemove", (e) => {
            if (!isDragging) return; // Only move if dragging is true
            let newX = e.clientX - offsetX;
            let newY = e.clientY - offsetY;

            console.log(`Moving to: ${newX}, ${newY}`);

            // Update the position of the panel
            panelElement.style.left = `${newX}px`;
            panelElement.style.top = `${newY}px`;
        });

        // Event listener for mouse up on the document
        document.addEventListener("mouseup", () => {
            if (isDragging) {
                // Save the position to Chrome storage
                chrome.storage.local.set({
                    panelPosition: {
                        top: panelElement.offsetTop,
                        left: panelElement.offsetLeft
                    }
                });
            }
            isDragging = false; // Reset dragging state
            moveButton.style.cursor = "grab"; // Change cursor back to grab on the move button
        });

        // Prevent images from being dragged
        const images = panelElement.querySelectorAll('img');
        images.forEach((img) => {
            img.addEventListener('dragstart', (e) => {
                e.preventDefault(); // Prevent the default drag behavior
            });
        });

        // Restore panel position from Chrome storage when the panel is initialized
        chrome.storage.local.get("panelPosition", (data) => {
            if (data.panelPosition) {
                panelElement.style.top = `${data.panelPosition.top}px`;
                panelElement.style.left = `${data.panelPosition.left}px`;
            } else {
                // Set default position if no position is saved
                panelElement.style.top = '20px'; // Default top position
                panelElement.style.left = '20px'; // Default left position
            }
        });

        // Ensure the panel is positioned correctly on load
        panelElement.style.position = 'fixed'; // Ensure the panel is fixed
        panelElement.style.cursor = 'default'; // Set initial cursor style for the panel
    }
}

function makePanel(platform) {
    const checkImageUrl = chrome.runtime.getURL('assets/check.png');
    const xImageUrl = chrome.runtime.getURL('assets/x.png');
    const backImage = chrome.runtime.getURL('assets/back.png');
    const creatorImage = chrome.runtime.getURL('assets/creator128.png');
    const moveImage = chrome.runtime.getURL('assets/move.png');
    var width = '0px';
    var height = '0px';

    var top = '-5000px';
    var left = '-5000px';

    chrome.storage.local.get(["panelPosition"], (data) => {
        if (data.panelPosition) {
            top = `${data.panelPosition.top}px`;
            left = `${data.panelPosition.left}px`;
        } else {
            top = '20px';
            left = '20px';
        }
    });

    if (platform == "ig") {
        width = '160px';
        height = '140px';
    } else if (platform == "tt") {
        width = '200px';
        height = '175px';
    } else if (platform == "yt") {
        width = '160px';
        height = '140px';
    } 
    const panel = `
    <div id="creator-panel" style="
        position: fixed;
        top: ${top};
        left: ${left};
        width: ${width};
        height: ${height};
        background: white;
        border: 4px solid #F6F6F6;
        border-radius: 15px;
        padding: 15px;
        z-index: 999999;
        box-shadow: 0 2px 20px rgba(0,0,0,0.2);
    ">
        <div id="main-buttons" class="buttons-container" style="
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-bottom: 15px;
        ">
            <button id="check-button" class="button" data-tooltip="Select Creator" style="
                border: none;
                padding: 15px;
                cursor: pointer;
                background: #F6F6F6;
                border-radius: 50%;
            ">
                <img src="${checkImageUrl}" width="40"/>
            </button>
            <button id="x-button" class="button" data-tooltip="Skip Creator" style="
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
            font-size: 16px;
        "></div>
        <div id="display-text" style="
            text-align: center;
            margin-top: 10px;
            font-size: 14px;
            color: #333;
        ">
            ${displayText}
        </div>
        <div id="bottom-buttons" class="buttons-container" style="
            display: flex;
            justify-content: space-between;
            margin-top: 12px; /* Add some space above the circles */
        ">
            <button id="back-button" class="button" data-tooltip="Back to Last Creator" style="
                width: 25px; /* Circle width */
                height: 25px; /* Circle height */
                border-radius: 50%; /* Make it circular */
                background-color: #F6F6F6; /* Circle background color */
                display: flex;
                align-items: center;
                justify-content: center;
                border: none;
                cursor: pointer;
            ">
                <img src="${backImage}" width="17"/>
            </button>
            <button id="creator-button" class="button" data-tooltip="Back to Dashboard" style="
                width: 25px; /* Circle width */
                height: 25px; /* Circle height */
                border-radius: 50%; /* Make it circular */
                background-color: #F6F6F6; /* Circle background color */
                display: flex;
                align-items: center;
                justify-content: center;
                border: none;
                cursor: pointer;
            ">
                <img src="${creatorImage}" width="17"/>
            </button>
            <button id="move-button" class="button" data-tooltip="Move Panel" style="
                width: 25px; /* Circle width */
                height: 25px; /* Circle height */
                border-radius: 50%; /* Make it circular */
                background-color: #F6F6F6; /* Circle background color */
                display: flex;
                align-items: center;
                justify-content: center;
                border: none;
                cursor: grab;
            ">
                <img src="${moveImage}" width="17"/>
            </button>
        </div>
    </div>
    `

    return panel;
}

function addTooltips(panel) {
    // Tooltip functionality
    const buttons = panel.querySelectorAll('.button');
    buttons.forEach(button => {
        let tooltipTimeout;

        button.addEventListener('mouseenter', (event) => {
            const tooltipText = event.target.getAttribute('data-tooltip');
            
            tooltipTimeout = setTimeout(() => {
                const tooltip = document.createElement('div');
                tooltip.classList.add('tooltip');
                tooltip.textContent = tooltipText;
                tooltip.style.position = 'absolute';
                
                // Adjusting position slightly
                tooltip.style.bottom = '40px';  // Make the tooltip appear a bit higher
                tooltip.style.left = '50%';
                tooltip.style.transform = 'translateX(-50%)';
                tooltip.style.padding = '5px 10px';
                tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                tooltip.style.color = 'white';
                tooltip.style.fontSize = '12px';
                tooltip.style.borderRadius = '5px';
                tooltip.style.whiteSpace = 'nowrap';

                button.appendChild(tooltip);
            }, 1000); // delay before showing the tooltip
        });

        button.addEventListener('mouseleave', () => {
            clearTimeout(tooltipTimeout); // Clear timeout if mouse leaves before the tooltip shows
            const tooltip = button.querySelector('.tooltip');
            if (tooltip) {
                tooltip.remove();
            }
        });
    });
}


// Start the initialization when the document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePanel);

} else {
    initializePanel();
}
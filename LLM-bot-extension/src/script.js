let observer = null;
// Watch changes in the DOM
// Runs when something happens on the page
function observeDOM(){
    if(observer){
        observer.disconnect();
    }
    observer = new MutationObserver(mutations => {
        mutations.forEach(mutation =>{
            if(mutation.type === "childList" && mutation.addedNodes.length){
                checkIcon();
                attachTextAreaEvent();
                attachCopyEvent();

                let comments = getAllPullRequestComments();
                let fileContent = getAllFileContent();

                if(comments && fileContent){
                    console.log(comments);
                    console.log(fileContent);
                }
            }
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

//Icon functions
//
//

//Check if icon exists
function checkIcon(){
    const newCommentField = document.getElementById("new_comment_field");
    let icon = document.getElementById("LLM_Icon");

    if(newCommentField && !icon){
        addIconOverCommentBox();
    }

    if(icon){
        attachIconEvent(icon);
    }
}
//Add Icon over github comment box
async function addIconOverCommentBox(){
    let textarea = document.getElementById("new_comment_field");
    if(textarea){
        try {
            //add a function to add the text area
            add_LLM_Reply_Area();
            //Creating the LLM icon
            let icon = document.createElement('img');
            icon.id = "LLM_Icon";
            icon.alt = "Icon";
            icon.src = chrome.runtime.getURL("icon/LLM-bot-NoBackground.png");
        
            icon.onmouseover = function() {
                this.style.transform = "translateY(-10%) scale(1.1)";
            };
            icon.onmouseout = function() {
                this.style.transform = "translateY(-10%) scale(1)";
            };

            icon.style.cssText = `
                pointer-events: auto;
                cursor: pointer;
                position: absolute;
                right: 10px;
                top: 50%;
                transform: translateY(-10%);
                z-index: 1000;`
            ;
            
            attachIconEvent(icon);

            textarea.parentElement.style.position = "relative";
            textarea.parentElement.appendChild(icon);
            updateIconVisibility();
        } catch (error) {
            //console.log(error)
        }
    }
}

//Attach onclick event on LLM Icon
function attachIconEvent(icon){
    icon.onclick = function(event) {
        event.stopPropagation();
        icon.onmouseover = function() {
            this.style.transform = "translateY(-10%) scale(1.1)";
        };
        icon.onmouseout = function() {
            this.style.transform = "translateY(-10%) scale(1)";
        };
        const popup = document.getElementById('popup-llm');
        if (popup.style.display === 'none') {
           // popup.className = "js-previewable-comment-form write-selected Box CommentBox";    
            popup.style.display = 'flex';
        } else {
            popup.style.display = 'none';
        }
    };
    updateIconVisibility();
}

//Update the visibility of the LLM Icon
async function updateIconVisibility() {
    var icon = document.getElementById("LLM_Icon");
    var textarea = document.getElementById("popup-llm")
    let currrentState = "";
    if(icon){
        try {
            currrentState = await getToggleState('toggleState');
            if (currrentState === "checked") {
                icon.style.display = 'block'; 
            } else {
                icon.style.display = 'none';
            }
        } catch (error) {
            console.log("Error:",error);
        }
    }
}

//End of Icon
//
//

//watch changed when selecting differents tabs in github Single Application Page (SAP)
function setupNav(){
    observeDOM();
    checkIcon();
    attachTextAreaEvent();
    attachCopyEvent();
    updateIconVisibility();
}

window.addEventListener('popstate',setupNav);
window.addEventListener('hashchange',setupNav);
document.addEventListener('pjax:end',setupNav);

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupNav);
} else {
    setupNav();
}

//Function pour changer le contenu de l'extension
function openTab(tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active");
    }
    document.getElementById(tabName).style.display = "block";
    document.getElementById(tabName.toLowerCase() + 'Tab').classList.add("active");
}

//Popup eventListener
document.addEventListener('DOMContentLoaded', function() {
    updateTextArea();
    //Check if on github
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs && tabs[0] && tabs[0].url) {
            const currentURL = tabs[0].url;

            if (currentURL.includes("github.com")) {
                document.getElementById('content').style.display = 'block';
            } else {
                document.getElementById('message').style.display = 'block';
            }
        } else {
            console.error("No tabs were found.");
        }
    });

    //Change tabs in extension
    document.getElementById('viewTab').addEventListener('click', function () {
        openTab('View');
    });

    document.getElementById('settingsTab').addEventListener('click', function () {
        openTab('Settings');
    });

    openTab('View');

    //Add settings Toggle
    addStatusToggle();
    updateIconVisibility();

    addCodeToggle()
    addRelevanceToggle()
    addToxicToggle()
});

//Toggle switches functions
//
//

//Get the state enable/disable of the extension
function getToggleState(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get([key], function(result) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(result[key]);
            }
        });
    });
}

//add enable/disable toggle
async function addStatusToggle(){
    let lswitch = document.getElementById('enableSwitch');
    let currrentState = "";
    
    try {
        currrentState = await getToggleState('toggleState');
    } catch (error) {
        console.log("Error:",message);
    }

    let toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.id = "toggleExtension";
    
    let slider = document.createElement("span");
    slider.classList = "slider round";

    if (lswitch) {
        if (currrentState === "checked") {
            toggle.checked = true;
        } else {
            toggle.checked = false;
        }    
        lswitch.appendChild(toggle);
        lswitch.appendChild(slider);
        toggle.addEventListener('change', function() {
            chrome.runtime.sendMessage({
                from: 'popup',
                subject: 'toggleState',
                toggleState: toggle.checked
            });
        });
    }
}

//Add code toggle
async function addCodeToggle(){
    let lswitch = document.getElementById('codeSwitch');
    let currrentState = "";
    
    try {
        currrentState = await getToggleState('toggleCode');
    } catch (error) {
        console.log("Error:",message);
    }

    let toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.id = "toggleCode";
    
    let slider = document.createElement("span");
    slider.classList = "slider round";

    if (lswitch) {
        if (currrentState === "checked") {
            toggle.checked = true;
        } else {
            toggle.checked = false;
        }    
        lswitch.appendChild(toggle);
        lswitch.appendChild(slider);
        toggle.addEventListener('change', function() {
            chrome.runtime.sendMessage({
                from: 'popup',
                subject: 'toggleCode',
                toggleCode: toggle.checked
            });
        });
    }
}

//Add relevance toggle
async function addRelevanceToggle(){
    let lswitch = document.getElementById('relevanceSwitch');
    let currrentState = "";
    
    try {
        currrentState = await getToggleState('toggleRelevance');
    } catch (error) {
        console.log("Error:",message);
    }

    let toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.id = "toggleRelevance";
    
    let slider = document.createElement("span");
    slider.classList = "slider round";

    if (lswitch) {
        if (currrentState === "checked") {
            toggle.checked = true;
        } else {
            toggle.checked = false;
        }    
        lswitch.appendChild(toggle);
        lswitch.appendChild(slider);
        toggle.addEventListener('change', function() {
            chrome.runtime.sendMessage({
                from: 'popup',
                subject: 'toggleRelevance',
                toggleRelevance: toggle.checked
            });
        });
    }
}

//Add toxicity toggle
async function addToxicToggle(){
    let lswitch = document.getElementById('toxicitySwitch');
    let currrentState = "";
    
    try {
        currrentState = await getToggleState('toggleToxicity');
    } catch (error) {
        console.log("Error:",message);
    }

    let toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.id = "toggleToxicity";
    
    let slider = document.createElement("span");
    slider.classList = "slider round";

    if (lswitch) {
        if (currrentState === "checked") {
            toggle.checked = true;
        } else {
            toggle.checked = false;
        }    
        lswitch.appendChild(toggle);
        lswitch.appendChild(slider);
        toggle.addEventListener('change', function() {
            chrome.runtime.sendMessage({
                from: 'popup',
                subject: 'toggleToxicity',
                toggleToxicity: toggle.checked
            });
        });
    }
}

//End Toggle switches functions
//
//

//TextArea functions
//
//
//Add Textarea related to icon click
function add_LLM_Reply_Area(){
    let parentNode = document.getElementById("partial-new-comment-form-actions");
    if (!parentNode) {
        console.error("Div not found for textArea");
        return;
    }

    const divNode = document.createElement("div");
    divNode.id="popup-llm";
    //divNode.classList = "d-flex flex-item-center";
    divNode.style.cssText = `
        display: none; 
        justify-content: space-between;
        align-items: center;
        margin-right: 2px;
        width: 100%;
        resize:none;
    `;
    //divNode.style.width="-webkit-fill-available";
    
    divNode.innerHTML = `
        <div style="flex-grow: 1;margin-right: 4px">
            <textarea readonly id="llm-response" class="Box" style="min-height:32px; height:32px; width: 100%; resize:vertical; margin-right:2px;">No comments to reformulate</textarea>
        </div>
        <div>
            <button type="button" class="preview_button btn-primary btn" id="copySuggestion"style="margin-right:2px;">Copy</button>
        </div>
    `;
    parentNode.children[0].style.width = "-webkit-fill-available";

    parentNode.children[0].prepend(divNode);

}

//Function pour copier le texte
function copyToClipboard() {
    const text = document.getElementById('llm-response').value;
    if(text){
        console.log(text);
        navigator.clipboard.writeText(text).then(() => {}).catch(error => {
            console.error('Can\'t copy text: ', error);
        });
    }
}

//Add event listener sur le bouton de copy
function attachCopyEvent(){
    if(document.getElementById("copySuggestion")){
        document.addEventListener('click', function(event) {
            if (event.target.id === 'copySuggestion') {
                event.preventDefault();
                copyToClipboard();
            }
        });
    }
}

//todo change once LLM is integrated
//Add event listener sur le texte area
function attachTextAreaEvent(){
    let textarea = document.getElementById("new_comment_field");
    let resBox = document.getElementById("llm-response")
    if(textarea){
        textarea.addEventListener('input', function(event) {
            updateTextArea(event.target.value);
            if(event.target.value.length == 0){
                resBox.value = "No comment to reformulate";
            }
        });
    }
}

//Update the text area with given texte
function updateTextArea(input){
    const responseBox = document.getElementById("llm-response");
    if(responseBox){
        responseBox.value = input;
    }
}

//End TextArea
//
//

//add event listener for toggle state
chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
    let icon = document.getElementById('LLM_Icon');
    //Update toggle state
    if(icon&&(request.toggleState == true || request.toggleState == false)){
        icon.style.display = request.toggleState ? 'block' : 'none';
        let state = request.toggleState ? "checked" : "not_checked";
        try {
            await chrome.storage.sync.set({ 'toggleState': state });
            updateIconVisibility()
        } catch (error) {
            console.log("Error:",error);
        }
    }
    //Update Icon when changing tabs 
    if(request.action === "updateIconOnTabChange"){
        updateIconVisibility();
        sendResponse({result: "UpdatedIcon"});
    }
    return true;
});

//Github API Functions
//
//

//PAT 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
const token = "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";
const headers = {
    'Authorization': `token ${token}`,
}

function setToken(customToken){
    token = customToken;
}

function getToken(){
    return token;
}

//Function to get pull request comments 
async function getPullRequestComments() {
    try {
        var urlInfo = getInfoFromURL();
        const url = `https://api.github.com/repos/${urlInfo.owner}/${urlInfo.repo}/issues/${urlInfo.pullNumber}/comments`;
        const response = await fetch(url, { headers: headers });
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        const data = await response.json(); 
        const comments = data.map(async comment => {
            //console.log(file);
            return comment.body; ;
        });

        return Promise.all(comments);
    } catch (error) {
        // console.error('Failed to fetch comments:', error);
    }
}

//Test to get comments
getPullRequestComments().then(comments => {
        if (comments) {
            console.log(comments);
        }
    });

//Function to extract info from URL to get all necessary data
function getInfoFromURL() {
    const currentUrl = window.location.href;
    const regex = /https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/;
    const match = currentUrl.match(regex);
    if (match) {
        const owner = match[1];
        const repo = match[2];
        const pullNumber = match[3];
        return {
            owner: owner,
            repo: repo,
            pullNumber: pullNumber
        };
    } else {
        return null;
    }
}

//Function to get modified or added files url from Github
async function getPullRequestFiles() {
    try {
        var urlInfo = getInfoFromURL();
        const url = `https://api.github.com/repos/${urlInfo.owner}/${urlInfo.repo}/pulls/${urlInfo.pullNumber}/files`;
        const response = await fetch(url, { headers: headers });
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }
        const files = await response.json();
        return files;
    } catch (error) {
        // console.error('Failed to fetch PR files:', error);
    }
}

//Test to get files
// getPullRequestFiles().then(files => {
//         if (files) {
//             console.log(files);
//         }
//     });

//Function to seperate the files and get raw content
async function getFileRawContent(files) {
    try {
        const fileContentsPromises = files.map(async file => {
            //console.log(file);
            const apiURL = file.contents_url;
            //console.log(apiURL);
            const response = await fetch(apiURL, { headers: headers });

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            const content = await response.json();
            //console.log(content);
            const decodedContent = atob(content.content);
            //TODO Console.log for raw Text content
            //console.log(decodedContent);

            return decodedContent ;
        });

        return Promise.all(fileContentsPromises);
    } catch (error) {
        console.error('Failed to fetch file contents:', error);
    }
}

//Test to get raw content of files
getPullRequestFiles().then(files => {
        if (files) {
            return getFileRawContent(files);
        }
    }).then(filesWithContent => {
        if (filesWithContent) {
            console.log(filesWithContent);
        }
    });

//Functions to get clean comments and file contents

//Function to get clean comments
function getAllPullRequestComments(){
    getPullRequestComments().then(comments => {
        if (comments) {
            return comments;
        }
    });
}

//Function to get clean file contents
function getAllFileContent(){
    getPullRequestFiles().then(files => {
        if (files) {
            return getFileRawContent(files);
        }
    }).then(filesWithContent => {
        if (filesWithContent) {
            return filesWithContent;
        }
    });
}

//End Github API Functions
//
//

// chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
//     if (message.action === "githubPage") {
//         let comments = getAllPullRequestComments();
//         let fileContent = getAllFileContent();

//         if(comments && fileContent){
//             console.log(comments);
//             console.log(fileContent);
//         }
//     }
// });


let comments = getAllPullRequestComments();
let fileContent = getAllFileContent();

if(comments && fileContent){
    console.log(comments);
    console.log(fileContent);
}
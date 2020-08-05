export default class Chat {
    constructor() {
        this.openedYet = false;     // if user has opened chat once.

        this.chatWrapper = document.querySelector("#chat-wrapper");
        this.chatIcon = document.querySelector(".header-chat-icon");

        this.injectHTML();
        this.closeIcon = document.querySelector(".chat-title-bar-close");
        this.chatField = document.querySelector("#chatField");
        this.chatForm = document.querySelector("#chatForm");
        this.events();
    }

    // Event listeners
    events() {
        this.chatIcon.addEventListener("click", () => this.showChat());
        this.closeIcon.addEventListener("click", ()=> this.hideChat());
        
        this.chatForm.addEventListener("submit", (e) => {
            e.preventDefault(); //no reload
            this.sendMessageToServer();
        })
    }

    // Class methods
    injectHTML() {
        this.chatWrapper.innerHTML = `
        <div class="chat-title-bar">Chat <span class="chat-title-bar-close"><i class="fas fa-times-circle"></i></span></div>
        <div id="chat" class="chat-log"></div>

        <form id="chatForm" class="chat-form border-top">
            <input type="text" class="chat-field" id="chatField" placeholder="Type a message…" autocomplete="off">
        </form>
        `;
    }

    showChat() {
        if (!this.openedYet){
            this.openConnection();
        }
        this.openedYet = true;
        this.chatWrapper.classList.add("chat--visible");
    }
    hideChat() {
        this.chatWrapper.classList.remove("chat--visible");
    }

    openConnection(){
        this.socket = io();       // will open a connection between browser and server
        this.socket.on('chatMessageFromServer', function(data){
            alert(data.message);
        })
    }

    sendMessageToServer(){
        this.socket.emit('chatMessageFromBrowser', {message: this.chatField.value});
        this.chatField.value = '';
        this.chatField.focus();
    }

}
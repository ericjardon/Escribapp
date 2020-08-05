import axios from 'axios';
import DOMpurify from 'dompurify';

export default class Search {
    constructor() {
        this.searchToolHTML();
        this.searchIcon = document.querySelector(".header-search-icon") // query by style class
        this.overlay = document.querySelector(".search-overlay");
        this.closeIcon = document.querySelector(".close-live-search")
        this.inputField = document.querySelector("#live-search-field");
        this.resultsArea = document.querySelector(".live-search-results");
        this.loaderIcon = document.querySelector(".circle-loader");
        this.typeTimer;
        this.prevValue = "";
        this.events();

    }

    events() {      // is this like an 'activate' or 'listen' method?    
    this.searchIcon.addEventListener("click", (e) => {
            e.preventDefault();
            this.openOverlay();
        })
    this.closeIcon.addEventListener("click", (e) => this.closeOverlay());
    this.inputField.addEventListener("keyup", () => this.keyPressedHandler())
    }

    openOverlay() {
        this.overlay.classList.add("search-overlay--visible");
        setTimeout(() => this.inputField.focus(), 50)
    }

    closeOverlay() {
        this.overlay.classList.remove("search-overlay--visible");
    }

    keyPressedHandler() {   // is run after any event keyup. WE've to discriminate against keys that dont modify the field
      let value = this.inputField.value;

      if (value == "") {
        clearTimeout(this.typeTimer);
        this.hideLoaderIcon();
        this.hideResultsArea();
      }

      // each type the field is changed
      if (value != "" && value!= this.prevValue) {
        clearTimeout(this.typeTimer);   // timer is set to zero
        this.showLoaderIcon();    // loading...
        this.hideResultsArea();
        this.typeTimer = setTimeout(() => {this.sendQuery()}, 750);   // timer is reset and starts counting
        // after the timeout a query request to the db is sent
      }
      this.prevValue = value;
    }

    showLoaderIcon() {
      this.loaderIcon.classList.add('circle-loader--visible');
    }

    hideLoaderIcon() {
      this.loaderIcon.classList.remove('circle-loader--visible');
    }

    showResultsArea() {
      this.resultsArea.classList.add('live-search-results--visible');
    }

    hideResultsArea() {
      this.resultsArea.classList.remove('live-search-results--visible');
    }

    sendQuery() {
      axios.post('/search', {searchTerm: this.inputField.value}).then((response) => {   // response is the data sent back by server; searchREsults
        console.log(response.data);
        this.renderResults(response.data);
      }).catch((error) => {
        alert(error)
      });
    }

    renderResults(posts) {
      if (posts.length) {
        this.resultsArea.innerHTML = DOMpurify.sanitize(`<div class="list-group shadow-sm">
        <div class="list-group-item active"><strong>Búsqueda</strong> (${posts.length >1 ? `${posts.length} resultados`: `1 resultado`})</div>
        ${posts.map((post) => {
          let postDate = new Date(post.creationDate);
          return `<a href="/post/${post._id}" class="list-group-item list-group-item-action">
          <img class="avatar-tiny" src="${post.author.avatar}"> <strong>${post.title}</strong>
          <span class="text-muted small">por ${post.author.username} el ${postDate.getDate()}/${postDate.getMonth()+1}/${postDate.getFullYear()}</span>
        </a>`
        }).join('')}
        
      </div>`);
      }else {
        this.resultsArea.innerHTML = `<p class="alert alert-danger text-center shadow-sm">Ups, no hay resultados para esa búsqueda.</p>`;
      }
      this.hideLoaderIcon();
      this.showResultsArea();
    }

    searchToolHTML(){
        document.body.insertAdjacentHTML('beforeend', 
        `<!-- search feature begins -->
        <div class="search-overlay">
          <div class="search-overlay-top shadow-sm">
            <div class="container container--narrow">
              <label for="live-search-field" class="search-overlay-icon"><i class="fas fa-search"></i></label>
              <input type="text" id="live-search-field" class="live-search-field" placeholder="What are you interested in?">
              <span class="close-live-search"><i class="fas fa-times-circle"></i></span>
            </div>
          </div>
      
          <div class="search-overlay-bottom">
            <div class="container container--narrow py-3">
              <div class="circle-loader"></div>
              <div class="live-search-results"></div>
            </div>
          </div>
        </div>
        <!-- search feature end -->`);
    }

}
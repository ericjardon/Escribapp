export default class RegisterForm {
    constructor(){
        this.fields = document.querySelectorAll("#registration-form .form-control");
        this.injectHTML();
        this.usernameField = document.querySelector("#username-register");
        this.usernameField.previousVal = "";
        this.events();
    
    }

    // Event listeners 
    events() {
        this.usernameField.addEventListener("keyup", () => {
            this.fieldChanged(this.usernameField, this.usernameHanlder);
        })
    }

    // Other methods
    injectHTML() {
        this.fields.forEach(function(field){
            field.insertAdjacentHTML('afterend', '<div class="alert alert-danger small liveValidateMessage"></div>');
        })
    }

    fieldChanged(field, handler) {
        if (field.previousVal != field.value) {
            handler.call(this);     // instead of this.handler(), where this points to the overall element
        }
        field.previousVal = field.value;
    }

    showValidationError(field, message) {
        field.nextElementSibling.innerHTML = message;
        field.nextElementSibling.classList.add("liveValidateMessage--visible");
        field.errors = true;        // the field has errors
    }

    hideValidationError(field) {
        field.nextElementSibling.classList.remove("liveValidateMessage--visible");
    }

    usernameHanlder(){      // is called everytime the field value is changed
        this.usernameField.errors = false;
        this.usernameImmediateChecks();
        
        clearTimeout(this.usernameField.timer);

        this.usernameField.timer = setTimeout(() => {
            this.usernameDelayedChecks();
        }, 2500);
    }
    usernameImmediateChecks() {
        if (this.usernameField.value != "" && !/^([a-zA-z0-9]+)$/.test(this.usernameField.value)){
            this.showValidationError(this.usernameField, 'El usuario solo puede contener caracteres alfanuméricos');
        }

        if (!this.usernameField.errors) {
            // hide error rectangle if no errors 
            this.hideValidationError(this.usernameField);
        }

        if (this.usernameField.value.length >30){
            this.showValidationError(this.usernameField, "El usuario no debe ser mayor a 30 caracteres");
        }
    }
    usernameDelayedChecks() {
        if (this.usernameField.value.length<3){
            this.showValidationError(this.usernameField, "El usuario debe tener al menos 3 caracteres");
        }
    }

}
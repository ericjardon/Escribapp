import axios from 'axios';

export default class RegisterForm {
    constructor(){
        this._csrf = document.querySelector('[name="_csrf"]').value;
        this.form = document.querySelector("#registration-form");
        this.fields = document.querySelectorAll("#registration-form .form-control");
        this.injectHTML();
        this.usernameField = document.querySelector("#username-register");
        this.usernameField.previousVal = "";
        this.emailField =document.querySelector('#email-register');
        this.emailField.previousVal = "";
        this.passField =document.querySelector('#password-register');
        this.passField.previousVal = "";

        this.usernameField.isUnique = false;
        this.emailField.isUnique = false;

        this.events();
        
    
    }

    // Event listeners 
    events() {
        this.form.addEventListener("submit", (e) => {
            e.preventDefault();
            this.formSubmitHandler();
        })

        this.usernameField.addEventListener("keyup", () => {
            this.fieldChanged(this.usernameField, this.usernameHandler);
        })
        this.emailField.addEventListener("keyup", () => {
            this.fieldChanged(this.emailField, this.emailHandler);
        })
        this.passField.addEventListener("keyup", () => {
            this.fieldChanged(this.passField, this.passHandler);
        })

        this.usernameField.addEventListener("blur", () => {
            this.fieldChanged(this.usernameField, this.usernameHandler);
        })
        this.emailField.addEventListener("blur", () => {
            this.fieldChanged(this.emailField, this.emailHandler);
        })
        this.passField.addEventListener("blur", () => {
            this.fieldChanged(this.passField, this.passHandler);
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

    formSubmitHandler() {
        this.usernameImmediateChecks();
        this.usernameDelayedChecks();
        this.emailDelayedChecks();
        this.passwordImmediateChecks();
        this.passwordDelayedChecks();

        if (this.usernameField.isUnique && !this.usernameField.errors
            && this.emailField.isUnique && !this.emailField.errors
            && !this.passField.errors) {
            this.form.submit()
        }
    }


    // USERNAME FIELD
    usernameHandler(){      // is called everytime the field value is changed
        this.usernameField.errors = false;
        this.usernameImmediateChecks();
        
        clearTimeout(this.usernameField.timer);

        this.usernameField.timer = setTimeout(() => {
            this.usernameDelayedChecks();
        }, 800);
    }

    usernameImmediateChecks() {
        if (this.usernameField.value != "" && !/^([a-zA-z0-9]+)$/.test(this.usernameField.value)){
            this.showValidationError(this.usernameField, 'Usuario solo admite caracteres alfanuméricos');
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

        if (!this.usernameField.errors) {       // only if there are no problems we check the db fro taken user
            axios.post('/doesUsernameExist', {_csrf: this._csrf, username: this.usernameField.value}).then((response) => {
                if (response.data) { // if it does exist (is taken)
                    this.showValidationError(this.usernameField, "Este usuario no está disponible");
                    this.usernameField.isUnique = false;
                } else {
                    this.usernameField.isUnique = true;
                    this.hideValidationError(this.usernameField);
                }
            }).catch((error) => {
                console.log("Try again later: " + error);
            });

        }
    }


    // EMAIL FIELD

    emailHandler() {
        this.emailField.errors = false;
        clearTimeout(this.emailField.timer);

        if (!this.usernameField.errors) {
            // hide error rectangle if no errors 
            this.hideValidationError(this.usernameField);
        }

        this.emailField.timer = setTimeout(() => {
            this.emailDelayedChecks();
        }, 800);
    }

    emailDelayedChecks() {
        if (!/^\S+@\S+$/.test(this.emailField.value)) {      // regular expression checking email formar
            console.log("Se detectó correo inválido")
            this.showValidationError(this.emailField, "Debes proveer un correo válido")
        }

        if (!this.emailField.errors) {
            axios.post('/doesEmailExist', {_csrf: this._csrf, email: this.emailField.value}).then((response) => {
                if (response.data) {    // if it does exist (is taken)
                    this.emailField.isUnique = false;
                    this.showValidationError(this.emailField, "Este correo ya está en uso");
                } else {
                    console.log("Correo es válido");
                    this.emailField.isUnique = true;
                    this.hideValidationError(this.emailField);
                }
            }).catch((error) => {
                console.log("Please try again later: " + error);
            })
        }
    }

    // PASSWORD FIELD
    passHandler(){      // is called everytime the field value is changed
        this.passField.errors = false;
        this.passwordImmediateChecks();
        
        clearTimeout(this.passField.timer);

        this.passField.timer = setTimeout(() => {
            this.passwordDelayedChecks();
        }, 800);
    }

    passwordImmediateChecks() {
        if (this.passField.value.length>50) {
            this.showValidationError(this.passField, "La contraseña no debe exceder 50 caracteres");
        } 
        if (!this.passField.errors) {
            this.hideValidationError(this.passField);
        }
    }

    passwordDelayedChecks() {
        if(this.passField.value.length <12) {
            this.showValidationError(this.passField, "La contraseña debe tener al menos 12 caracteres");
        }
    }

}
const usersCollection = require('../db').db().collection('users');
const validator = require('validator'); // a library for our validation method
const bcrypt = require('bcryptjs');
const md5 = require('md5');

// constructor function
let User = function(data, getAvatar) {
    this.data = data;   // 3 props: username, email, password
    this.errors = [];   // to keep track of validation errors
    if (getAvatar==undefined){
        getAvatar = false;
    }
    if (getAvatar){
        this.getAvatar();
    }
}

// Class Methods: validation and registration
User.prototype.validate = function(){
    return new Promise(async (resolve, reject) => {
        if(this.data.username == ""){
            this.errors.push("Debes escoger un usuario");
        }
        if(this.data.username != "" && !validator.isAlphanumeric(this.data.username)){
            this.errors.push("Usuario debe ser alfanumérico");
        }
        if(!validator.isEmail(this.data.email)){
            this.errors.push("Debes proveer un correo válido.");
        }
        if (this.data.password == "") {this.errors.push("Debes proveer una contraseña.");}
        if (this.data.password.length>0 && this.data.password.length<12) {this.errors.push("La contraseña debe tener al menos 12 caracteres.")}
        if (this.data.password.length >50) {this.errors.push("La contraseña no debe exceder los 50 caracteres.")}
        if (this.data.username.length>0 && this.data.password.length<3) {this.errors.push("El usuario debe ser de al menos 3 caracteres.")}
        if (this.data.username.length >30) {this.errors.push("El usuario no debe exceder los 30 caracteres.")}
    
        if (this.data.username.length>=3 && this.data.username.length<=30 && validator.isAlphanumeric(this.data.username)){
            // if username valid, check db if its taken or not.
            // checking db is asynchronous; db methods return promises so we can use 'await'.
            let usernameExists = await usersCollection.findOne({username: this.data.username});   // if not null, username exists
            console.log(usernameExists);
            if (usernameExists){this.errors.push("Username is already taken.")}
        }
        if (validator.isEmail(this.data.email)){
            // if email valid check if taken or not
            let emailExists = await usersCollection.findOne({email: this.data.email});   // if not null, username exists
            console.log(emailExists);
            if (emailExists){this.errors.push("Email is already in use.")}
        }
        resolve();
    })
}

User.prototype.register = function() {
    return new Promise(async (resolve, reject) => {
        // 1. validate user input.
        this.cleanUp();  
        await this.validate();
        // 2. if valid (i.e. no errors at all), save user data into database.
        if (!this.errors.length) {
            /*HASHING*/
            let salt = bcrypt.genSaltSync(10);  // wtf is this
            this.data.password = bcrypt.hashSync(this.data.password, salt)
            /*STORING*/
            await usersCollection.insertOne(this.data);
            this.getAvatar();
            resolve();
        } else {
            reject(this.errors);    // sends registration errors to the catch()
        }
    })
}

User.prototype.cleanUp = function(){        // check question in Lesson 53
    // disqualify non string user input
    if(typeof(this.data.username) != "string") {this.data.username = ''};
    if(typeof(this.data.email) != "string") {this.data.email = ''};
    if(typeof(this.data.password) != "string") {this.data.password = ''};
    // get rid of bogus or extra properties of input data. 
    this.data = {
        username: this.data.username.trim().toLowerCase(),
        email: this.data.email.trim().toLowerCase(),
        password: this.data.password
    };
}

User.prototype.login = function(callback) {
    return new Promise((resolve, reject) => {
        this.cleanUp(); // checks that input are strings of text
        
        // check that user exists
        usersCollection.findOne({username: this.data.username}).then((suchUser)=>{ // the object found is passed on as suchUser);
            if (suchUser && bcrypt.compareSync(this.data.password, suchUser.password)){   // checks if suchUser exists at all. 
                // when logging, session doesnt know the email. So we retrieve it
                this.data = suchUser;
                this.getAvatar();
                resolve("Success");
            }else{
                reject("El usuario / contraseña no existen o son incorrectos.")
            };  // first resolve, reject correspond to our login promise
        }).catch(function(){
            reject("please try again later")    // this reject corresponds to mongodb findOne promise
        });    
    });
}

User.prototype.getAvatar = function(){
    // url contains the user's email, hashed using MD5 library
    this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`;
}       // only if registration/login is succesful, user avatar is populated. 

User.findByUsername = function(username) {
    return new Promise(async function(resolve, reject) {
        if (typeof(username) != "string") {
            reject();
            return;
        }
        usersCollection.findOne({username: username}).then(function(userDoc) {
            // resolves with the data it correctly found
            if (userDoc) {
                // clean up the user! dont leak unnecesary info into the controller
                userDoc = new User(userDoc, true);  // temporary instance a copy of the desired user, getting its Avatar
                userDoc = {
                    _id: userDoc.data._id,
                    username: userDoc.data.username,
                    avatar: userDoc.avatar
                    // only these three are needed to show a user profile
                }
                resolve(userDoc);
            } else{
                reject();
            }
        }).catch(function() {
            // reject corresponds to mongodb's findone method
            //this block runs if when mongodb encounters an unexpected error
            reject();
        });
    })
}

User.doesEmailExist = function(email) {
    return new Promise(async (resolve, reject) => {
        if (typeof(email) != "string"){
            resolve(false);
            return;
        } 
         
        let user = await usersCollection.findOne({email: email});
        if (user) {     // if it finds a user at all
            console.log("Email exists")
            resolve(true);
        } else {
            console.log("Email does not exist")
            resolve(false);
        }
    })  // an observation: it is not possible by induction that there are two users with same email and db would find two.
        // first because we are calling findONE. But chiefly because we are not letting users right from the beginning to register
        // with an already existing email
}

module.exports = User;
const User = require('../models/User');
const Post = require('../models/Post');
const Follow = require('../models/Follow');
const jsontokens= require('jsonwebtoken');

exports.userExists = function(req, res, next) {
    User.findByUsername(req.params.username).then(function(userDocument) {
        req.profileUser =  userDocument;
        next();
    }).catch( function() {
        res.render('404');
    });
}

exports.mustBeLoggedIn = function(req, res, next) {
    if (req.session.user) {
        next();     // user is logged in, so we can proceed
    } else {
        req.flash("errors", "Debes iniciar sesión para poder continuar.");
        req.session.save(function (){
            res.redirect('/');
        });
    };
}

exports.apiMustBeLoggedIn = function(req, res, next){
    try {
        req.apiUser = jsontokens.verify(req.body.token, process.env.JWTSECRET);
        next();
    } catch {
        res.json("El token no es válido.")
    }
}

exports.profileTabs = async function(req, res, next) {
    let isVisitorsProfile = false;  // check if profile _id is same as the current logged in user _id
    let isFollowing = false;
    if (req.session.user){
        isVisitorsProfile = req.profileUser._id.equals(req.session.user._id);
        isFollowing = await Follow.isFollowedBy(req.profileUser._id, req.visitorId);
    }
    req.isVisitorsProfile = isVisitorsProfile;
    req.isFollowing = isFollowing;

    let postsPromise = await Post.countPostsByAuthor(req.profileUser._id);
    let followersPromise = await Follow.countFollowersById(req.profileUser._id);
    let followingsPromise = await Follow.countFollowingById(req.profileUser._id);
    let [postCount, followerCount, followingCount] = await Promise.all([postsPromise, followersPromise, followingsPromise]);
    
    req.postCount = postCount;
    req.followerCount = followerCount;
    req.followingCount = followingCount;

    next();
}

exports.login = function(req, res) {
    let user = new User(req.body);
    user.login().then(function(result){
        // this next line sets what info is saved to the session
        req.session.user = {avatar: user.avatar,username: user.data.username, _id: user.data._id};
        req.session.save(function() {
            res.redirect('/');
        })
    }).catch(function(error){
        // when promise doesn't resolve and rejects this runs.
        req.flash('errors', error);
        req.session.save(function() {
            res.redirect('/');
        })
    });
}

exports.apiLogin = function(req, res) {
    let user = new User(req.body);
    user.login().then(function(result){
        // this next line sets what info is saved to the session
        res.json(jsontokens.sign({_id: user.data._id}, process.env.JWTSECRET,{expiresIn: "5d"}));
    }).catch(function(error){
        // when promise doesn't resolve and rejects this runs.
        res.json("Lo siento, no pasas chavo");
    });
}

exports.logout = function(req, res) {
    // built-in destroy method. Matches cuirrent cookie's session id with database session
    req.session.destroy(function() {
        res.redirect('/');      // we've to wait cause the / page depends on session state.
    });      
}

exports.register = function(req, res) {
    let user = new User(req.body); // req.body contains all the parameters we need
    user.register().then(() => {
        // this next line sets which data to be saved in session info
        req.session.user = {avatar: user.avatar, username: user.data.username, _id: user.data._id};
        req.session.save(function(){
            res.redirect('/');
        });
    }).catch((errors)=> {
        errors.forEach(function(error){
            req.flash('regErrors', error);
        })
        req.session.save(function(){
            // now that db has been updated we can redirect the user
            res.redirect('/');
        })
    });
    console.log(req.body);  // req.body has username, email, password as per html input tag names
}

exports.dashboard = async function(req, res) {
    if (req.session.user) { // if not null, user is logged in. fetch feed of posts
        let posts = await Post.getFeed(req.session.user._id);
        res.render('home-dashboard', {posts: posts});
    } else {
        res.render('home-guest', {regErrors: req.flash('regErrors')});   // takes in the ejs html template
    }
}

exports.viewProfilePosts = function(req, res) {
    // before rendering we find the author's posts
    Post.findByAuthorId(req.profileUser._id).then(function(posts) {     // findAuthor has to return a promise, async action
        // after finding posts we can render
        res.render('profile', {
            title: `Perfil de ${req.profileUser.username}`,
            currentPage: 'posts',
            postsByAuthor: posts,
            profileUsername: req.profileUser.username,
            profileAvatar: req.profileUser.avatar,
            isFollowing: req.isFollowing,
            isVisitorsProfile: req.isVisitorsProfile,
            counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
        }); // useful attributes we can use in the EJS profile template
    }).catch( function() {
        res.render("404");  // if some unexpected error while talking to db
    });
}

exports.viewProfileFollowers = async function(req, res) {
    // construct an array of the user's follower
    try{
        let followers = await Follow.getFollowersById(req.profileUser._id);
        console.log("found followers w/o problem")
        res.render('profile-followers', {
            currentPage: 'followers',
            followers: followers,
            profileUsername: req.profileUser.username,
            profileAvatar: req.profileUser.avatar,
            isFollowing: req.isFollowing,
            isVisitorsProfile: req.isVisitorsProfile,
            counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
        });     // almost the same info passed when viewProfilePosts, but we pass the followers instead of posts
    }catch(e) {
        console.log("Something happened: " + e);
        res.render('404');
    }
}

exports.viewProfileFollowings = async function(req, res) {
    try {
        // get the list of the users that the profile is following
        let following = await Follow.getFollowingById(req.profileUser._id);
        res.render('profile-following', {
            currentPage: 'following',
            following: following,
            profileUsername: req.profileUser.username,
            profileAvatar: req.profileUser.avatar,
            isFollowing: req.isFollowing,
            isVisitorsProfile: req.isVisitorsProfile,
            counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
        });
    }catch(e){
        console.log("Something happened: "+e);
        res.render('404');
    }
}

exports.doesUsernameExist = function(req, res) {
    User.findByUsername(req.body.username).then(function() {
        res.json(true);     // responds in json notation with a value of true
    }).catch(function() {       // will run if no username was found
        res.json(false);
    })
}

exports.doesEmailExist = async function(req, res) {
    let emailBool = await User.doesEmailExist(req.body.email);
    res.json(emailBool);
}

exports.apiGetPostsByUsername = async function(req, res) {
    try {
        let authorDoc = await User.findByUsername(req.params.username);
        let posts = await Post.findByAuthorId(authorDoc._id);
        console.log("Succesfully found posts");
        res.json(posts);
    } catch (err){
        res.json("Lo siento, usuario es inválido o no existe: " +err);
    }
}
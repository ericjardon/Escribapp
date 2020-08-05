// It is the router's job to list our all the URLs that 
// we are on the lookout for.
const express = require('express');
const router = express.Router();

const userController = require('./controllers/userController')
const postController = require('./controllers/postController')
const followController = require('./controllers/followController')

// Get request to base URL. Send the html that displays the main page
router.get('/', userController.dashboard);

// User-related routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/logout', userController.logout);

// Post-related routes
router.get('/create-post', userController.mustBeLoggedIn, postController.viewCreateScreen);
router.post('/create-post', userController.mustBeLoggedIn, postController.submitPost);
router.get('/post/:id', postController.viewSingle);
router.get('/post/:id/edit', userController.mustBeLoggedIn, postController.viewEditScreen);
router.post('/post/:id/edit', userController.mustBeLoggedIn, postController.edit); // or saveChanges or update()
router.post('/post/:id/delete', userController.mustBeLoggedIn, postController.delete); // or saveChanges or update()
router.post('/search', postController.search);


// Profile related routes
router.get('/profile/:username', userController.userExists, userController.profileTabs, userController.viewProfilePosts);
router.get('/profile/:username/followers', userController.userExists, userController.profileTabs, userController.viewProfileFollowers);
router.get('/profile/:username/following', userController.userExists, userController.profileTabs, userController.viewProfileFollowings);
router.post('/add-follow/:username', userController.mustBeLoggedIn, followController.addFollow);
router.post('/remove-follow/:username', userController.mustBeLoggedIn, followController.removeFollow);

module.exports = router;
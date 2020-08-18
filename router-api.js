const apiRouter = require('express').Router();

const userController = require('./controllers/userController')
const postController = require('./controllers/postController')
const followController = require('./controllers/followController')

const cors = require('cors');
apiRouter.use(cors());

// no need to include preceding /api/, we already told it to use this router for routes beginning in api/ back in app.js
apiRouter.post('/login', userController.apiLogin)        
apiRouter.post('/create-post', userController.apiMustBeLoggedIn, postController.apiSubmitPost);        
apiRouter.delete('/post/:id', userController.apiMustBeLoggedIn, postController.apiDelete)
apiRouter.get('/postsByAuthor/:username', userController.apiGetPostsByUsername);

module.exports = apiRouter;
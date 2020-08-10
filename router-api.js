const apiRouter = require('express').Router();


const userController = require('./controllers/userController')
const postController = require('./controllers/postController')
const followController = require('./controllers/followController')


// no need to include preceding /api/, we already told it to use this router for routes beginning in api/ back in app.js
apiRouter.post('/login', userController.apiLogin)        

module.exports = apiRouter;
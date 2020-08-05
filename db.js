// remember to install mongodb with npm
const mongodb = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();    // loads in all the values defined in .env

mongodb.connect(process.env.CONNECTIONSTRING, {useNewUrlParser:true, useUnifiedTopology: true},function(err, client) {
    module.exports = client;   // so we can use it from any file in the app
    const app = require('./app');
    app.listen(process.env.PORT);
});
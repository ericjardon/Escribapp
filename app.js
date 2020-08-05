const express = require('express');
const session = require('express-session');
const router = require('./router'); // the extension is not necessary to include
const MongoStore = require('connect-mongo')(session); //what is this syntax?
const flash = require('connect-flash');
const markdown = require('marked');
const sanitizeHTML = require('sanitize-html');
const app = express();


// boilerplate config for express http sessions
let sessionOptions = session({
    secret: "JavaScript is cool",
    store: new MongoStore({client: require('./db')}),
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: 1000 * 60 * 60 * 24, httpOnly: true}
})

app.use(sessionOptions);
app.use(flash());
app.use(express.urlencoded({extended:false}));
app.use(express.json());

// for ALL requests, run this:
app.use(function(req, res, next) {
    // make markdown function available to all ejs
    res.locals.filterUserHtml = function(content) {
        return sanitizeHTML(markdown(content), {allowedTags: ['p','br', 'ul', 'ol', 'li', 'strong', 'bold', 'i', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']})
    }

    // always make current user id available on req object
    if (req.session.user) {
        req.visitorId = req.session.user._id;
    } else {
        req.visitorId = 0;
    };
    // make user session data available to view-templates
    res.locals.user = req.session.user;

    // make flash messages available to all templates
    res.locals.errors = req.flash("errors");
    res.locals.success = req.flash("success");

    next();
})      // tells our app to run this function for each time a request is made

app.use(express.static('public'));

app.set('views','views');    // the first is an express option, the second is the name of folder
app.set('view engine', 'ejs');

app.use('/', router);

const server = require('http').createServer(app);

const io = require('socket.io')(server);

io.on('connection', function(socket){
    socket.on('chatMessageFromBrowser', function(data){
        io.emit('chatMessageFromServer', {message: data.message});
    })
})

module.exports = server;
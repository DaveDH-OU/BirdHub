const express = require('express'); //framework for API
const expressLayouts = require('express-ejs-layouts');  //templating engine
const app = express(); //app object
const flash = require('connect-flash');
const session  = require('express-session');
const mongoose = require('mongoose');

//connect to mongoDB
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);

mongoose.connect('mongodb://localhost/birdhub')
    .then(() => console.log('Connected to mongoDB'))
    .catch(err => console.error('Cant connect to mongoDB', err));

// EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');

//images middleware
app.use(express.static('.'));

// Bodyparser (req.body)
app.use(express.urlencoded({ extended: false}));

// Express session TODO convert values to env variables
app.use(session({
    name: 'auth',
    resave: false,
    saveUninitialized: false,
    secret: 'secret',
    cookie: {
        maxAge: 1000 * 60 * 60 * 2, //two hours
        sameSite: true,
        secure: false //true in production, not in dev
    }
}));
  
// Connect flash
app.use(flash());

// Global Vars middleware
app.use((req, res, next) => {
    res.locals.pass_msg = req.flash('pass_msg');
    res.locals.fail_msg = req.flash('fail_msg');
    res.locals.error = req.flash('error');
    next();
})

// Routes
app.use('/', require('./routes/search'));
app.use('/users', require('./routes/users'));
app.use('/auth', require('./routes/auth'));

app.listen('3000', () => {
    console.log('server started on port 3000');
});
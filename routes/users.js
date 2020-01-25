const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const { Bird }  = require('../models/bird');
const { ensureAuthenticated, forwardAuthenticated } = require('../middleware/auth');

// Login page
router.get('/login', forwardAuthenticated, (req, res) => res.render('Login'));

// Register page
router.get('/register', forwardAuthenticated, (req, res) => res.render('Register'));

// Register user into database
router.post('/register', (req, res) => {
    const { fname, lname, email, password, password2 } = req.body;
    let errors = [];
    //check required fields
    if(!fname || !lname || !email || !password || !password2) {
        errors.push({msg: 'please fill in all fields'});
    }
    //Check if passwords match
    if(password !== password2) {
        errors.push({ msg: 'Passwords do not match'});
    }
    //Password requirements
    if(password.length < 6) {
        errors.push({ msg: 'Password should be at least six characters'});
    }
    //check if email is being used
    async function checkEmailAndRegister() {
        let user = await User.findOne({email: req.body.email });
        if(user){
            errors.push({ msg: 'Email is already registered'});
        }
        //check for any input errors
        if(errors.length > 0) {
            console.log('user register failed');
            res.render('register', {
                errors,
                fname,
                lname,
                email,
                password,
                password2
            });
        }
        //if no errors, register user
        else {
            //Hash password
            const salt = await bcrypt.genSalt(10);
            const hashed = await bcrypt.hash(password, salt);
            user = new User({
                first_name: fname,
                last_name: lname,
                email: email,
                password: hashed
            });
            User.collection.insertOne(user, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log('user added to database');
                    req.flash('pass_msg', 'Registration sucessful.');
                    res.redirect('/users/login');
                }
            });
        }
    }
    checkEmailAndRegister();
});

router.get('/account', ensureAuthenticated, async (req, res) => {
    let updatedInput = { first_name: '', last_name: '', favorite_bird: ''};
    const user = await User.findById(req.session._id);
    let userSightings = user.sightings;

    for(let i = 0; i< user.sightings.length; i++){
        let bird = await Bird.findById(user.sightings[i].bird);
        userSightings[i].bird = bird;
        console.log(userSightings[i]);
    }
    res.render('account', {
        updatedUser: updatedInput,
        user: user,
        userSightings: userSightings 
    });
});

router.post('/account', ensureAuthenticated, async (req, res) => {
    const { inputFname, inputLname } = req.body;
    let updatedInput = { first_name: inputFname, last_name: inputLname};
    const user = await User.findById(req.session._id);
    let userSightings = user.sightings;
    let userUpdated = false;
    let passes = [];

    for(let i = 0; i< user.sightings.length; i++){
        let bird = await Bird.findById(user.sightings[i].bird);
        userSightings[i].bird = bird;
        console.log(userSightings[i]);
    }
    if(inputFname !=  ''){
        passes.push({ msg: 'First name updated.'});
        user.first_name = inputFname;
        userUpdated = true;
    }
    if(inputLname !=  ''){
        passes.push({ msg: 'Last name updated.'});
        user.last_name = inputLname;
        userUpdated = true;
    }
    if(userUpdated){
        user.save(); //save database update if the user changed any info (solves issue with parallel updates)
    }
    res.render('account', {
        updatedUser: updatedInput,
        user: user,
        userSightings: userSightings,
        passes
    });
});

router.get('/logout', ensureAuthenticated, (req, res) => {
    console.log('user logged out');
    req.flash('pass_msg', 'You have been logged out.'); //TODO cant flash messages after session is destroyed
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/');
        }
        res.clearCookie('auth')
        res.redirect('/users/login');
    })
});

module.exports = router;
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/user');

//used to authenticate users during login, generates them a session upon successful login with their _id value inside
router.post('/', async (req, res) => {
    let user = await User.findOne({ email: req.body.email }); //FindOne either returns a result, or null (better than just find)
    console.log(user);
    if(!user){
        req.flash('fail_msg', 'Invalid email or password');
        return res.redirect('/users/login');
    }
    const validPassword = await bcrypt.compare(req.body.password, user.password)
    if(!validPassword) {
        req.flash('fail_msg', 'Invalid email or password');
        return res.redirect('/users/login');
    }
    else { //TODO generate session
        console.log('user logged in successfully');
        req.session._id = user._id;
        //allows you to access user from res.locals
        res.redirect('/'); //look into making cookie http only and based on domain
    }

});

module.exports = router;
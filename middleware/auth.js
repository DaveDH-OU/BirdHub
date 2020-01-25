
//if there is no session for the user they are not logged in
function ensureAuthenticated(req, res, next) {
    if(!req.session._id) {
        req.flash('fail_msg', 'Please login to view this.');
        res.redirect('/users/login');
    }
    else {
        next();
    }
}

//if the user is logged in, they cannot view the register or login page
function forwardAuthenticated(req, res, next) {
    if(req.session._id) {
        res.redirect('/');
    }
    else {
        next();
    }
}

module.exports = {ensureAuthenticated, forwardAuthenticated}
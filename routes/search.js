const express = require('express');
const router = express.Router();
const Bird = require('../models/bird').Bird;
const User = require('../models/user');
const { ensureAuthenticated } = require('../middleware/auth');

let dbClassification;
let dbSubclass;
let dbBeakUse;
let dbColor;
let dbBeakColor;
let dbSize;

async function getFormData() {
    dbClassification = await Bird.find().distinct('classification');
    dbSubclass = await Bird.find().distinct('subclass');
    dbSize = ['S','M','L'];
    dbBeakUse = await Bird.find().distinct('beak_use');
    dbBeakColor = ['black/white/grey/brown','red','orange','yellow','green','blue','purple','pink'];
    dbColor = ['black','grey','white','brown','red','orange','yellow','green','blue','purple','pink'];
}   

function checkLoggedIn(req) {
    let loggedIn = false;
    if(req.session._id != undefined) {
        loggedIn = true;
    }
    return loggedIn;
}

getFormData(); //call function to get all database data for forms

router.get('/', (req, res) => {
    res.render('search', {
        searchResults: null,
        classification: dbClassification,
        subclass: dbSubclass,
        beak: dbBeakUse,
        color: dbColor, 
        beak_color: dbBeakColor,
        size: dbSize,
        loggedIn: checkLoggedIn(req)
    })
});

router.post('/search', async (req, res) => {
    let {classification, subclass, main_color, size, beak_color, beak_use, 
    black, grey, white, brown, red, orange, yellow, green, blue, purple, pink} = req.body; //color returns color_id if checkbox is checked
    let searchQuery = '{'; //begin JSON object builder from user input
    let i = 0; //denotes which find filter is the first input, used for insertion of commas in JSON string builder

    //build search query
    if(classification){
        if(i > 0) searchQuery += ', ';
        i++;
        searchQuery += `"classification": "${classification}"`
    }
    if(subclass){
        if(i > 0) searchQuery += ', ';
        i++;
        searchQuery += `"subclass": "${subclass}"`
    }
    if(main_color){
        if(i > 0) searchQuery += ', ';
        i++;
        searchQuery += `"main_color": "${main_color}"`
    }
    if(size){
        if(i > 0) searchQuery += ', ';
        i++;
        searchQuery += `"size": "${size}"`
    }
    if(beak_color){
        if(i > 0) searchQuery += ', ';
        i++;
        searchQuery += `"beak_color": "${beak_color}"`
    }
    if(beak_use){
        if(i > 0) searchQuery += ', ';
        i++;
        searchQuery += `"beak_use": "${beak_use}"`
    }
    
    //color checkboxes string builder
    let colorList = '';
    let j = 0;
    if(black){
        if(j > 0) colorList += ', ';
        j++;
        colorList += `"black"`;
    }
    if(grey){
        if(j > 0) colorList += ', ';
        j++;
        colorList += `"grey"`;
    }
    if(white){
        if(j > 0) colorList += ', ';
        j++;
        colorList += `"white"`;
    }
    if(brown){
        if(j > 0) colorList += ', ';
        j++;
        colorList += `"brown"`;
    }
    if(red){
        if(j > 0) colorList += ', ';
        j++;
        colorList += `"red"`;
    }
    if(orange){
        if(j > 0) colorList += ', ';
        j++;
        colorList += `"orange"`;
    }
    if(yellow){
        if(j > 0) colorList += ', ';
        j++;
        colorList += `"yellow"`;
    }
    if(green){
        if(j > 0) colorList += ', ';
        j++;
        colorList += `"green"`;
    }
    if(blue){
        if(j > 0) colorList += ', ';
        j++;
        colorList += `"blue"`;
    }
    if(purple){
        if(j > 0) colorList += ', ';
        j++;
        colorList += `"purple"`;
    }
    if(pink){
        if(j > 0) colorList += ', ';
        j++;
        colorList += `"pink"`;
    }
    //if any colors were selected for the search, add it to the query
    if(colorList){
        let colorQuery = '';
        if(i>0) colorQuery += ' ,'; //JSON Syntax
        colorQuery += `"colors": { "$all": [${colorList}] }`
        searchQuery += colorQuery;
    }

    searchQuery += '}'; //End JSON object builder 
    const searchJSON = JSON.parse(searchQuery); //convert search string into JSON object
    console.log(searchJSON);
    const result = await Bird.find(searchJSON);

    res.render('search', {
        searchResults: result,
        classification: dbClassification,
        subclass: dbSubclass,
        beak: dbBeakUse,
        color: dbColor, 
        beak_color: dbBeakColor,
        size: dbSize,
        loggedIn: checkLoggedIn(req)
    });
});

router.post('/addSighting', ensureAuthenticated, async(req, res) => {

    let { sighting }  = req.body;
    const user = await User.findById(req.session._id);
    const newSighting = {
        date: new Date(Date.now()),
        bird: sighting
    };
    user.sightings.push(newSighting);
    user.save();
    res.redirect('/users/account');

});

module.exports = router;
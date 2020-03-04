const express = require('express');
const router = express.Router();
const Bird = require('../models/bird').Bird;
const User = require('../models/user');
const { ensureAuthenticated } = require('../middleware/auth');
const vision = require('@google-cloud/vision');
const formidable = require('formidable');
const fs = require('fs');
const hsv = require('rgb-hsv');
const chalk = require('chalk');
const EJSON = require('mongodb-extended-json');

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

router.post('/imageSearch', async (req, res) => {
    let labelsArray = [];
    let scoreSum = 0;
    let colorsInImage = [];
    let colorsInImageTotal = [];
    let isBird = false;

    let form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
        if (err) throw err
        let oldPath = files.filetoupload.path;
        let newPath = 'C:/Users/Bassm/Desktop/' + files.filetoupload.name; //TODO make __dirname env variable
        fs.rename(oldPath, newPath, function (err) {
            if (err) {
                console.log("cannot change file path");
                let imageSearchResults = [];
                res.render('search', {
                    searchResults: imageSearchResults,
                    classification: dbClassification,
                    subclass: dbSubclass,
                    beak: dbBeakUse,
                    color: dbColor, 
                    beak_color: dbBeakColor,
                    size: dbSize,
                    loggedIn: checkLoggedIn(req)
                });
            }
            console.log('image uploaded to server');
        });
        // Creates a client
        const client = new vision.ImageAnnotatorClient({
            keyFilename:'/Users/Bassm/Desktop/GoogleAPIKey.json'
        });

        // Performs label detection on the image file
        const [result] = await client.labelDetection(newPath); //keep labels and score
        const labels = result.labelAnnotations;
        console.log('Labels:');
        labels.forEach(function(label){
            if(label.description.toLowerCase() === "bird" && label.score > 0.90){
                console.log('this is a bird');
                isBird = true;
            }
            console.log(label.description, label.score);
            if(label.description != 'Bird' && label.description != 'Vertebrate' && label.description != 'Beak' && label.score > 0.50){
                labelsArray.push(label.description.toLowerCase());
            }
        });

        // Performs image properties to get colors of image
        const [result2] = await client.imageProperties(newPath);
        const colors = result2.imagePropertiesAnnotation.dominantColors.colors;
        console.log(colors);
        colors.forEach(color => scoreSum += color.score); //% of image is done by dividing the score of a color by the sum of all other scores

        //gets data and converts rgb into useable color string for database
        colors.forEach(function(color){
            let r = color.color.red;
            let g = color.color.green;
            let b = color.color.blue;
            let percentage = 100*(color.score/scoreSum)
            percentage = percentage.toFixed(2);
            console.log(percentage+'%');
            console.log(chalk.rgb(r,g,b).inverse('                               '));
            let colorString = determineColor(r,g,b);
            colorsInImage.push([percentage, colorString]);
            console.log(colorString);
            console.log('');
        })

        //add shades of colors together
        for(let i = 0; i< colorsInImage.length; i++){
            if(colorsInImage[i] != 'duplicate'){ //eliminate entries that have already been added to the total
                for(let j = i + 1; j < colorsInImage.length; j++){ //search entries after the unique instance
                    if(colorsInImage[j][1] == colorsInImage[i][1]){ //if the color is the same
                        let firstColorInstance = parseFloat(colorsInImage[i][0]); //convert in order to add
                        let percentToBeAdded = parseFloat(colorsInImage[j][0]); //convert in order to add
                        firstColorInstance += percentToBeAdded; //add duplicate percentage to unique percentage
                        firstColorInstance = firstColorInstance.toFixed(2); //formatting
                        colorsInImage[i][0] = firstColorInstance.toString(); //set total back to unique instance
                        colorsInImage[j] = 'duplicate'; //set color that was added to total as duplicate so it will not be counted again
                    }
                }
                colorsInImageTotal.push(colorsInImage[i]); //push unique values and their totals to new array
            }
        }
        //sort colors by highest % in image to lowest
        colorsInImageTotal.sort(function(a,b){
            return b[0] - a[0];
        });
        console.log(colorsInImageTotal);
        console.log(labelsArray);

        //get top 2 colors in image
        let topColors = [];
        topColors.push(colorsInImageTotal[0][1]);
        if(colorsInImageTotal[1]){
            topColors.push(colorsInImageTotal[1][1]);
        }

        //get main colors to rule out, if they are not a part of the top 2 colors of the image
        let obviousMainColors = ["red", "orange", "yellow", "green", "blue", "purple", "pink"];
        let mainColorsToExclude = [];
        for(let i = 0; i < obviousMainColors.length; i++){
            if(topColors[0] != obviousMainColors[i] && topColors[1] != obviousMainColors[i]){
                mainColorsToExclude.push(obviousMainColors[i]);
            }
        }
        console.log('main color cannot be in the list below -------------------')
        console.log(mainColorsToExclude);


        let imageSearchResults;

        if(isBird){
            let result = await Bird.aggregate([
              { 
                  $match: { "tags": { $in: labelsArray }, "colors": { $in: topColors } , "main_color": {$nin: mainColorsToExclude}} 
              },
              {
                  $project: { "tagsCopy": "$tags", "tags":1}
              },
              {
                  $unwind: { path: "$tags" }
              },
              {
                  $match: { tags: {$in: labelsArray} }
              },
              {
                  $group:{"_id":"$_id", "noOfMatches":{$sum:1}, "tags":{ $first:"$tagsCopy" }}
              },
              {
                  $sort:{noOfMatches:-1}
              }
          ]);  
          console.log(result);
          
            if(result.length > 0){
                let highestTagsMatched = result[0].noOfMatches;

                //builds list of IDs to query
                let listOfIDs = '[ ';
                for(let i = 0; i < result.length; i++){
                    //filters results to only include matches with the most tags
                    if(result[i].noOfMatches == highestTagsMatched){
                        if(i != 0){
                            listOfIDs += ", ";
                        }
                        listOfIDs += `{"$oid": "${result[i]._id}"}`;
                    }
                }
                listOfIDs += " ]";
    
                let idQuery = EJSON.parse(`{ "_id": { "$in": ${listOfIDs} } }`);
                imageSearchResults = await Bird.find(idQuery);
                //console.log(imageSearchResults);
            }
            else{
                imageSearchResults = [];
            }
        }
        else{
            imageSearchResults = [];
            console.log('image isnt confirmed to be a bird');
        }

        res.render('search', {
            searchResults: imageSearchResults,
            classification: dbClassification,
            subclass: dbSubclass,
            beak: dbBeakUse,
            color: dbColor, 
            beak_color: dbBeakColor,
            size: dbSize,
            loggedIn: checkLoggedIn(req)
        });
    });
});

function determineColor(r, g, b){
    let hsvA = hsv(r,g,b);
    let hue = hsvA[0];
    let saturation = hsvA[1];
    let value = hsvA[2];
    console.log(hue, saturation, value);

    if(value <= 15) return 'black';
    if(saturation <= 10 && (value < 85 && value > 10)) return 'grey';
    if(saturation <= 10 && value >= 85) return 'white';

    if(hue >= 15 && hue <= 50){ //brown most complex, check first
        if(saturation >= 90 && (value > 10 && value <=60)) return 'brown';
        if((saturation >= 70 && saturation < 90) && (value > 10 && value <=65)) return 'brown';
        if((saturation >= 60 && saturation < 70) && (value > 10 && value <=70)) return 'brown';
        if((saturation >= 41 && saturation < 59) && (value > 10 && value <=75)) return 'brown';
        if((saturation >= 11 && saturation < 40) && (value > 10 && value <=80)) return 'brown';
    }
    if(hue <= 20 || hue >= 336){ //red could be pink which then could be purple TODO
        if((hue > 10 && hue <= 336) && saturation < 80 && value > 75) return 'orange';
        if((hue <= 10 || hue >= 351) && saturation < 60) return 'pink';
        if((hue >= 346 && hue <= 350) && saturation < 70) return 'pink';
        if((hue >= 341 && hue <= 345) && saturation < 75) return 'pink';
        if((hue >= 336 && hue <= 340) && saturation < 85) return 'pink';
        return 'red';
    }
    if(hue >= 21 && hue <= 41){
        return 'orange';
    }
    if(hue >= 42 && hue <= 65){ //could be green if value is low
        if((hue >= 42 && hue <= 60) && value < 50) return 'green';
        if((hue >= 61 && hue <= 65) && value < 60) return 'green';
        return 'yellow';
    }
    if(hue >= 66 && hue <= 179){
        return 'green';
    }
    if(hue >= 180 && hue <= 260){ //low saturation blue = purple
        if((hue >= 241 && hue <= 250)  && saturation <= 50) return 'purple';
        if((hue >= 251 && hue <= 260)  && saturation <= 70) return 'purple';
        return 'blue';
    }
    if(hue >= 261 && hue <= 290){
        if(hue >= 280 && saturation <= 40) return 'pink'
        return 'purple';
    }
    if(hue >= 291 && hue <= 335){ //could be purple  or red (low values on both sides)
        if(hue <= 295 && value <= 80) return 'purple';
        if((hue >= 296 && hue <= 310)  && value <= 65) return 'purple';
        if((hue >= 311 && hue <= 320)  && value <= 50) return 'purple';
        if((hue >= 321 && hue <= 329)  && value <= 40) return 'purple';
        if((hue >= 330 && hue <= 335)  && value <= 50) return 'red';
        return 'pink';
    }
    else return 'color not found';
}



module.exports = router;
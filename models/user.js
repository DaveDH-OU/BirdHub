const mongoose = require('mongoose');
const sighting = require('./sighting').sightingSchema;

const userSchema = new mongoose.Schema({
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    //all sightings are nested inside the user document
    sightings: {
        type: [ sighting ]
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
const mongoose = require('mongoose');

//nested inside user document, so no need to store user information or create a new model
const sightingSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    //reference to id of a bird
    bird: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bird',
        required: true
    }
});

module.exports = sightingSchema;
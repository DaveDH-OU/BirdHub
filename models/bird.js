const mongoose = require('mongoose');

const birdSchema = new mongoose.Schema({
    species: { 
        type: String, 
        required: true,
    },
    main_color: { 
        type: String,
        required: true,
        enum: ['black','grey','white','brown','red','orange','yellow','green','blue','purple','pink']
    },
    classification: { 
        type: String,
        required: true,
        enum: ['corvid','waterfowl','songbird','shorebird','raptor','terrestrial','seabird']
    },
    subclass: { 
        type: String,
        required: true
    },
    size: { 
        type: String,
        required: true,
        maxlength: 1,
        enum: ['S','M','L']
    },
    beak_use: { 
        type: String,
        required: true,
        enum: ['catching insects','cracking seeds','drilling holes','filtering','fishing','probing','tearing meat']
    },
    beak_color: { 
        type: String,
        required: true,
        enum: ['black/white/grey/brown','red','orange','yellow','green','blue','purple','pink']
    },
    colors: {
        type: [ String ],
        required: true,
        enum: ['black','grey','white','brown','red','orange','yellow','green','blue','purple','pink']
    },
    image: { 
        type: String,
        required: true
    }
});

const Bird = mongoose.model('Bird', birdSchema);

module.exports = { Bird, birdSchema };
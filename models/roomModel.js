const mongoose = require('mongoose')
const roomSchema = new mongoose.Schema({
    roomNo:{
        type: Number,
        required: true,
        unique: true
    },
    roomDetails:{
        type: String,
        required: true  
    },
    Price:{
        type: Number,
        required: true
    },
    roomPictures:{
        type: String,
        default:''
    },
    isBooked:{
        type: Boolean,
        default: false
    },
    bookedTill:{
        type: Date,
    }
})

const Room = new mongoose.model('Room', roomSchema)

module.exports = Room;
const mongoose = require('mongoose')

const bookingSchema = mongoose.Schema({
    to:{
        type: Date,
        required: true
    },
    from:{
        type: Date,
        required: true
    },
    bookId:{
        type: String,
        required: true,
        unique: true
    },

    UserName:{
        type: String,
    },
    email:{
        type: String,
        required: true
    },

    roomNo:{
        type: Number,
        required: true

    },
    completed:{
        type: Boolean,
        default: false
    },
    cancelled:{
        type: Boolean,
        default: false
    }
    ,
    extraTime:{
        type: Number,
        default: 0
    },
    bookedDate:{
        type: Date,
        default: Date.now
    },
    completedDate:{
        type: Date
    }

})

const Booking = new mongoose.model('Booking', bookingSchema)
module.exports = Booking
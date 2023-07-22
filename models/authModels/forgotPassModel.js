const mongoose = require('mongoose')
const validator = require('validator')


const forgotSchema = new mongoose.Schema({

    email: {
        type: String,
        required: true,
        unique: [true, "Enter a unique email"],
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Invalid Email")
            }
        }
    },

    otp: {
        type: Number,
        required: true
    },
})



// we will create a new collection
const Forgot = new mongoose.model('Forgot', forgotSchema)

module.exports = Forgot;
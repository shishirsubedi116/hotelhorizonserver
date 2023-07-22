const mongoose = require('mongoose')
const validator = require('validator')

const UserOtp = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        minlength: 3
    },
    Address: {
        type: String
    },
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
        type: Number
    },
    password: {
        type: String,
        required: true
    }
})


module.exports = mongoose.model('UserOtp', UserOtp)
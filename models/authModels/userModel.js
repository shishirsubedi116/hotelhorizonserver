const mongoose = require('mongoose')
const validator = require('validator')

const userSchema = new mongoose.Schema({
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

    password: {
        type: String,
        required: true
    }
})

// we will create a new collection
const User = new mongoose.model('User', userSchema)

module.exports = User;
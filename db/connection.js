const mongoose = require('mongoose')

//Connection of the server to the mongoDB database
mongoose.connect(`${process.env.DB}`, ()=>{
    console.log('DB Connected...');
})
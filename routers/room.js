//Routes for adding a new room and 

const express = require('express');
const router = express.Router();
const Room = require('../models/roomModel');
const multer = require('multer');
const verifyUser = require('../middleware/verifyUser')

//Multer Setup
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/rooms');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '_' + file.originalname);
    }
})

var upload = multer({ storage: storage });

//Post request for new room (no frontend available for this one post the room through postman/thunderclient)
//Four files are compulsory because I was too lazy to use looping while getting the file names
router.post('/newroom', verifyUser, upload.single('roomPictures'), async (req, res) => {
    if (req.user !== process.env.ADMIN) {
        return res.status(400).json({ success: false, message: "You are not authorized to View the rooms" });
    }

    let roomPictures = req.file.filename; //Getting filesNames from req.files

    let { roomNo, roomDetails, Price } = req.body; //Body data from req.body

    try {
        //New Room
        let newRoom = new Room({ roomNo, roomDetails, Price, roomPictures });
        await newRoom.save();
        return res.status(201).json({ success: true, message: "Room Added" });
    } catch (error) {

        return res.status(400).json({ success: false, message: "some error occured" });
    }
})

//Get request for all rooms
router.get('/allrooms', async (req, res) => {
    try {
        let rooms = await Room.find(); //Finding all the rooms
        if (rooms) {
            return res.status(200).json({ success: true, message: rooms });
        }
        else {
            return res.status(400).json({ success: false, message: "some error occured" });
        }
    } catch (error) {

        return res.status(400).json({ success: false, message: "some error occured" });
    }
})


//Get Request for only one room 
router.get('/singleroom/:roomNo', async (req, res) => {
    try {
        const room = await Room.findOne({ roomNo: req.params.roomNo })
        if (room) {
            return res.status(200).json({ success: true, message: room });
        }
        else {
            return res.status(400).json({ success: false, message: "Room not found" });
        }

    } catch (error) {
        return res.status(400).json({ success: false, message: "some error occured" });
    }
})

module.exports = router;
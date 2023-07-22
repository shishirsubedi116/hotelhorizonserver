//Routes for booking the room

const express = require('express');
const router = express.Router();
const verifyUser = require('../middleware/verifyUser');
const Booking = require('../models/bookModel');
const Room = require('../models/roomModel');
const User = require('../models/authModels/userModel');
const nodemailer = require('nodemailer');

//For Booking a room
router.post('/bookroom', verifyUser, async (req, res) => {

    const randomNo = 5000 + (9999 - 5000) * Math.random()
    let randomNumber = Math.round(randomNo)

    const { to, from, roomNo } = req.body;
    if (!to || !from || !roomNo) {
        return res.status(400).json({ success: false, message: "Fill The Data Properly" });
    }
    try {
        const toDate = new Date(to).getTime()
        const fromDate = new Date(from).getTime()
        //Checking if from date is greater or less than to date
        if (fromDate > toDate) {
            return res.status(400).json({ success: false, message: "From Date Should Be Less Than To Date" });
        }

        //You can't book the room if you are booking from day after tomorrow
        if (fromDate > (Date.now() + 86400000)) {
            return res.status(400).json({ success: false, message: "From Date Should Not Be Greater Than Tomorrow" });
        }

        //Fromdate must be more than current date and time
        if (fromDate < (Date.now())) {
            return res.status(400).json({ success: false, message: "From Date Should Be Greater than now's time" });
        }
        try {
            const user = await User.findById(req.user);
            const email = user.email;
            const room = await Room.findOne({ roomNo: roomNo });
            if (room.isBooked) {
                return res.status(400).json({ success: false, message: "Room Already Booked" });
            }
            const book = new Booking({
                to, from, roomNo, email, UserName: user.name, bookId: roomNo + '_' + randomNumber + '_' + Date.now()
            });
            const booked = await book.save();
            if (booked) {
                await room.updateOne({ isBooked: true });
                await room.updateOne({bookedTill: to})

                //Nodemailer Setup(authentication)
                let transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'threatyour@gmail.com',
                        pass: `${process.env.PASS}`
                    }
                });

                //Nodemailer Setup(requirements  & details)
                let info = transporter.sendMail({
                    from: 'threatyour@gmail.com',
                    to: `${email}`,
                    subject: 'Your OTP',
                    text: `Dear ${user.name}, You have booked room ${roomNo} in our hotel from ${from} to ${to}. 
                        Thank You for using our service. You should pay the price when you come to hotel. You can cancel the booking under 2 hours if you want. If you exceed two hours then you need to call the hotel. You should come to hotel under 24 hours.
                        
                        From Hotel Horizon
                    `
                });
                return res.status(201).json({ success: true, message: "Room Booked Successfully" });
            }
            else {
                return res.status(400).json({ success: false, message: "Room Booking Failed" });
            }
        } catch (error) {
            return res.status(400).json({ success: false, message: "some error occured" });
        }
    } catch (error) {
        return res.status(400).json({ success: false, message: "some error occured" });
    }
})

//View all Rooms(For Users)
router.get('/allrooms', async (req, res) => {
    const { page, limit } = req.query
    try {
        const rooms = await Room.find().limit(limit * 1).skip((page - 1) * limit);

        if (rooms.length > 0) {
            return res.status(200).json({ success: true, total: rooms.length, message: "Rooms Fetched Successfully", rooms });
        }
        else {
            return res.status(404).json({ success: false, message: "No Rooms Found" });
        }
    } catch (error) {
        return res.status(400).json({ success: false, message: "some error occured" });
    }
})


//Cancel The Booking(User)
router.post('/cancelbooking', verifyUser, async (req, res) => {
    const { roomNo } = req.body;
    if (!roomNo) {
        return res.status(400).json({ success: false, message: "Please Enter Room Number" });
    }
    try {
        const room = await Room.findOne({ roomNo: roomNo });
        const Book = await Booking.findOne({ roomNo: roomNo, completed: false });
        const user = await User.findOne({_id: req.user})

        if (room && Book) {
            const date = new Date(Book.bookedDate).getTime()
            today = Date.now()

            if ((today - date) > 7200000) {
                return res.status(400).json({ success: false, message: "You can't cancel it after 2 hours of booking. Please contact to Hotel for cancellation" });
            }

            if (!room.isBooked) {
                return res.status(400).json({ success: false, message: "This Room Is Not Booked" });
            }
            if (Book.cancelled) {
                return res.status(400).json({ success: false, message: "This Booking Is Already Cancelled" });
            }
            if (Book.email == user.email) {
                await room.updateOne({ isBooked: false });
                
                // await Book.updateOne({ completed: true });
                // await Book.updateOne({ cancelled: true });
                // await Book.updateOne({ completedDate: Date.now });
                await Booking.updateMany({ roomNo: roomNo }, { $set: { completed: true, cancelled: true, completedDate: Date.now()} })
                return res.status(200).json({ success: true, message: "Booking Cancelled Successfully" });
            }
            else {
                return res.status(400).json({ success: false, message: "You didn't booked this room " });
            }

        } else {
            return res.status(400).json({ success: false, message: "Booking Does Not Exist" });
        }
    } catch (error) {
        return res.status(400).json({ success: false, message: "some error occured" });
    }
})

//Add Extra Time
router.post('/addextratime', verifyUser, async (req, res) => {
    const { eTime, roomNo } = req.body
    if (!eTime || !roomNo) {
        return res.status(400).json({ success: false, message: "Please Fill the fields properly" });
    }
    try {
        const room = await Room.findOne({ roomNo: roomNo });
        const Book = await Booking.findOne({ roomNo: roomNo, completed: false });

        if (!room.isBooked) {
            return res.status(400).json({ success: false, message: "This Room Is Not Booked" });
        }
        else {
            if (Book.userId == req.user) {
                let et = parseInt(Book.extraTime);
                await Book.updateOne({ extraTime: et + eTime });
                const newDate = new Date(Book.to)
                newDate.setDate(newDate.getDate() + eTime)
                await Booking.updateOne({ roomNo: roomNo }, { $set: { to: newDate } })

                return res.status(200).json({ success: true, message: "Time Added" });
            }
            else {
                return res.status(400).json({ success: false, message: "You are not allowed" });
            }
        }

    } catch (error) {
        return res.status(400).json({ success: false, message: "some error occured" });
    }
})

//Router to fetch the rooms you booked

router.get('/mybookedrooms', verifyUser, async (req, res) => {
    try {
        const findUser = await User.findOne({ _id: req.user })
        const BookedRooms = await Booking.find({ email: findUser.email, completed: false });
        if (BookedRooms) {
            return res.status(200).json({ success: true, message: BookedRooms });
        } else {
            return res.status(400).json({ success: false, message: "You Have Not Booked Any Room" });
        }

    } catch (error) {
        return res.status(400).json({ success: false, message: "some error occured" });
    }
})



//Trial
router.get('/random', async (req, res) => {

})

//consider this feature at last after creating frontEnd
// --> people can book the room even though the room is already booked
// --> by scheduling the booking time and filtering the booking time and allowing user to book the room before or after that time

// --> Format date into local date and time
module.exports = router;
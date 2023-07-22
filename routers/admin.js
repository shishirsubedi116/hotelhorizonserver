//Routes for admin pages
const express = require('express')
const router = express.Router()
const verifyUser = require('../middleware/verifyUser');
const Booking = require('../models/bookModel');
const Room = require('../models/roomModel');


//Find the Booked Rooms (For Admin)
router.get('/getroomdetails', verifyUser, async (req, res) => {
    //Checking if the user is admin or not
    if (req.user !== process.env.ADMIN) {
        return res.status(400).json({ success: false, message: "You are not authorized to view the booked rooms" });
    }
    else {
        try {
            //Finding the booked rooms
            const rooms = await Room.find({ isBooked: true });
            if (rooms.length <= 0) {
                return res.status(400).json({ success: false, message: "No Rooms Booked" });
            }
            else {
                return res.status(200).json({ success: true, total: rooms.length, message: rooms });
            }
        } catch (error) {
            return res.status(400).json({ success: false, message: "some error occured" });
        }
    }
})

//Get All incomplete Bookings
router.get('/allincompletebookings', verifyUser, async (req, res) => {
    //Checking if the user is admin or not
    if (req.user !== process.env.ADMIN) {
        return res.status(400).json({ success: false, message: "You are not authorized to view the booked rooms" });
    }
    else {
        try {
            //Following logic is to automatically complete the booking of the users who's to date is expired
            try {
                const Allbookings = await Booking.find({ completed: false });
                try {
                    for (let i = 0; i < Allbookings.length; i++) {
                        var date = new Date(Allbookings[i].to).getTime();
                        if (date < Date.now()) {
                            var findRoom = await Room.findOne({ roomNo: Allbookings[i].roomNo });
                            await findRoom.updateOne({ isBooked: false });
                            await Allbookings[i].updateOne({ completed: true })
                            await Allbookings[i].updateOne({ cancelled: false })
                            await Allbookings[i].updateOne({ completedDate: Date.now() })
                        }
                    }
                    //Finding the booked rooms
                    const rooms = await Booking.find({ completed: false })
                    if (rooms.length <= 0) {
                        return res.status(400).json({ success: false, message: "No Rooms Booked" });
                    }
                    //Although This will return the  total booked rooms
                    return res.status(200).json({ success: true, total: rooms.length, message: rooms });
                } catch (error) {
                    return res.status(400).json({ success: false, message: "some error occured in changing" });
                }
            } catch (error) {
                return res.status(400).json({ success: false, message: "some error occured" });
            }


        }
        catch (error) {
            return res.status(400).json({ success: false, message: "some error occured" });
        }
    }

})



//Discard Booking(By Admin)
//If any issues is there by which user can't come to hotel, then following logic is used
router.post('/discardbooking', verifyUser, async (req, res) => {
    const { roomNo } = req.body;
    if (!roomNo) {
        return res.status(400).json({ success: false, message: "Please Enter Room Number" });
    }
    // Checking is the user is admin or not
    if (req.user !== process.env.ADMIN) {
        return res.status(400).json({ success: false, message: "You are not authorized to discard the booked rooms" });
    }
    else {
        try {
            const room = await Room.findOne({ roomNo: roomNo });
            const Book = await Booking.findOne({ roomNo: roomNo, completed: false });
            if (room && Book) {
                //Checking if the room is booked or already cancelled or not
                if (!room.isBooked) {
                    return res.status(400).json({ success: false, message: "This Room Is Not Booked" });
                }
                if (Book.cancelled) {
                    return res.status(400).json({ success: false, message: "This Booking Is Already Cancelled" });
                }
                else {
                    //Updating to set the room free to book
                    await room.updateOne({ isBooked: false });
                    await Booking.updateMany({ roomNo: roomNo }, { $set: { completed: true, cancelled: true, completedDate: Date.now() } })
                    return res.status(200).json({ success: true, message: "Booking Discarded Successfully" });
                }
            } else {
                return res.status(400).json({ success: false, message: "Room/Booking Does Not Exist" });
            }

        } catch (error) {

            return res.status(400).json({ success: false, message: "some error occured" });
        }
    }
})

//Booking Completed(Admin)
//Admin can manually mark complete to the booking also
router.post('/completebook', verifyUser, async (req, res) => {
    if (req.user !== process.env.ADMIN) {
        return res.status(400).json({ success: false, message: "You are not authorized to complete the booked rooms" });
    }
    const { roomNo } = req.body;
    if (!roomNo) {
        return res.status(400).json({ success: false, message: "Please Enter Room Number" });
    }
    try {
        const room = await Room.findOne({ roomNo: roomNo });

        if (!room.isBooked) {
            return res.status(400).json({ success: false, message: "This Room Is Not Booked" });
        }
        else {
            try {
                await room.updateOne({ isBooked: false });
                await Booking.updateMany({ roomNo: roomNo }, { $set: { completed: true, cancelled: false, completedDate: Date.now() } })
                return res.status(200).json({ success: true, message: "Booking Finished Successfully" });
            } catch (error) {
                return res.status(400).json({ success: false, message: "some error occured" });;
            }
        }

    } catch (error) {

        return res.status(400).json({ success: false, message: "some error occured" });
    }
})

//Find all the bookings (till date) For admin
router.get('/getallbookings', verifyUser, async (req, res) => {
    if (req.user !== process.env.ADMIN) {
        return res.status(400).json({ success: false, message: "You are not authorized to View the rooms" });
    }
    try {
        const Bookings = await Booking.find().sort({ completed:1 });
        if (Bookings.length > 0) {
            return res.status(200).json({ success: true, total: Bookings.length, message: Bookings });
        }
        else {
            return res.status(400).json({ success: false, message: "No Bookings Found" });
        }

    } catch (error) {

        return res.status(400).json({ success: false, message: "some error occured" });
    }

});

//Automatic complete booking(Not necessary)
router.patch('/autocomplete', verifyUser, async (req, res) => {
    if (req.user !== process.env.ADMIN) {
        return res.status(400).json({ success: false, message: "You are not authorized" });
    }
    try {
        const Allbookings = await Booking.find({ completed: false });
        try {
            for (let i = 0; i < Allbookings.length; i++) {
                var date = new Date(Allbookings[i].to).getTime();
                if (date < Date.now()) {
                    var findRoom = await Room.findOne({ roomNo: Allbookings[i].roomNo });
                    await findRoom.updateOne({ isBooked: false });
                    await Allbookings[i].updateOne({ completed: true })
                    await Allbookings[i].updateOne({ cancelled: false })
                    await Allbookings[i].updateOne({ completedDate: Date.now() })
                }
            }
            return res.status(200).json({ success: true, message: "Changes done" });
        } catch (error) {
            return res.status(400).json({ success: false, message: "some error occured in changing" });
        }
    } catch (error) {
        return res.status(400).json({ success: false, message: "some error occured" });
    }
})



module.exports = router
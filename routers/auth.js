//Routes for authentication 
const express = require('express');
const router = express.Router();
const User = require('../models/authModels/userModel');
const UserOtp = require('../models/authModels/otpModel');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Forgot = require('../models/authModels/forgotPassModel');
const verifyUser = require('../middleware/verifyUser');

//Signup new user
router.post('/signup', async (req, res) => {

    //Getting data from req.body and checking if any fields are blank or not
    const { name, email, password, Address } = req.body;

    if (!name || !email || !password || !Address) {
        return res.status(400).json({ success: false, message: "Please fill all the fields correctly" });
    }

    try {
        //Checking if the user already exists or not
        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ success: false, message: "User already exist" });
        }

        else {
            //Generating the OTP
            const randomNo = 1000 + (9999 - 1000) * Math.random();
            let OTP = Math.round(randomNo);

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
                text: `${OTP} is Your Otp for Signup in Hotel Horizon

                If any error occured, please try again. Please verify under 1 minute
                `
            });

            try {
                //Adding the userdetails to the temporary model of the database(Data will be transferred into main model later on)
                const isOtp = await UserOtp.findOne({email: email})
                //Delete the previous otp if it is not verified.
                if(isOtp){
                    await UserOtp.findByIdAndDelete(isOtp._id)
                }
                const newOtpUser = new UserOtp({ name, email, password, Address, otp: OTP });
                await newOtpUser.save();
                return res.status(200).json({ success: true, message: "OTP SENT" });

            } catch (error) {
                return res.status(400).json({ success: false, message: "some error occured" });
            }
        }

    } catch (error) {
        return res.status(400).json({ success: false, message: "some error occured" });
    };
});

//Verify the otp
router.post('/verifyotp', async (req, res) => {

    //Getting data from req.body and checking if any fields are blank or not
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ success: false, message: "Please fill all the fields correctly" });
    };

    try {
        //Checking if there is user or not
        const user = await UserOtp.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid Details try again" });
        }

        //Verifying the otp
        if (user.otp == otp) {
            //Getting the data from temporary model of the database(from the vavriable named user) and storing the database into the main model 
            let hashedPass = await bcrypt.hash(user.password, 12)
            const newUser = new User({ name: user.name, email: user.email, password: hashedPass, Address: user.Address });

            //Saving the user
            await newUser.save();

            //Deleting the user from temporary model because it will consume less space 
            await UserOtp.findByIdAndDelete(user._id);
            return res.status(201).json({ success: true, message: "OTP Verified" });

        } else {
            //If the otp is wrong, the object will be deleted from the database and user has to signin again 
            //It is due to security reasons

            await UserOtp.findByIdAndDelete(user._id);
            return res.status(400).json({ success: false, message: "Try Again Signing in" });
        };
    } catch (error) {
        return res.status(400).json({ success: false, message: "some error occured" });
    };
});


//login the user
router.post('/login', async (req, res) => {

    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Fields cannot be blank" });
    }
    try {
        //Checking if there is user or not
        const userLogin = await User.findOne({ email: email });
        if (userLogin) {
            //comparing passwords
            const isMatch = await bcrypt.compare(password, userLogin.password);

            //generating auth token which will expire under 1 hour
            const token = jwt.sign({ _id: userLogin._id }, process.env.SECRET, { expiresIn: '1h' });

            //Checking if the passwords matched or not
            if (!isMatch) {
                return res.status(400).json({ success: false, message: 'Invalid Credentials' });
            } else {
                if (userLogin._id == process.env.ADMIN) {
                    return res.status(201).json({ success: true, message: token, isAdmin: true });
                }
                //Sending the token to the user
                return res.status(201).json({ success: true, message: token });
            }
        }
        else {
            return res.status(400).json({ success: false, message: "Invalid Credentials" });
        };

    } catch (error) {
        return res.status(400).json({ success: false, message: "some error occured" });
    };
});


//Forgot password (send otp to email)
router.post('/forgot', async (req, res) => {
    const { email } = req.body;
    try {
        //Checking if the user exists or not
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: "User doesnot exist" });
        }

        //Generating the OTP
        const randomNo = 1000 + (9999 - 1000) * Math.random();
        let OTP = Math.round(randomNo);

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
            text: `${OTP} is Your Otp for recovering your account in Hotel Horizon
        
                        If any error occured, please try again. Please verify under 1 minute
                        `
        });

        try {
            //Adding the userdetails to the temporary model of the database(Data will be transferred into main model later on)
            const isOtp = await Forgot.findOne({email: email})
            console.log(isOtp);
            if(isOtp){
                await Forgot.findByIdAndDelete(isOtp._id)
            }
            const newOtpUser = await new Forgot({ email, otp: OTP });
            await newOtpUser.save();
            return res.status(200).json({ success: true, message: "OTP SENT please verify" });

        } catch (error) {
            return res.status(400).json({ success: false, message: "some error occured" });
        }


    } catch (error) {
        return res.status(400).json({ success: false, message: "some error occured" });
    }
})

//verify the otp for forgot password
router.post('/verify', async (req, res) => {
    //Getting data from req.body and checking if any fields are blank or not
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ success: false, message: "Please fill all the fields correctly" });
    };

    try {
        //Checking if there is user or not
        const user = await Forgot.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid Details try again" });
        }

        //Verifying the otp
        if (user.otp == otp) {
            //generating auth token which will expire under 1 hour
            const token = jwt.sign({ _id: email }, process.env.SECRET, { expiresIn: '1h' });

            //Deleting the user from temporary model because it will consume less space 
            await Forgot.findByIdAndDelete(user._id);
            return res.status(201).json({ success: true, message: token });

        } else {
            //If the otp is wrong, the object will be deleted from the database and user has to signin again 
            //It is due to security reasons

            await Forgot.findByIdAndDelete(user._id);
            return res.status(400).json({ success: false, message: "Try Again Signing in" });
        };
    } catch (error) {
        return res.status(400).json({ success: false, message: "some error occured" });
    };
})

//Set New Password
router.patch('/newpass', verifyUser, async (req, res) => {
    const { password } = req.body;
    if (!password) {
        return res.status(400).json({ success: false, message: "password cannot be empty" })
    }

    try {
        const findUser = await User.findOne({ email: req.user })
        if (!findUser) {
            return res.status(400).json({ success: false, message: "Sorry, some error occured. Please try again from the start" })
        }

        let newPass = await bcrypt.hash(password, 12)
        await findUser.updateOne({ password: newPass })

        return res.status(201).json({ success: true, message: "Password set successfully" })

    } catch (error) {
        return res.status(400).json({ success: false, message: "some error occured" });
    }
})


//Change password
router.patch('/changepass', async (req, res) => {
    const { email, password, newPassword } = req.body;
    if (!email || !password || !newPassword) {
        return res.status(400).json({ success: false, message: "password cannot be empty" })
    }

    try {
        const findUser = await User.findOne({ email: email })
        if (!findUser) {
            return res.status(400).json({ success: false, message: "Sorry, some error occured. Please try again" })
        }

        const isMatch = await bcrypt.compare(password, findUser.password);
        //Checking if the passwords matched or not
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid Credentials' });
        }

        //Checking if current password is same as previous password
        const isSame = await bcrypt.compare(newPassword, findUser.password)
        if (isSame) {
            return res.status(400).json({ success: false, message: 'Current password cannot be your new password' });
        }

        let newPass = await bcrypt.hash(newPassword, 12)
        await findUser.updateOne({ password: newPass })

        return res.status(201).json({ success: true, message: "Password changed successfully" })

    } catch (error) {
        return res.status(400).json({ success: false, message: "some error occured" });
    }
})


module.exports = router

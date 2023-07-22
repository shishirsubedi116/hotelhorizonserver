//Middleware to verify if the user is valid or not

const jwt = require('jsonwebtoken')
const secretKey = process.env.SECRET

const verifyUser = async (req, res, next) => {

    //Get the token from the header
    const token = req.header('token');
    if (!token) {
        return res.status(401).send({ success: false, message: "Please authenticate using a valid token"})
    }
    try {
        //Verifying and getting the userId from the token
        const data = await jwt.verify(token, secretKey);
        req.user = data._id;
        next();

    } catch (error) {
       return res.status(401).send({ success: false, message: "Please authenticate using a valid token" });
    }
}
module.exports = verifyUser
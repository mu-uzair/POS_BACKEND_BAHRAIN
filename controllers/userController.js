const createHttpError = require("http-errors");
const User = require('../models/userModel');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
// const { config } = require("dotenv");
require("dotenv").config(); // Load environment variables

const { accessTokenSecret } = require("../config/config");



const register = async (req, res, next) => {
    try {

        const { name, phone, email, password, role } = req.body;
        if (!name || !phone || !email || !password || !role) {
            const error = createHttpError(400, " All fields are required");
            return next(error);
        }

        const isUserPresent = await User.findOne({ email })
        if (isUserPresent) {
            const error = createHttpError(400, "User already exist!");
            return next(error);
        }

        const user = { name, phone, email, password, role };
        const newUser = User(user);
        await newUser.save(); // save the data in DB

        res.status(201).json({ sucess: true, message: "New user created!", data: newUser });

    } catch (error) {
        next(error)
    }

}

const login = async (req, res, next) => {

    


    try {
        const { email, password } = req.body;

        if (!email || !password) {
            const error = createHttpError(400, "All fields are required!");
            return next(error);
        }
        const isUserPresent = await User.findOne({ email });

        if (!isUserPresent) {
            const error = createHttpError(401, "Invalid Credentials");
            return next(error);
        }

        const isMatch = await bcrypt.compare(password, isUserPresent.password);
        if (!isMatch) {
            const error = createHttpError(401, "Invalid Password");
            return next(error);
        }
        const accessToken = jwt.sign({ _id: isUserPresent }, process.env.JWT_SECRET, {
            expiresIn: '1d'
        });

      


        // console.log("User Found:", isUserPresent);
        // console.log("Access Token Secret:", process.env.JWT_SECRET);

        // console.log("Generated Token:", accessToken);

        // res.cookie('accessToken', accessToken, {
        //     maxAge: 1000 * 60 * 60 * 24 * 30,
        //     //httpOnly: true,
        //     sameSite: 'none',
        //     secure: true
        // })

        // changes for render auto login
        res.cookie('accessToken', accessToken, {
            maxAge: 1000 * 60 * 60 * 24, // 1 day — adjust as per need
            httpOnly: true, // Prevent JavaScript access to cookie
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // None for Render, Lax for localhost
            secure: process.env.NODE_ENV === 'production', // Secure true on production (HTTPS)
        });
        

        res.status(200).json({
            success: true,
            message: "User logged in successfully!",
            token: accessToken,   
            data: isUserPresent
        });
    } catch (error) {
        next(error);

    }
}

const getUserData = async (req, res, next) => {

    try {

        const user = await User.findById(req.user._id);
        res.status(200).json({ sucess: true, data: user });
    } catch (error) {
        next(error);

    }

}


const logout = async(req, res, next) => {

    try {

        // res.clearCookie('accessToken');
        // res.status(200).json({success: true, message:" User logout sucessfully"})

        // for auto login render

        res.clearCookie('accessToken', {
            httpOnly: true,
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // Same as when setting
            secure: process.env.NODE_ENV === 'production', // Same as when setting
        });
        res.status(200).json({ success: true, message: "User logged out successfully" });
        

    } catch (error) {
        next(error);
        
    }


}
module.exports = { register, login, getUserData, logout } 

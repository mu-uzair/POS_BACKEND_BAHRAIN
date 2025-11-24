// const createHttpError = require("http-errors");
// const User = require('../models/userModel');
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
// // const { config } = require("dotenv");
// require("dotenv").config(); // Load environment variables

// const { accessTokenSecret } = require("../config/config");



// // const register = async (req, res, next) => {
// //     try {

// //         const { name, phone, email, password, role } = req.body;
// //         if (!name || !phone || !email || !password || !role) {
// //             const error = createHttpError(400, " All fields are required");
// //             return next(error);
// //         }

// //         const isUserPresent = await User.findOne({ email })
// //         if (isUserPresent) {
// //             const error = createHttpError(400, "User already exist!");
// //             return next(error);
// //         }

// //         const user = { name, phone, email, password, role };
// //         const newUser = User(user);
// //         await newUser.save(); // save the data in DB

// //         res.status(201).json({ sucess: true, message: "New user created!", data: newUser });

// //     } catch (error) {
// //         next(error)
// //     }

// // }

// const register = async (req, res, next) => {
//   try {
//     const { name, phone, email, password } = req.body; // remove 'role' from here

//     if (!name || !phone || !email || !password) {
//       return next(createHttpError(400, "All fields are required"));
//     }

//     const isUserPresent = await User.findOne({ email });
//     if (isUserPresent) {
//       return next(createHttpError(400, "User already exists!"));
//     }

//     // Force role to always be "Cashier" or "Employee"
//     const user = { name, phone, email, password, role: "Cashier" };
//     const newUser = new User(user);
//     await newUser.save();

//     res.status(201).json({
//       success: true,
//       message: "New user created successfully (default role: Cashier)",
//       data: newUser,
//     });
//   } catch (error) {
//     next(error);
//   }
// };



// const login = async (req, res, next) => {




//     try {
//         const { email, password } = req.body;

//         if (!email || !password) {
//             const error = createHttpError(400, "All fields are required!");
//             return next(error);
//         }
//         const isUserPresent = await User.findOne({ email });

//         if (!isUserPresent) {
//             const error = createHttpError(401, "Invalid Credentials");
//             return next(error);
//         }

//         const isMatch = await bcrypt.compare(password, isUserPresent.password);
//         if (!isMatch) {
//             const error = createHttpError(401, "Invalid Password");
//             return next(error);
//         }
//         const accessToken = jwt.sign({ _id: isUserPresent }, process.env.JWT_SECRET, {
//             expiresIn: '1d'
//         });




//         // console.log("User Found:", isUserPresent);
//         // console.log("Access Token Secret:", process.env.JWT_SECRET);

//         // console.log("Generated Token:", accessToken);

//         // res.cookie('accessToken', accessToken, {
//         //     maxAge: 1000 * 60 * 60 * 24 * 30,
//         //     //httpOnly: true,
//         //     sameSite: 'none',
//         //     secure: true
//         // })

//         // changes for render auto login
//         res.cookie('accessToken', accessToken, {
//             maxAge: 1000 * 60 * 60 * 24, // 1 day — adjust as per need
//             httpOnly: true, // Prevent JavaScript access to cookie
//             sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // None for Render, Lax for localhost
//             secure: process.env.NODE_ENV === 'production', // Secure true on production (HTTPS)
//         });


//         res.status(200).json({
//             success: true,
//             message: "User logged in successfully!",
//             token: accessToken,   
//             data: isUserPresent
//         });
//     } catch (error) {
//         next(error);

//     }
// }

// const getUserData = async (req, res, next) => {

//     try {

//         const user = await User.findById(req.user._id);
//         res.status(200).json({ sucess: true, data: user });
//     } catch (error) {
//         next(error);

//     }

// }


// const logout = async(req, res, next) => {

//     try {

//         // res.clearCookie('accessToken');
//         // res.status(200).json({success: true, message:" User logout sucessfully"})

//         // for auto login render

//         res.clearCookie('accessToken', {
//             httpOnly: true,
//             sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // Same as when setting
//             secure: process.env.NODE_ENV === 'production', // Same as when setting
//         });
//         res.status(200).json({ success: true, message: "User logged out successfully" });


//     } catch (error) {
//         next(error);

//     }


// }

// const verifyAdminPasswordController = async (req, res, next) => {
//   try {
//     const { password } = req.body;

//     // 1. Check for password presence
//     if (!password) {
//       return next(createHttpError(400, "Admin password required."));
//     }

//     // 2. Find an Admin user
//     // NOTE: This assumes there is an 'admin' role user to check against
//     const adminUser = await User.findOne({ role: { $regex: /^admin$/i } });

//     if (!adminUser) {
//       return next(createHttpError(404, "Admin account not found."));
//     }

//     // 3. Compare password securely
//     const isValidPassword = await bcrypt.compare(password, adminUser.password);

//     if (!isValidPassword) {
//       // Return 401 Unauthorized for security
//       return next(createHttpError(401, "Invalid admin password."));
//     }

//     // 4. Success: Password is valid
//     return res.status(200).json({
//       success: true,
//       message: "Password verified.",
//       // You might optionally return a temporary token here if needed
//     });
//   } catch (error) {
//     console.log("❌ ERROR in verifyAdminPasswordController:", error);
//     next(error);
//   }
// };
// module.exports = { register, login, getUserData, logout, verifyAdminPasswordController } 


const createHttpError = require("http-errors");
const User = require('../models/userModel');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Ensure JWT_SECRET is loaded from .env
require("dotenv").config();
// Ensure your .env has a JWT_SECRET defined.
const accessTokenSecret = process.env.JWT_SECRET;


const register = async (req, res, next) => {
    try {
        const { name, phone, email, password } = req.body;

        if (!name || !phone || !email || !password) {
            return next(createHttpError(400, "All fields are required"));
        }

        // We need to SELECT the password field explicitly for this check 
        // if your schema has `select: false` set (which it should).
        const isUserPresent = await User.findOne({ email }).select('+password');
        if (isUserPresent) {
            return next(createHttpError(400, "User already exists!"));
        }

        // Force role to always be "Cashier" for security
        const user = { name, phone, email, password, role: "Cashier" };
        const newUser = new User(user);
        await newUser.save();

        // Security Fix: Do not send the raw Mongoose object, which might contain the password hash.
        // We use .toObject() and delete sensitive fields before the response.
        const responseData = newUser.toObject();
        delete responseData.password;

        res.status(201).json({
            success: true,
            message: "New user created successfully (default role: Cashier)",
            data: responseData, // SEND CLEAN DATA
        });
    } catch (error) {
        next(error);
    }
};


const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(createHttpError(400, "All fields are required!"));
        }

        // 🛑 SECURITY FIX 1: Explicitly SELECT the password hash ONLY for comparison.
        // This is crucial if you set `select: false` in your Mongoose schema.
        const isUserPresent = await User.findOne({ email }).select('+password');

        if (!isUserPresent) {
            return next(createHttpError(401, "Invalid Credentials"));
        }

        const isMatch = await bcrypt.compare(password, isUserPresent.password);
        if (!isMatch) {
            return next(createHttpError(401, "Invalid Password"));
        }

        // 🛑 SECURITY FIX 2: JWT payload must only contain non-sensitive identifiers.
        // DO NOT include the full user object or the password hash.
        const accessToken = jwt.sign(
            { _id: isUserPresent._id, role: isUserPresent.role }, // ONLY ID AND ROLE
            accessTokenSecret,
            { expiresIn: '1d' }
        );

        // Security Fix 3: Ensure HttpOnly and Secure flags are set correctly on the cookie.
        res.cookie('accessToken', accessToken, {
            maxAge: 1000 * 60 * 60 * 24, // 1 day
            httpOnly: true, // Prevents client-side JS access (XSS defense)
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', 
            secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
        });
        // change this for iphone login issue
        // res.cookie('accessToken', accessToken, {
        //     httpOnly: true,
        //     secure: true, // must be HTTPS
        //     sameSite: 'None', // allow cross-site
        //     domain: '.onrender.com', // allow subdomain sharing
        //     path: '/', // required
        //     maxAge: 1000 * 60 * 60 * 24, // 1 day
        // });


        // 🛑 SECURITY FIX 4: Filter sensitive data (password hash) before sending response.
        const responseData = isUserPresent.toObject(); // Convert Mongoose document to plain object
        delete responseData.password; // Remove the hash from the response

        res.status(200).json({
            success: true,
            message: "User logged in successfully!",
            // Security Fix: DO NOT send the token back in the body unless strictly necessary.
            // It's already in the secure HttpOnly cookie.
            // If the frontend needs it for non-cookie auth headers, it can be kept, but remove it if possible.
            // Keeping it here for now, but best practice is to remove it if HttpOnly is used.
            token: accessToken,
            data: responseData // SEND CLEAN DATA
        });
    } catch (error) {
        next(error);
    }
}

const getUserData = async (req, res, next) => {
    try {
        // 🛑 SECURITY FIX 5: Ensure the findById query DOES NOT retrieve the password.
        // By default, Mongoose will exclude fields with `select: false`.
        // If your middleware attaches req.user._id, this is how you find the data.
        const user = await User.findById(req.user._id);

        // Security Fix: Although the query shouldn't return it, filter it again to be safe.
        if (user && user.password) {
            const responseData = user.toObject();
            delete responseData.password;
            return res.status(200).json({ sucess: true, data: responseData });
        }

        res.status(200).json({ sucess: true, data: user });

    } catch (error) {
        next(error);
    }
}


const logout = async (req, res, next) => {
    try {
        res.clearCookie('accessToken', {
            httpOnly: true,
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
            secure: process.env.NODE_ENV === 'production',
        });
        // change this for iphone login issue 
        // res.clearCookie("accessToken", {
        //     httpOnly: true,
        //     secure: true,
        //     sameSite: "None",
        //     domain: ".onrender.com",
        // });

        res.status(200).json({ success: true, message: "User logged out successfully" });
    } catch (error) {
        next(error);
    }
}

// ... verifyAdminPasswordController remains largely the same, but ensure User.findOne 
// selects the password explicitly if needed for the bcrypt comparison.
const verifyAdminPasswordController = async (req, res, next) => {
    try {
        const { password } = req.body;

        if (!password) {
            return next(createHttpError(400, "Admin password required."));
        }

        // 🛑 FIX: Select password explicitly for comparison
        const adminUser = await User.findOne({ role: { $regex: /^admin$/i } }).select('+password');

        if (!adminUser) {
            return next(createHttpError(404, "Admin account not found."));
        }

        const isValidPassword = await bcrypt.compare(password, adminUser.password);

        if (!isValidPassword) {
            return next(createHttpError(401, "Invalid admin password."));
        }

        return res.status(200).json({
            success: true,
            message: "Password verified.",
        });
    } catch (error) {
        console.log("❌ ERROR in verifyAdminPasswordController:", error);
        next(error);
    }
};

module.exports = { register, login, getUserData, logout, verifyAdminPasswordController }
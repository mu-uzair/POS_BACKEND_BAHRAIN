// const createHttpError = require("http-errors");
// require('dotenv').config();
// const User = require('../models/userModel');
// const  config  = require("dotenv");
// const { accessTokenSecret } = require("../config/config");
// const jwt = require("jsonwebtoken");




// // const isVerifiedUser = async (req, res, next)=>{

// //     try {
        
// //         const {accessToken} =  req.cookies;

// //         // console.log(req.cookies);
// //         if(!accessToken){
// //         const error = createHttpError(401, "Please provide token!");
// //        return next(error);
// //          }
// //         console.log("Access Token:", accessToken);
// //          console.log("Access Token Secret:", accessTokenSecret);
// //         console.log("process.env.JWT_SECRET", process.env.JWT_SECRET);
        

// //          const decodeToken = jwt.verify(accessToken, accessTokenSecret);
        

// //          console.log("decode tokenn" +decodeToken)

// //         const user= await User.findById(decodeToken._id);
// //         // const user= await User.findById('67b266b2629098b91027bb63');
// //         if(!user){
// //             const error = createHttpError(401, "User not exist!");
// //             return next(error)

// //         }

// //         req.user = user;
// //         next();
// //     } catch (error) {
// //         console.log(error);
// //         const err = createHttpError(401,"Invalid Token!");
// //         next(err);
// //     }
// // }

// const isVerifiedUser = async (req, res, next)=>{

//     try {
        
//         const {accessToken} = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOnsiX2lkIjoiNjdiMjY2YjI2MjkwOThiOTEwMjdiYjYzIiwibmFtZSI6InV6YWlyIiwiZW1haWwiOiJtdWhhbW1hZHV1emFpcjIyQGdtYWlsLmNvbSIsInBob25lIjozMzYyODk1MTQzLCJwYXNzd29yZCI6IiQyYiQxMCQ2U2tDTjJYeGt1OUFWeGljSGE4QW1lS3VieHhtUlNhZWJNSGNWbEx4cmRDVTkxMDVGWEdFSyIsInJvbGUiOiJhZG1pbiIsImNyZWF0ZWRBdCI6IjIwMjUtMDItMTZUMjI6Mjk6MDYuOTIwWiIsInVwZGF0ZWRBdCI6IjIwMjUtMDItMTZUMjI6Mjk6MDYuOTIwWiIsIl9fdiI6MH0sImlhdCI6MTc0MTE3OTY1MywiZXhwIjoxNzQxMjY2MDUzfQ.38tAZ97_rYzP4UrPEhrLioN-15c7RcgrNePppM9ISz8';// req.cookies;

//         // console.log(req.cookies);
//         // if(!accessToken){
//         //     const error = createHttpError(401, "Please provide token!");
//         //     return next(error);
//         // }
//         // console.log("Access Token:", accessToken);
//         // console.log("Access Token Secret:", accessTokenSecret);
//         // console.log("process.env.JWT_SECRET", process.env.JWT_SECRET);
        

//         // const decodeToken = jwt.verify(accessToken, accessTokenSecret);
        

//         // console.log("decode tokenn" +decodeToken)

//         // const user= await User.findById(decodeToken._id);
//         const user= await User.findById('67b266b2629098b91027bb63');
//         if(!user){
//             const error = createHttpError(401, "User not exist!");
//             return next(error)

//         }

//         req.user = user;
//         next();
//     } catch (error) {
//         console.log(error);
//         const err = createHttpError(401,"Invalid Token!");
//         next(err);
//     }
// }


// module.exports = { isVerifiedUser };


const createHttpError = require("http-errors");
require('dotenv').config();
const User = require('../models/userModel');
const  config  = require("dotenv");
const { accessTokenSecret } = require("../config/config");
const jwt = require("jsonwebtoken");




const isVerifiedUser = async (req, res, next)=>{

    try {
        
        const {accessToken} = req.cookies;

        if(!accessToken){
            const error = createHttpError(401, "Please provide token!");
            return next(error);
        }
        // console.log("Access Token:", accessToken);
        // console.log("Access Token Secret:", accessTokenSecret);
        // console.log("process.env.JWT_SECRET", process.env.JWT_SECRET);
        

        const decodeToken = jwt.verify(accessToken, accessTokenSecret);

        // console.log("decode tokenn" +decodeToken)

        const user= await User.findById(decodeToken._id);
        if(!user){
            const error = createHttpError(401, "User not exist!");
            return next(error)

        }

        req.user = user;
        next();
    } catch (error) {
        console.log(error);
        const err = createHttpError(401,"Invalid Token!");
        next(err);
    }
}

module.exports = { isVerifiedUser };



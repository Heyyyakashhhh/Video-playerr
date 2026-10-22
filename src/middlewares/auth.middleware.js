import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/apiError.js"
import jwt from "jsonwebtoken"
import { get } from "mongoose";

export const verfiyJwt = asyncHandler (async(req,res,next)=>{
    try{
        const getToken = req.cookies.accessToken
        

        if(!getToken ) throw new ApiError(401 , "unauthorized access - Please login first");

        const decodedToken = jwt.verify(getToken , process.env.ACCESS_TOKEN_SECRET);
       
        

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
       
        if(!user) throw new ApiError(401 , "unauthorized access - user not found ");
        req.user = user;
        next();
    }
    catch(error){
        throw new ApiError(500, error?.message || "something went wrong while verifying token");
    }
})


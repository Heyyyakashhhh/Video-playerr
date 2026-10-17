import { asyncHandler } from "../utils/asyncHandler";
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/apiError.js"
import {jwt} from "jsonwebtoken"

export const verfiyJwt = asyncHandler (async(req,res,next)=>{
    try{
        const getToken = req.cookies?.accessToken || req.header?.("Authorization")?.replace("Bearer " , "");

        if(!getToken ) throw new ApiError(401 , "unauthorized access - token not found");

        const decodedToken = await jwt.verfiy(getToken , process.env.ACCESS_TOKEN_SECRET);

        

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
        if(!user) throw new ApiError(401 , "unauthorized access - user not found");
        res.user = user;
        next();
    }
    catch(error){
        throw new ApiError(500, error?.message || "something went wrong while verifying token");
    }
})


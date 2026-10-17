import {asyncHander} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/apiError.js'
import {User} from '../models/user.model.js'
import {uploadToCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/apiResponse.js'

const userController  = asyncHander(async(req,res)=>{

    //get details from fronend
    //validation cheak - not empty or invalid data
    //cheak user - alrdy exist or not by email OR username
    // cheak - image and avtaar uploaded or not at cloudinary
    // create user obj - create entry on db
    //remove password and refresh token from response
    // cheka user creation success or not and send response to frontend

    const {username, email, fullname, password} = req.body;
    
    if([username,email,fullname,password].some((fields)=> fields?.trim() === "")){
        throw new ApiError(400 , "All fields are required")
    }

    const userExist = await User.findOne({
        $or :[{email},{username}]
    })

    if(userExist){
        throw new ApiError (409,"user already exist with this email or username")
    }
    

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
  
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if(!avatarLocalPath) throw new
     ApiError(400,"avtar image is required");

    const avtarOnCloudinary = await uploadToCloudinary(avatarLocalPath);
    const coverImageOnCloudinary = await uploadToCloudinary(coverImageLocalPath);

    if(!avtarOnCloudinary) throw new ApiError(500,"Failed to upload avtar image to cloudinary");
    if(!coverImageOnCloudinary) throw new ApiError(500,"Failed to upload cover image to cloudinary");

    const user  = await User.create({
 
        fullname,email,avatar : avtarOnCloudinary.url , coverImage : coverImageOnCloudinary.url || "",
        password , username : username.toLowerCase()

    })

    const userCreated = await User.findOne({_id : user._id}).select("-password -refreshToken ") //remove password and refresh token from response


    if(!userCreated) throw new ApiError(500,"something went wrong while registering user");


    //return response to frontend

    return res.status(201).json(
        new ApiResponse(201 , userCreated , "User registered successfully")
    )
})

export {userController as registerUser}
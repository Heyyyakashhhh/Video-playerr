import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/apiError.js'
import {User} from '../models/user.model.js'
import {uploadToCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/apiResponse.js'
import cookie from 'cookie-parser'



const genrateRefreshAndAccessToken = async (userId)=>{
    try{

        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken  = user.generateRefreshToken()

        user.refreshToken = refreshToken;

        await user.save({validBeforeSave : false})
        return {accessToken , refreshToken}


    }catch(err){
        throw new ApiError(500 , "something went wrong while generating access and refresh token")
    }
}

const registerUser  = asyncHandler(async(req,res)=>{

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


const loginUser = asyncHandler(async(req,res)=>{{

    //get dta = req.body
    //validation cheak fild are not empty
    //cheak user exist or not by email or username
    //cheak password is correct or not
    //generate access token and refresh token
    //send cookie
    //save refresh token in db
    //return response to frontend


    const {email,username,password} = req.body;
    
   
    if([username,email,password].some((fields)=> fields?.trim()==="")) throw new ApiError(400 , "all filds are required");

    const userCheak = await User.findOne({$or : [{email},{username}]});
    
    if(!userCheak) throw new ApiError(404 , "user not found with this email or username");

    const isPasswordValid = await userCheak.isPasswordCorrect(password)

    if(!isPasswordValid) throw new ApiError(401 , "incorrect details");


    const {accessToken, refreshToken} = await genrateRefreshAndAccessToken(userCheak._id)
    const userLoggedIn = await User.findById(userCheak._id).select("-password  -refreshToken")

    const options ={
        htppOnly : true,
        secure : true
    }


    return res.status(200).cookie("accessToken" , accessToken , options).cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(200 , {user : userLoggedIn , accessToken , refreshToken} , "User logged in successfully"))


   
}})


const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(req.user_.id ,{
        $set :{refreshToken : undefined

        }
    }, {
            new : true
        })

       const options ={
        htppOnly : true,
        secure : true
    }

    return res.status(200).clearCookie("accessToken" , options).clearCookie("accessToken",accessToken).json(
        new ApiResponse(200 , {} , "User logged out successfully...")
    )

})

export {  registerUser,loginUser}
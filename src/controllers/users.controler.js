import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/apiError.js'
import {User} from '../models/user.model.js'
import {uploadToCloudinary , deleteFromCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/apiResponse.js'
import jwt from "jsonwebtoken"
import { sendEmail, emailVerficationMailgenContent } from "../utils/mail.js";




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
    const verificationUrl = `http://localhost:8000/api/v1/users/verify-email/${user._id}`;

await sendEmail({
    email: user.email,
    subject: "Please verify your email address",
    mailgenContent: emailVerficationMailgenContent(user.username, verificationUrl)
});

    const userCreated = await User.findOne({_id : user._id}).select("-password -refreshToken ") //remove password and refresh token from response


    if(!userCreated) throw new ApiError(500,"something went wrong while registering user");


    //return response to frontend

    return res.status(201).json(
        new ApiResponse(201 , userCreated , "Account created successfully. A verification link has been sent to your email. Please verify to log in")
    )
})
const verifyUserEmail = asyncHandler(async (req, res) => {
    // 1. URL ke parameter se ID nikalo
    const { userId } = req.params;

    if (!userId) {
        throw new ApiError(400, "Invalid or missing user ID");
    }

    // 2. Database mein user dhoondo aur uska status update karo
    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found or link expired");
    }

    // Agar user model mein isEmailVerified field hai toh use true kar do
    user.isEmailVerified = true;
    await user.save({ validateBeforeSave: false });

    // 3. Browser ko response bhejo
    return res.status(200).json(
        new ApiResponse(200, {}, "Email verified successfully! You can now login.")
    );
});



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

    if(!userCheak.isEmailVerified) throw new ApiError(404 , "Email is not verifed please verify first before login")

    const isPasswordValid = await userCheak.isPasswordCorrect(password)

    if(!isPasswordValid) throw new ApiError(401 , "incorrect details");


    const {accessToken, refreshToken} = await genrateRefreshAndAccessToken(userCheak._id)

    
    const userLoggedIn = await User.findById(userCheak._id).select("-password  -refreshToken")

    const options ={
        htppOnly : true,
        secure : true
    }


    return res.status(200).cookie("accessToken" , accessToken , options).cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(200 , {user : userLoggedIn.fullname } , "you logged in successfully"))


   
}})

const refreshAccsessToken = asyncHandler(async(req,res)=>{
     const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    try{
       
    if(!incomingRefreshToken) throw new ApiError(401,"Unauthorized request" )

        const decodedToken = jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken._id);

        if(!user) throw new ApiError(401,"invalid refresh token" );

        if(incomingRefreshToken !== user.refreshToken) throw new ApiError(401, "Refresh token is expired or used");

        const options = {
            http : true ,
            secure : true
        }

        const {accessToken , newRefreshToken} = await genrateRefreshAndAccessToken(user._id)

        res.status(200).cookie("accessToken" , accessToken , options).cookie
        ("refreshToken" , newRefreshToken , options).json(
            new ApiResponse(200,{
                accessToken , refreshToken : newRefreshToken
            } , "Access Token Refreshed")
        )
      
       
    
    }catch(error) {
throw new ApiError(500 , error?.messge || "invalid refresh token")
}
})

const logoutUser = asyncHandler(async(req,res)=>{
    

    const userLog = await User.findByIdAndUpdate(req.user._id ,{
        $set :{refreshToken : null

        }
    }, {
            new : true
        })

        
       const options ={
        htppOnly : true,
        secure : true
    }

    return res.status(200).clearCookie("accessToken" , req.user.accessToken).clearCookie("refreshToken",req.user.refreshToken).json(
        new ApiResponse(200 , {} , `${userLog.username} your successfully logged out...😊`) 
    )

})


const changeCurrentPassword = asyncHandler(async(req,res)=>{

    const {oldPassword , newPasword , confrimPassword} = req.body
    if(newPasword !==confrimPassword) throw new ApiError(401 , "Confrim password not matched")

   
     const user = await User.findById(req.user._id);

    if(!user) throw new ApiError(404 , "User not found");

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect) throw new ApiError(400, "Invalid old password")
    
        user.password = newPasword;
        await user.save({validateBeforeSave: false})
        return res.status(200).json(new ApiResponse(200 , {username : user.username} , `your password changed successfully..`))
   }
)

const getCurrentUser = asyncHandler(async(req,res)=>{
   try{
     return res.status(200).json(200 , {user : req.user} ,"Crrent user fatched successfully")
   }catch(error) {throw new ApiError(500, "Somthing went wrong while fetching current user details")}
})

const updateOtherDetails = asyncHandler(async(req,res)=>{
    const {fullname , email } = req.body

    if(fullname==="" || email==="") throw new ApiError(400 , "All fields are required");

    const updatedUserDetails = await User.findByIdAndUpdate(req.user?._id , {
        $set :{
            fullname,
            email : email
        }
    }  ,{new:true}).select("-password")

    if(!updatedUserDetails) throw  new ApiError(400 , "user not found")

    return res.status(200).json(new ApiResponse(200 , {fullname : fullname , email : email} , "Account details  updated successfully"))
})

const updateUserAvtarImg  =asyncHandler(async(req,res)=>{
    const avtarLocalPath =req.file?.path
   
    if (!avtarLocalPath) throw new ApiError(400, "Avtar image not found in local DB");
    
    const avatar = await uploadToCloudinary(avtarLocalPath);

    const oldUser  = await User.findById(req.user?._id);
    const oldAvtarUrl = oldUser.avatar
    if(!oldAvtarUrl) throw new ApiError(404 , "Old Avtar image not found")

    if(!avatar.url) throw new ApiError(400 , "Error while uploading on avatar image");
    const user = await User.findByIdAndUpdate(req.user?._id , {
        $set :{
            avatar : avatar.url
        }
    } , {new:true}).select("-password")

    if(oldAvtarUrl) deleteFromCloudinary(oldAvtarUrl)

    return res.status(200 ).json(new ApiResponse(200 , user , "Avatar image updated successfully.."))
})

const updateUserCoverImg  =asyncHandler(async(req,res)=>{
    const coverLocalPath =req.file?.path
    if (!coverLocalPath) throw new ApiError(400, "Cover image not found in local DB");
    
    const coverImg = await uploadToCloudinary(coverLocalPath);
    if(!coverImg.url) throw new ApiError(400 , "Error while uploading on cover image");
    const user = await User.findByIdAndUpdate(req.user?._id , {
        $set :{
            coverImage : coverImg.url
        }
    } , {new:true}).select("-password")
    return res.status(200 ).json(new ApiResponse(200 , req.user , "Cover image updated successfully.."))
}) 


const getChannelProfile = asyncHandler(async(req,res)=>{

    const {username} = req.params;

    if(!username?.trim()) throw new ApiError(400 , "username not found");

    const channel = await User.aggregate([
        {
            $match : {
                username : username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from : "subscriptions" ,
                localField : "_id",
                foreignField : "channel",
                as :"subscribers"
            }

        },
        {
             $lookup:{
                from : "subscriptions" ,
                localField : "_id",
                foreignField : "subscriber",
                as :"subscribedTo"
            }
        },{
            $addFields:{
                subscriberCount :{
                    $size : "$subscribers"
                },
                 channelSubscribedToCount :{
                    $size : "$subscribedTo"
                },
                isSubscirbed:{
                    $cond:{
                        if :{$in:[req.user?._id , "$subscribers.subscriber"] },
                        then :true,
                        else : false
                    }
                }
            }
        }
         ,{
            $project :{
                fullname:1,
                username:1,
                subscriberCount:1,
                channelSubscribedToCount:1,
                isSubscirbed:1,
                avatar:1,
                coverImage:1



            }
         }


    ])

    if(!channel?.length) throw new ApiError(404 , "Channe dose not exist");

    return res.status(200).json(new ApiResponse(200  , channel[0] , "user fetched successfully... "))

})

const getWatchHistory = asyncHandler(async(req,res)=>{
   const user = await User.aggregate([
    {
        $match:{
            _id: new mongoose.Types.ObjectId(req.user._id) //coz req.user._id give "string" data only 
        } ,
        $lookup:{
            from : "Videos",
            localField:"watchHistory",
            foreignField : "_id",
            as : "watchHistory" ,
            pipeline:[
                {
                    $lookup :{
                        from :"users",
                        localField : "owner",
                        foreignField:"_id",
                        as:"owner" ,
                        pipeline:[
                            {
                                $project:{
                                    fullname :1,
                                    username:1,
                                    avatar:1
                                }
                            }
                        ]
                    }
                },{
                    $addFields:{
                        owner:{
                            $first : "$owner"
                        }
                    }
                }
            ]
        }
    }
   ])

if(!user?.length) throw new ApiError(400 , "User dose not exist")

    return res.status(200).json(
        new ApiResponse(200,user[0].watchHistory , "Watch history fetch successfully..")
    )
})
export {  registerUser,loginUser , logoutUser,refreshAccsessToken,changeCurrentPassword , getCurrentUser,updateOtherDetails,updateUserAvtarImg , updateUserCoverImg,verifyUserEmail,getChannelProfile,getWatchHistory}
import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.mode.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Mongoose } from "mongoose";


const addTweet  = asyncHandler(async(req,res)=>{
    const {content} = req.body
    if(content?.trim()==="") throw new ApiError(400 , "Tweet cant be empty" )

    

        const tweet = await Tweet.create({
            owner : req.user._id,
            content
        })

        if(!tweet) throw new ApiError(500 , "Your tweet not added")

            return res.status(201).json(new ApiResponse(201 , tweet , "Tweet Added !! "))


        



})

const updatedTweet = asyncHandler(async(req,res)=>{
    const {tweetId} = req.params
    const {content} = req.body
    if(!isValidObjectId(tweetId)) throw new ApiError(400 , "Invalid Tweet ID" )

    if(content?.trim()==="") throw new ApiError(400 , "Tweet cant be empty" )

   const tweetExist = await Tweet.findById(tweetId)
   if(!tweetExist) throw new ApiError(400 , "Tweet not found please add a tweet")

    const updateTweet = await Tweet.findByIdAndUpdate(tweetId ,{
        $set :{
            owner : req.user._id,
            content
        }
    },{
        new : true
    }).select('-_id').select('-createdAt').select('-updatedAt')
    
    if(!updateTweet) throw new ApiError(500 , "Tweet not update failed")
    
    return res.status(201).json(new ApiResponse(201 , updateTweet , "Tweet Updated !!!"))

})


const deleteTweet = asyncHandler(async(req,res)=>{
    const {tweetId} = req.params
    if(!isValidObjectId) throw new ApiError(400 , "Invalid Tweet id");

    const tweetExist = await Tweet.findById(tweetId)
   if(!tweetExist) throw new ApiError(400 , "Tweet not found please add a tweet")

    await Tweet.findByIdAndDelete(tweetId)

    return res.status(201).json(new ApiResponse(201 , {}, "Tweet Deleted !!"))
})


const getAllUserTweet = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    console.log(userId)
    
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid User ID");
    }

    const userExist = await Tweet.findOne({owner :userId})
  if(!userExist) throw new ApiError(400 , "User not found")

    const tweets = await Tweet.aggregate([
        {
            // 1. Kis field se match karna hai: owner
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            // 2. pipeline ko lookup object ke andar rakha
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "OwnerDetails",
                pipeline: [

                    {
                        $project: {
                            _id: 1,
                            fullname: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ] , 
              
            }
        },
        {
            // 3. Array ko single object banaya
            $addFields: {
                owner: { $first: "$OwnerDetails" }
            }
        },
        {
            // 4. Latest tweet sabse upar
            $sort: {
                createdAt: -1
            }
        },
        {
            // 5. Clean final response
            $project: {
                _id: 1, // Tweet ki _id rakhna frontend ke liye zaroori hota hai
                content: 1,
                owner: 1,
                createdAt: 1
            }
        }
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, tweets, "All Tweets Fetched Successfully"));
});
export {addTweet , updatedTweet , deleteTweet , getAllUserTweet}
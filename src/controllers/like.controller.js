import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/apiError.js'

import {ApiResponse} from '../utils/apiResponse.js'
import mongoose, { isValidObjectId } from "mongoose"

import { Like } from '../models/like.model.js'


const toggleLike = asyncHandler(async(req,res)=>{
    //get video id and cheak validtion 
    //cheak video like or not 
    //if like then change into unlike with user 
    //if not like then create first like 
    //return response

    const {videoId} = req.params
    
    if(!isValidObjectId(videoId)) throw new ApiError(400 , "Invalid video ID");

    const isLiked = await Like.findOne({
        video : videoId,
        likedBy : req.user._id
    });


     //unnlike
    if(isLiked){
        await Like.findByIdAndDelete(isLiked._id)

        return res.status(200).json(new ApiResponse(200 , {isLiked :false} , "Video Unlike Successfully"))
    }

    const newLike = await Like.create({
        video : videoId,
        likedBy : req.user._id
    });

    const populatedLike = await Like.findById(newLike._id).populate({
        path :"video",
        select : "videoFile title owner",
        populate:{
            path : "owner"
        }
        
    })

    const responseData = {
        isLiked: true,
        likeId: populatedLike._id,
        videoLink: populatedLike.video?.videoFile,
        videoTitle: populatedLike.video?.title,
        ownerName: populatedLike.video?.owner?.fullname,}

    return res.status(200).json(new ApiResponse(200 , responseData, "Video Liked successfully"))
    
})

const toggleCommentLike = asyncHandler(async(req,res)=>{
   
    const {commentId} = req.params
    
    if(!isValidObjectId(commentId)) throw new ApiError(400 , "Invalid video ID");

    const isCommentLike = await Like.findOne({
        comment : commentId,
        likedBy : req.user._id
    });


     //unnlike
    if(isCommentLike){
        await Like.findByIdAndDelete(isCommentLike._id)

        return res.status(200).json(new ApiResponse(200 , {isCommentLike :false} , "Comment unlike Successfully"))
    }

    const newCommentLike = await Like.create({
        comment : commentId,
        likedBy : req.user._id
    });

    const populatedLike = await Like.findById(newCommentLike._id).populate({
        path :"video",
        select : "videoFile title owner",
        populate:{
            path : "owner"
        }
        
    })

    const responseData = {
        isCommentLike: true,
        commentId: populatedLike._id,
        videoLink: populatedLike.video?.videoFile,
        videoTitle: populatedLike.video?.title,
        ownerName: populatedLike.video?.owner?.fullname,}

    return res.status(200).json(new ApiResponse(200 , responseData, "Comment Like Successfully"))
    
})


const toggleTweetLike = asyncHandler(async(req,res)=>{
   
    const {tweetId} = req.params
    
    if(!isValidObjectId(tweetId)) throw new ApiError(400 , "Invalid video ID");

    const isTweetLike = await Like.findOne({
        tweet : tweetId,
        likedBy : req.user._id
    });


     //unnlike
    if(isTweetLike){
        await Like.findByIdAndDelete(isTweetLike._id)

        return res.status(200).json(new ApiResponse(200 , {isTweetLike :false} , "Tweet unlike Successfully"))
    }

    const newTweetLike = await Like.create({
        tweet : tweetId,
        likedBy : req.user._id
    });

    const populatedLike = await Like.findById(newTweetLike._id).populate({
        path :"video",
        select : "videoFile title owner",
        populate:{
            path : "owner"
        }
        
    })

    const responseData = {
        isTweetLike: true,
        tweetId: populatedLike._id,
        videoLink: populatedLike.video?.videoFile,
        videoTitle: populatedLike.video?.title,
        ownerName: populatedLike.video?.owner?.fullname,}

    return res.status(200).json(new ApiResponse(200 , responseData, "Tweet Like Successfully"))
    
})

const getLikedVideos = asyncHandler(async(req,res)=>{

    const likedVideos  = await Like.aggregate([
        {
            $match : {
                likedBy : new mongoose.Types.ObjectId(req.user._id),
                video :{$exists : true}


            }
        },

        {
            $lookup :{
                from : "videos",
                localField : "video",
                foreignField : "_id",
                as : "videosDetails",
                pipeline :[
                    {
                        $lookup :{
                            from : "users",
                            localField : "owner",
                            foreignField :"_id",
                            as : "OwnerDetails",
                            pipeline:[
                                {
                                    $project :{
                                        _id : 0,
                                        fullname : 1,
                                        username : 1 , 
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields :{ OwnerDetails :{  $first : "$OwnerDetails"}}
                    }
                ]
            }
        },{
            $addFields :{videoDetails :{$first : "$videosDetails"}}
        } , {
            $project :{
                _id : 0 , 
                "videoDetails.title" : 1 , 
                "videoDetails.discription" :1,
                "videoDetails.videoFile" : 1,
                "videoDetails.OwnerDetails" : 1,
                

                
            }
        }
    ]) 

    if(!likedVideos) throw new ApiError(500 , "Liked Aggregate Function failed")

    return res.status(200).json(new ApiResponse(200 ,  likedVideos , "All Liked Videos Fetched Successfully"))

})

export {toggleLike , toggleCommentLike , toggleTweetLike,getLikedVideos}

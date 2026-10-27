import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async(req,res)=>{
    const userId = req.user._id

    //subscriber counts
    const totalSubscribersPromise = await Subscription.countDocuments({channel : userId })


    //total videos and like count 
    const videoStatsPromise = await Video.aggregate([
        {
            $match : { owner : new mongoose.Types.ObjectId(userId)}
        },
        {
           $group: {
                _id: null,
                totalVideos: { $sum: 1 },
                totalViews: { $sum: "$views" }
            }
        }
    ])


    //channel k videos k total likes
    const totalLikesPromise= await Like.aggregate([
      
        {
            $lookup :
            {
                from : "videos",
                localField : "video",
                foreignField : "_id",
                as : "videosDetails"
            }
        },
        {
            //array to object
            $unwind : "$videosDetails"
        },
        {
            $match : 
            {
                "videosDetails.owner" : new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group :
            {
                _id : null ,
                totalLikes :{$sum : 1}
            }
        }
    ])

    console.log(totalLikesPromise)

    //all three query run parallal
    // Teeno queries ko parallelly run karo
    const [totalSubscribers, videoStats, likeStats] = await Promise.all([
        totalSubscribersPromise,
        videoStatsPromise,
        totalLikesPromise
    ]);

    const channelStats = {
        totalSubscribers: totalSubscribers || 0,
        totalVideos: videoStats[0]?.totalVideos || 0,
        totalViews: videoStats[0]?.totalViews || 0,
        totalLikes: likeStats[0]?.totalLikes || 0
    };
    console.log(channelStats)

    return res
        .status(200)
        .json(new ApiResponse(200, channelStats, "Channel stats fetched successfully"));
})

const getChannelVideos = asyncHandler(async(req,res)=>{
    const userId = req.user._id;

    const videos = await Video.aggregate([
        {
            $match : {owner : new mongoose.Types.ObjectId(userId)}
        },
        {
            $lookup :
            {
                from : "likes",
                localField : "_id",
                foreignField :"video",
                as :"likes"
            }
        },
        {
            $addFields :
            {
                likesCount :
                {
                    $size : "$likes"
                }
            }
        },
        {
            $sort : 
            {
                createdAt : -1
            }
        },
        {
            $project:
            {
                _id: 1,
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                createdAt: 1,
                likesCount: 1
            }
        }
    ])
    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Channel videos fetched successfully"))
})
export {getChannelStats , getChannelVideos}
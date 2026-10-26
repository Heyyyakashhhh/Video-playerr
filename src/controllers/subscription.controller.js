import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const toggleSubscription = asyncHandler(async(req,res)=>{
    const {channelId} = req.params
    if(!channelId) throw new ApiError(400  , "Invalid channel id");

    if(channelId.toString() === req.user._id.toString()) throw new ApiError(400, "You cannot subscribe to your own channel");

    const isSubscribed = await  Subscription.findOne({
        subscriber : req.user._id,
        channel : channelId
    })

    if(isSubscribed){
        await Subscription.findByIdAndDelete(isSubscribed._id)
        return res.status(200).json(new ApiResponse(200 , {Subsriber : false} , "Unsubscribed 🔕"))
    }


    await Subscription.create({
        subscriber : req.user._id,
        channel : channelId
    })
    return res.status(200).json(new ApiResponse(200 , {Subscribed : true} , "Subsribed 🔔"))
})

const getUserChannelSubscribers = asyncHandler(async(req,res)=>{
const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid Channel ID");
    }

    const subscribers = await Subscription.aggregate([
        {
            $match :{channel : new mongoose.Types.ObjectId(channelId)}
        },
        {
            $lookup : {
                from : "users",
                localField : "channel",
                foreignField :"_id",
                as :"SubscribersDetails" ,
                pipeline : [
                   {
                    $project :{fullname :1 , username:1 , avatar:1}
                   }
                ]
            }
        } , 
        {
            $addFields :{
                subscriber : {$first : "$SubscribersDetails"}
            }
        },

        {
            $project: {
                _id: 1,
                subscriber: 1,
                createdAt: 1
            }
        }
        
    ])


    return res.status(200).json(new ApiResponse(200 , subscribers?.length ==0 ? "No subscriber" :subscribers , "Channel Subscriber fetched successfully.."))
})



const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid Subscriber ID");
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            // Wo records jahan subscriber yeh user hai
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            // Channel (User) ki details lao
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelDetails",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            fullname: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                channel: { $first: "$channelDetails" }
            }
        },
        {
            $project: {
                _id: 1,
                channel: 1,
                createdAt: 1
            }
        }
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, subscribedChannels?.length ===0 ? "No Channel Subscribed" : subscribedChannels, "Subscribed channels fetched successfully"));
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
};
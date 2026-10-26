import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/apiError.js'
import {Video} from '../models/video.model.js'
import {User} from '../models/user.model.js'


import {uploadToCloudinary , deleteFromCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/apiResponse.js'

import mongoose, { isValidObjectId } from "mongoose"
import  pipeline  from 'nodemailer/lib/xoauth2/index.js'
import {aggregatePaginate}  from 'mongoose-aggregate-paginate-v2'

const getAllVideos= asyncHandler(async(req,res)=>{
     const {
        page =1,
        limit = 10,
        query,
        sortBy = "createdAt",
        sortType = "desc",
        userId
     } = req.query

     const pipeline =[];

     if(query?.trim){
        pipeline.push({
            $match :{
                $or : [
                    {title : {$regex : query.trim() , $options : 'i'}},
                    {dicription : {$regex : query.trim() , $options : 'i'}}
                ]
            }
        })
     }

     if(userId){
        if(!isValidObjectId(userId)) throw new ApiError(400 , "Invalid Video ID")
        pipeline.push({
            $match :{
                owner : new mongoose.Types.ObjectId(userId) // without mongoose type give string only and give error
            }
        })
     }

     pipeline.push({
        $match:{
            isPublished : true
        }
     })


     pipeline.push(
        {
            $lookup :
            {
                from : "users",  //change model name into prular User -> users
                localField : "owner",
                foreignField : "_id",
                as : "owner",
                pipeline :[
                    {
                        $project :{
                            _id : 0,
                            fullname :1,
                            username: 1,
                            avatar:1
                        }
                    }
                ]
            }
        } , 
        {
            $addFields :{
                owner :{
                    $first : "$owner"
                }
            }
        }
     )

     const sortDirection = sortType?.toLowerCase()==="asc"  ? 1 : -1;
     pipeline.push(
        {
            $sort :{
                [sortBy] : sortDirection
            }
        }
     )

     const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    // aggregatePaginate pipeline ko execute karega aur page info return karega
    const videos = await Video.aggregatePaginate(Video.aggregate(pipeline), options);

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully"));


})

const publishVideo = asyncHandler(async(req,res)=>{
    //get tile , dis from body 
    // cheal vedliation of title and dis not empty
    //get thumb and video and upload to clooudnary
    // cheak upload or not on cloudinary
    // create video model 
    // cheak model create or not
    // ccheka user creating succ or not and send to response 

    const {title , discription } = req.body

    if([title,discription].some((fields)=> fields?.trim()==="")) throw new ApiError(400 , "All fiels are required");
    
    const thumbnailPath = req.files?.thumbnail?.[0]?.path;
    const videoPath = req.files?.videoFile?.[0]?.path;

    if(!thumbnailPath || !videoPath) throw new ApiError(400 , "Video file or thumbnail are required")

    const thumbnailCloudinary = await uploadToCloudinary(thumbnailPath);
    const videoCloudinary = await uploadToCloudinary(videoPath);

    if(!thumbnailCloudinary) throw new ApiError(500 , "Failed to upload thumbnail on cloudinary");
    if(!videoCloudinary) throw new ApiError(500 , "Failed to upload video file on cloudinary");

    const video = await Video.create({title : title.trim() , discription:discription.trim() , videoFile : videoCloudinary.url , thumbnail : thumbnailCloudinary.url , duration : videoCloudinary.duration || 0 , owner : req.user._id , isPublished : true})
    
    if(!video) throw new ApiError(500 , "Video creation failed")

    return res.status(200).json( new ApiResponse(200 , video , "Video published successfully.." ))
})

const getVideoByid = asyncHandler(async(req,res)=>{
    const {videoId} = req.params;
    if(!isValidObjectId(video)) throw new ApiError(400 , "Video id not found");

    const video = await Video.findByIdAndUpdate(videoId, {
        $inc: { views: 1 }
    } ,{new :true}).populate("owner", "fullname username avatar");;
    
   throw new ApiError(404, "Video does not exist or is not published yet");
    if (req.user?._id) {
        await User.findByIdAndUpdate(
            req.user._id,
            {
                // $addToSet se duplicate entry nahi hoti
                $addToSet: {
                    watchHistory: videoId
                }
            }
        );
    }

   
    if(!video) throw new ApiError(404 , "Video not publish yet please publish your video first..")

        return res.status(200).json(new ApiResponse(200 , video , "Video get successfully "))
    

})


const updateVideo = asyncHandler(async (req, res) => {
    //get vdo id  from params
    // get title , diss fro body 
    //cheak validtion vdo id and title and dis 
    // find old vdo url and thumbnail url from Video model
    //cheal auth old vdo owner id == req.user._id
    //get path of new vide file and thumbnail and cheak validation
    // upload  both on cloudinary and cheak velidation
    // update new detials on video model and cheak velidation
    // delete olvdeo  detailas video file and thumbnail from local storage and also cheak validation
    // return response new update video details 

    const { videoId } = req.params;
    const { title, discription } = req.body;

    if(!isValidObjectId(videoId))  throw new ApiError(400 , "Invalid video ID")
    if([title , discription].some((fields)=>fields?.trim()==="")) throw new ApiError(400 , "All fields are required")
    
    const oldVideoDetails = await Video.findById(videoId);
    if(!oldVideoDetails)throw new ApiError(400 , "Video not found please publish first")

    const oldVideoUrl = oldVideoDetails.videoFile
     const oldThumbnailUrl = oldVideoDetails.thumbnail

     if(oldVideoUrl==="" || !oldThumbnailUrl==="") throw new ApiError(400 , "Video files path or thumbnail path not found")

    //  if(oldVideoDetails.owner._id!==req.user._id ) throw new ApiError(400 , "Your not auth user for update video deitails");

     const newVideoFilePath = req.files?.videoFile?.[0]?.path;
    const newThumbnailFilePath = req.files?.thumbnail?.[0]?.path;

    if(!newVideoFilePath) throw new ApiError(400 , "new video file path  not found")
    if(!newThumbnailFilePath) throw new ApiError(400 , "new thumbnail file path  not found")

    const videoFileonCloudinary = await uploadToCloudinary(newVideoFilePath)
    const thumbnailonCloudinary = await uploadToCloudinary(newThumbnailFilePath)


 if(!videoFileonCloudinary?.url) throw new ApiError(400 , "failed to upload new updated video on cloudniary ")
if(!thumbnailonCloudinary?.url) throw new ApiError(400 , "failed to upload new updated thumbnail on cloudinary")

    const video = await Video.findByIdAndUpdate(videoId , 
        {
            $set :{
                title : title.trim(),
                discription : discription.trim(),
                videoFile : videoFileonCloudinary.url,
                thumbnail : thumbnailonCloudinary.url,
                duration:  ((videoFileonCloudinary.duration).toFixed(2))
            }
        } , {new : true}
    ).select('-owner')

if(oldVideoUrl){ await deleteFromCloudinary
    (oldVideoUrl)
}
if(oldThumbnailUrl){
    await deleteFromCloudinary(oldThumbnailUrl)
}


return res.status(200).json(new ApiResponse(200 , video , "Video updated successfully..."))
    
});

const deleteVideo = asyncHandler(async(req,res)=>{
    //get vdo id from pramas
    //cheak validation of vdo id
    //find vdo obj from vdo id and cheak validation 
    //get vdo file path and thumbnail path from vdo obj
    // delete from cloudanriary both file 
    // delete from db 
    //return res to user 
    const {videoId} = req.params
    
    if(!videoId) throw new ApiError(400 , "Invalid video id");

    const video = await Video.findById(videoId);
  


    if(!video) throw new ApiError(400 , "Video not found please publish first");


    const videoFilePathForDlt  = video.videoFile
    const thumbnailPathForDlt  = video.thumbnail

    if(!videoFilePathForDlt || !thumbnailPathForDlt) throw new ApiError(400 , "Video or thumbnail path not found");

    if(videoFilePathForDlt) await deleteFromCloudinary(videoFilePathForDlt)
   if(thumbnailPathForDlt) await deleteFromCloudinary(thumbnailPathForDlt)

    await Video.findByIdAndDelete(videoId)

    return res.status(200).json(new ApiResponse(200 , {} , "Video deleted successfully.."))


})

const  togglePublishStatus = asyncHandler(async(req,res)=>{
    //get id from prams and cheak validtion 
    //get vdo obj from vdoId and cheak valiaton
    //toggled or change status of 'vdo publish"
    //save into db before validate save
    //return to res with unpublish statys

    const {videoId} = req.params
    if(!isValidObjectId(videoId)) throw new ApiError(400 , "Invalid video id")
    
    const video = await Video.findById(videoId)
    if(!video) throw new ApiError(400 , "Video not found please publish first")
    
        video.isPublished = !video.isPublished
        await video.save({validateBeforeSave:false})

        return res.status(200).json(new ApiResponse (200 , {isPublished : video.isPublished} , `Video is now ${video.isPublished ? "Published" : "Unpublished"}`))
})
export {publishVideo,getVideoByid,updateVideo,deleteVideo,togglePublishStatus , getAllVideos} 

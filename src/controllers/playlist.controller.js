import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/apiError.js'

import {ApiResponse} from '../utils/apiResponse.js'
import mongoose, { isValidObjectId } from "mongoose"

import { Playlist } from '../models/playlist.model.js'
import {Video} from "../models/video.model.js"


const createPlaylist = asyncHandler(async(req,res)=>{
    const {name ,description} = req.body
    if(name.trim()==="" || description.trim()==="") throw new ApiError(400 , "All fields are required")

    const playList  = await Playlist.create({
        name : name.trim(),
        description : description.trim(),
        video : [],
        owner: req.user._id
    });

    if(!playList) throw new ApiError(500 , "Playlist creation failed")
    
    return res.status(201).json(new ApiResponse(201 , playList , "Playlist created successfully") )

})

const addVideoToPlaylist = asyncHandler(async(req,res)=>{
    const {playlistId , videoId} = req.params
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)) throw new ApiError(400 , 'Invalid Playlist / Video  ID')
    
    const playlistExist = await Playlist.findById(playlistId)
    if(!playlistExist) throw new ApiError(404 , "Playlist not found , please create your playlist first")
    const videoExist = await Video.findById(videoId);
 if(!videoExist) throw new ApiError(404 , "Video not found , please publish your video first")

    const cheakAlreadyVideoInPlaylist = await Playlist.findOne({video : videoId}) 
    if(cheakAlreadyVideoInPlaylist) throw new ApiError(404 , "This Video Already In Your Playlist")

    const updatePlaylist = await Playlist.findByIdAndUpdate(playlistId , {
        $addToSet :{
            video : videoId
        }
    },{new : true})
  
    if(!updatePlaylist) throw new ApiError(500 , "Video not added into in your playlist ")

    return res.status(201).json(new ApiResponse(201 , updatePlaylist ,"Video added to playlist successfully"))

})

const removeVideoFromPlaylist  = asyncHandler(async(req,res)=>{
    const {playListId , videoId} = req.params
    console.log(playListId , videoId)
    if(!isValidObjectId(playListId) || !isValidObjectId(videoId)) throw new ApiError(400 , 'Invalid Playlist / Video  ID')
    
  const playlistExist = await Playlist.findById(playListId)
    if(!playlistExist) throw new ApiError(404 , "Playlist not found , please create your playlist first")
    const videoExist = await Video.findById(videoId);
 if(!videoExist) throw new ApiError(404 , "Video not found , please publish your video first")

    const updatePlaylist  = await Playlist.findByIdAndUpdate(playListId  , {
        $pull :{
            video : videoId
        }
    } , {new : true})

    if(!updatePlaylist) throw new ApiError(500 , "Video not removed from your playlist")

    return res.status(201).json(new ApiResponse(201 , updatePlaylist , "Video removed from your playlist") )
})

const getPlaylistById = asyncHandler(async(req,res)=>{
     const {playListId } = req.params
  
    if(!isValidObjectId(playListId)) throw new ApiError(400 , 'Invalid Playlist ID')
 
    const playList = await Playlist.aggregate([
        {
            $match :{ _id : new mongoose.Types.ObjectId(playListId)}
        },
        {
            $lookup :{
                 from : "videos",
                 localField : "video",
                 foreignField : "_id",
                 as : "VideosDetails",
                 pipeline : [
                    {
                        $lookup : {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as :"OwnerDetails",

                            pipeline :[
                                {
                                    $project :{
                                        fullname :1,
                                        username : 1,
                                        avatar : 1
                                    }
                                }
                            ]
                        }
                    }, {
                            $addFields :{
                                owner : { $first : "$OwnerDetails"}
                            }
                        }
                 ]
            }
        },
        {
            $lookup :{
                from :  "users",
                localField : "owner",
                foreignField : "_id",
                as : "PlaylistOwner", 
                pipeline :[
                {
                    $project :{
                        fullname :1 ,
                        username :1,
                        avatar : 1
                    }
                }
            ]
            
           
        }
    },
        {
            $addFields :  {
                owner : { $first : "$PlaylistOwner"}
            }
        }
    ])

    if(!playList?.length) throw new ApiError(404 , "Playlist not found");

    return res.status(200).json(new ApiResponse(200 , playList , "Playlist fetched successfully"))

})

const getUserPlaylist = asyncHandler(async(req,res)=>{
    const {userId} = req.params
     if(!isValidObjectId(userId)) throw new ApiError(400 , 'Invalid User ID')
    
        const user = await Playlist.find({owner : userId})
        if(!user) throw new ApiError(404 , "User not found")

            return res.status(200).json(new ApiResponse(200 ,user, "User playlist found successfully"))
})

const updatePlaylist = asyncHandler(async(req,res)=>{
       const {playListId } = req.params
      const {name ,description} = req.body
    if(!isValidObjectId(playListId)) throw new ApiError(400 , 'Invalid Playlist ID')
    
    if(name.trim()==="" || description.trim()==="") throw new ApiError(400 , "All fields are required");

    const playlistExist = await Playlist.findById(playListId)
    if(!playlistExist)throw new ApiError(400 , 'Playlist not found')

    const updatedPlaylist  = await Playlist.findByIdAndUpdate(playListId ,{
        $set :{
            name : name.trim(),
            description : description.trim()
        }
    } ,{new : true})


    if(!updatedPlaylist)throw new ApiError(500 , 'Playlist not updated ')

        
  return res.status(200).json(new ApiResponse(200  ,updatedPlaylist,"User playlist updated"))

    
    
    
})


const deletePlaylist = asyncHandler(async(req,res)=>{
       const {playListId } = req.params
    
    if(!isValidObjectId(playListId)) throw new ApiError(400 , 'Invalid Playlist ID')
    

    

      const deletedPlaylist = await Playlist.findByIdAndDelete(playListId )


    if(!deletedPlaylist)throw new ApiError(500 , 'Playlist not updated ')

        
            return res.status(200).json(new ApiResponse(200  ,{},"Playlist deleted"))

    
    
})

export {createPlaylist , addVideoToPlaylist , removeVideoFromPlaylist , getPlaylistById , getUserPlaylist , updatePlaylist , deletePlaylist}
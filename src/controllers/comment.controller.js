import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comments.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const addComment = asyncHandler(async(req,res)=>{
    //get vdeo id from params and cheak validation
    //get comment from req body and cheak validtion
    //cretae commment 
    //return response
    const {videoId} = req.params;
    const {content} = req.body

    if(!isValidObjectId(videoId)) throw new ApiError(400 , "Invalid Video ID")
    if(!content?.trim()==="")    throw new ApiError(400 , "Comment cant be empty")
    
        const newComment = await Comment.create({
            content ,
            video :videoId,
            owner : req.user._id

        })

        if(!newComment) throw new ApiError(500 , "Failed to Create comment")
    
            return res.status(200).json(new ApiResponse(200 , newComment , "Comment added successfully"))

})

const updateComment = asyncHandler(async(req,res)=>{
    //get comment id from params and chk validation
    ///get new conntent and cheak validation 
    //find by id and update new commmetn in db
    //cheak update query validation
    //return res with new comment 

    const {commentId} = req.params
    const {content} = req.body

    if(!isValidObjectId(commentId)) throw new ApiError(400 , "Invalid Video ID")
    if(content.trim()==="")    throw new ApiError(400 , "Comment cant be empty")

    const findComment = await Comment.findById(commentId)

    if(!findComment) throw new ApiError(400 , "Comment not found please comment first on video");

    const newComment = await Comment.findByIdAndUpdate(commentId ,{
        $set :{
            content : content.trim()
        }
        
    },{
        new : true
    })

    if(!newComment) throw new ApiError(500 , "Failed to update new comment on video")
     return res.status(200).json(new ApiResponse(200 , newComment , "Your comment updated...." ))
    
})


const deleteComment = asyncHandler(async(req,res)=>{
    const {commentId} = req.params
    if(!isValidObjectId(commentId)) throw new ApiError(400 , "Invalid Comment ID")

        const findComment = await Comment.findById(commentId)
        if(!findComment) throw new ApiError(400 , "Comment not found")
        
           const deleteComment= await Comment.findByIdAndDelete(commentId).select("-_id").select("-createdAt").select("-updatedAt")

            return res.status(200).json(new ApiResponse(200 , deleteComment , "Comment Deleted"))
})

const getAllVideoComments = asyncHandler(async(req,res)=>{

    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    if(!isValidObjectId(videoId)) throw new ApiError(400 , "Invalid video id")
    
        const commentPipeline = [
            {
                $match :{
                    video : new mongoose.Types.ObjectId(videoId)
                }
            },
            {
                $lookup :{
                    from : "users",
                    localField : "owner",
                    foreignField : "_id",
                    as : "ownerDetails",
                    pipeline:[
                   {
                     $project :{
                        _id :1,
                        fullname : 1,
                        username : 1,
                        avatar : 1
                    }
                   }
                ]
                }
                
            },
            {
                $addFields : {Owner : {$first : "$ownerDetails"}}
            } , 
            {
                $sort :{
                    createdAt : -1
                }
            },
            {
                $project :{
                    _id : 1,
                    content : 1,
                    createdAt : 1,
                    Owner : 1

                }
            }
        ]

        const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    // 3. Aggregate Paginate call karo
    const comments = await Comment.aggregatePaginate(
        Comment.aggregate(commentPipeline),
        options
    );

    return res
        .status(200)
        .json(new ApiResponse(200, comments, "Comments fetched successfully"));

})
export {addComment , updateComment , deleteComment , getAllVideoComments}
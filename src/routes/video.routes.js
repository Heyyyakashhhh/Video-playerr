import { Router } from 'express';
import {
    publishVideo , getVideoByid ,updateVideo,deleteVideo , togglePublishStatus,
    getAllVideos
} from "../controllers/video.controller.js"
import {verfiyJwt} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"

const router = Router();
router.use(verfiyJwt); // Apply verifyJWT middleware to all routes in this file
router.route('/').get(getAllVideos)
router.route('/:videoId').get(getVideoByid)
router.route('/publish').post( upload.fields([{name : "videoFile" , maxCount:1},{ name : "thumbnail" , maxCount:1}] ) , publishVideo   )
router.route('/update/:videoId').patch(upload.fields([{name : "videoFile" , maxCount:1},{ name : "thumbnail" , maxCount:1}]) , updateVideo)
router.route('/delete/:videoId').delete(deleteVideo)
router.route('/toggled/:videoId').patch(togglePublishStatus)
export default router
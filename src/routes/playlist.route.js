import { Router } from "express";
import { verfiyJwt } from "../middlewares/auth.middleware.js";
import {createPlaylist , addVideoToPlaylist , removeVideoFromPlaylist, getPlaylistById , getUserPlaylist , updatePlaylist , deletePlaylist} from '../controllers/playlist.controller.js'
import { get } from "mongoose";

const router = Router();

router.use(verfiyJwt); // Saare playlist routes protected hain

router.route('/').post(createPlaylist)
router.route('/:playListId').get(getPlaylistById)
router.route('/update/:playListId').patch(updatePlaylist);
router.route('/userPlaylist/:userId').get(getUserPlaylist)
router.route('/delete/:playListId').delete(deletePlaylist)

router.route('/addVideo/:playlistId/:videoId').patch(addVideoToPlaylist)
router.route('/remove/:playListId/:videoId').patch(removeVideoFromPlaylist)


export default router
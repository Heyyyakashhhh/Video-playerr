import { Router } from "express";
import { verfiyJwt } from "../middlewares/auth.middleware.js";
import { toggleCommentLike, toggleLike, toggleTweetLike ,getLikedVideos} from "../controllers/like.controler.js";
const router = Router();
router.use(verfiyJwt); 

router.route('/toggle/v/:videoId').post(toggleLike)
router.route('/toggle/c/:commentId').post(toggleCommentLike)
router.route('/toggle/t/:tweetId').post(toggleTweetLike)
router.route('/').get(getLikedVideos)
export default router
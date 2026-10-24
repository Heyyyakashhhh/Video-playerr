import { Router } from "express";
import { verfiyJwt } from "../middlewares/auth.middleware.js";
import {addTweet , deleteTweet, updatedTweet , getAllUserTweet}from "../controllers/tweet.controller.js";
const router = Router();
router.use(verfiyJwt); 

router.route('/addTweet').post(addTweet)
router.route('/:tweetId').patch(updatedTweet)
router.route('/delete/:tweetId').delete(deleteTweet)
router.route('/allTweets/:userId').get(getAllUserTweet)
export default router
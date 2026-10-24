import { Router } from "express";
import { verfiyJwt } from "../middlewares/auth.middleware.js";
import {addComment , updateComment ,deleteComment , getAllVideoComments}from "../controllers/comment.controller.js";
const router = Router();
router.use(verfiyJwt); 

router.route('/:videoId').post(addComment)
router.route('/update/:commentId').patch(updateComment)
router.route('/delete/:commentId').delete(deleteComment)
router.route('/:videoId').get(getAllVideoComments)

export default router
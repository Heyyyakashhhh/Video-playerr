import {Router} from 'express'
import {registerUser,loginUser ,logoutUser,refreshAccsessToken , changeCurrentPassword , getCurrentUser, updateOtherDetails,verifyUserEmail, updateUserAvtarImg,updateUserCoverImg,getChannelProfile,getWatchHistory} from '../controllers/users.controler.js'
import {upload} from '../middlewares/multer.middleware.js'
import {verfiyJwt} from '../middlewares/auth.middleware.js'


const router = Router()

router.route('/register').post(upload.fields([{name : "avatar" , maxCount : 1},{name : "coverImage", maxCount:1}])
    ,registerUser)
router.route("/verify-email/:userId").get(verifyUserEmail);
router.route('/login').post(loginUser)
router.route('/logout').post(verfiyJwt , logoutUser)
router.route('/refresh-token').post(refreshAccsessToken)
router.route('/change-password').post(verfiyJwt,changeCurrentPassword)
router.route('/current-user').get(verfiyJwt,getCurrentUser)
router.route('/update-account').patch(verfiyJwt,updateOtherDetails)
router.route('/avatar').patch(verfiyJwt, upload.single('avatar') , updateUserAvtarImg);
router.route('/cover-image').patch(verfiyJwt , upload.single('/coverImage') , updateUserCoverImg);
router.route('/c/:username').get(verfiyJwt , getChannelProfile)
router.route('/history').get(verfiyJwt , getWatchHistory)


export default router

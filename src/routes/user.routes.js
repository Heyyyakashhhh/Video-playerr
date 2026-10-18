import {Router} from 'express'
import {registerUser,loginUser ,logoutUser,refreshAccsessToken} from '../controllers/users.controler.js'
import {upload} from '../middlewares/multer.middleware.js'
import {verfiyJwt} from '../middlewares/auth.middleware.js'


const router = Router()

router.route('/register').post(upload.fields([{name : "avatar" , maxCount : 1},{name : "coverImage", maxCount:1}])
    ,registerUser)

router.route('/login').post(loginUser)
router.route('/logout').post(verfiyJwt , logoutUser)
router.route('/refresh-token').post(refreshAccsessToken)

export default router

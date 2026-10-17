import {Router} from 'express'
import {registerUser,loginUser} from '../controllers/users.controler.js'
import {upload} from '../middlewares/multer.middleware.js'
import {verfiyJwt} from '../middlewares/auth.middleware.js'


const router = Router()

router.route('/register').post(upload.fields([{name : "avatar" , maxCount : 1},{name : "coverImage", maxCount:1}])
    ,registerUser)

router.route('/login').post(verfiyJwt,loginUser)
export default router
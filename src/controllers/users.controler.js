import {asyncHander} from '../utils/asyncHandler.js'

const userController  = asyncHander(async(req,res)=>{
return res.status(200).json({
message :"ok"
})
})

export {userController as registerUser}
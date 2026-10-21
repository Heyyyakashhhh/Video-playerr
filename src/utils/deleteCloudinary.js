import { v2 as cloudinary } from 'cloudinary';
import { ApiError } from "../utils/apiError.js"

const deleteFromCloudinary = async(cloudniaryUrl)=>{

  try{
    if(!cloudniaryUrl)  return null;

    const publicId = cloudniaryUrl.split("/").pop().split("")[0];
    const response = cloudinary.uploader.destroy(publicId , {
resource_type : "image"
    })

    return response
    console.log(publicId)

  }
catch(err){throw new ApiError(500 ,"Error deleting from Cloudinary" , err)}
    

}
export {deleteFromCloudinary}
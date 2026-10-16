import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';


    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });
    
const uploadToCloudinary = async(localfilePath)=>{
   
     try{
        if(!localfilePath) return console.log("No file path provided for upload.");
        const response = await cloudinary.uploader.upload(localfilePath,{
            resource_type: "auto"
        })
        
        console.log('file uploaded on cloudinary',response.url)// Delete the local file after upload
        return response 
    }catch(error){
        console.error("Error uploading to Cloudinary:", error);
        fs.unlinkSync(localfilePath) // Delete the local file even if upload fails
        return null

    }
}

export {uploadToCloudinary}
  
    

import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true // Ensures all generated URLs use HTTPS
});
    
const uploadToCloudinary = async (localfilePath) => {
     try {
        if (!localfilePath) {
            console.log("No file path provided for upload.");
            return null;
        }

        // Upload the file to Cloudinary
        const response = await cloudinary.uploader.upload(localfilePath, {
            resource_type: "auto"
        });
        
        console.log('File uploaded to Cloudinary:', response.secure_url);

        return response; 
    } catch (error) {
        console.error("Error uploading to Cloudinary:", error);

        // FIX: Only attempt deletion if the file path exists on disk
        if (localfilePath && fs.existsSync(localfilePath)) {
            fs.unlinkSync(localfilePath); 
        }
        
        return null;
    }
};

export { uploadToCloudinary };

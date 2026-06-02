import { v2 as cloudinary } from "cloudinary";
import { error, log } from "console";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log("File uploaded successfully! ", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (err) {
    fs.unlinkSync(localFilePath);
    console.error("ERROR: ", err);
    return null;
  }
};

export { uploadOnCloudinary };

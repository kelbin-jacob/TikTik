const multer = require("multer");
require("dotenv").config();
const path = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const sharp = require("sharp");

const MAX_FILE_SIZE_BYTES = 2097152;

// Configure AWS S3 SDK
const s3 = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

const imageExtTypes = [".jpg", ".jpeg", ".png", ".gif"];

const checkFileType = (file) => {
  const extName = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype.startsWith("image/");
  return extName && mimeType && imageExtTypes.includes(extName);
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (checkFileType(file)) {
      cb(null, true);
    } else {
      const error = new Error("Invalid file type");
      error.status = 400;
      error.details = {
        message: "Invalid file type",
        errorCode: 701,
      };
      cb(error);
    }
  },
  // limits: {
  //   fileSize: 2 * 1024 * 1024, // 2MB limit
  // },
});

const imageExtTypes1 = [".pdf"];

const checkFileType1 = (file) => {
  const extName = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype.startsWith("application/");
  return extName && mimeType && imageExtTypes1.includes(extName);
};

const upload1 = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (checkFileType1(file)) {
      cb(null, true);
    } else {
      const error = new Error("Invalid file type");
      error.status = 400;
      error.details = {
        message: "Invalid file type",
        errorCode: 701,
      };
      cb(error);
    }
  },
  // limits: {
  //   fileSize: 2 * 1024 * 1024, // 2MB limit
  // },
});
const uploadToS3 = async (file, category) => {
  try {
    let compressedImage = file.buffer;
    const timestamp = Date.now(); // Get current timestamp
    const extName = path.extname(file.originalname);
    const originalNameWithoutExt = path.parse(file.originalname).name; // Extract original filename without extension
    const randomName = `${originalNameWithoutExt}_${timestamp}${extName}`;

    // Define the folder structure based on the category
    const folder = category ? `${category}/` : ""; // Use the category name as the folder name

    // Combine the folder, randomName, and file path to create the desired folder structure in S3
    const filePathInS3 = `${folder}${randomName}`;
    if (file.mimetype.startsWith("image/") && file.size > MAX_FILE_SIZE_BYTES) {
      // Only if the image size exceeds 2MB, it will be compressed
      compressedImage = await sharp(file.buffer).resize(800).toBuffer();
    }

    // const compressedImage = await sharp(file.buffer).resize(800).toBuffer();

    // Get the size of the buffer in bytes
    const fileSizeInBytes = compressedImage.length;

    // Convert bytes to kilobytes (KB) or megabytes (MB) if needed
    // const fileSizeInKB = fileSizeInBytes / 1024; // KB
    // const fileSizeInMB = fileSizeInKB / 1024; // MB
    if (fileSizeInBytes > MAX_FILE_SIZE_BYTES) {
      return new Error("File size exceeds the maximum allowed (2MB)");
    }

    const params = {
      Bucket: process.env.BUCKET_NAME, // Replace with your S3 bucket name (configured in your S3 client)
      Key: filePathInS3, // Use the generated file path as the S3 object key
      Body: compressedImage,
    };

    return s3
      .send(new PutObjectCommand(params))
      .then(() => {
        return filePathInS3; // Return the file path in S3
      })
      .catch((error) => {
        return error; // Return the error for handling at the calling site
      });
  } catch (error) {
    return error; // Return the error for handling at the calling site
  }
};


const multipleUploadToS3 = async (files, category) => {
    try {
      const timestamp = Date.now(); // Get current timestamp
  
      // Define the folder structure based on the category
      const folder = category ? `${category}/` : ""; // Use the category name as the folder name
      // Create an array to store the file paths in S3
      const filePathsInS3 = [];
  
      return Promise.all(
        files.map(async (file) => {
          let compressedImage = file.buffer;
          if (
            file.mimetype.startsWith("image/") &&
            file.size > MAX_FILE_SIZE_BYTES
          ) {
            compressedImage = await sharp(file.buffer).resize(800).toBuffer();
          }
  
          // Get the size of the buffer in bytes
          const fileSizeInBytes = compressedImage.length;
          // Convert bytes to kilobytes (KB) or megabytes (MB) if needed
          const fileSizeInKB = fileSizeInBytes / 1024; // KB
          const fileSizeInMB = fileSizeInKB / 1024; // MB
  
          if (fileSizeInBytes > MAX_FILE_SIZE_BYTES) {
            return new Error("File size exceeds the maximum allowed (2MB)");
          }
          // Iterate through the array of file buffers
          const extName = path.extname(file.originalname);
          const originalNameWithoutExt = path.parse(file.originalname).name; // Extract original filename without extension
          const randomName = `${originalNameWithoutExt}_${timestamp}${extName}`;
          const filePathInS3 = `${folder}${randomName}`;
  
          const params = {
            Bucket: process.env.BUCKET_NAME, // Replace with your S3 bucket name (configured in your S3 client)
            Key: filePathInS3, // Use the generated file path as the S3 object key
            Body: compressedImage, // Use fileBuffer.buffer to access the buffer
          };
  
          // Upload the file to S3 and push the file path to the array
  
          await s3.send(new PutObjectCommand(params));
          filePathsInS3.push(process.env.S3_STORAGE_PATH + filePathInS3);
        })
      ).then(() => {
        return filePathsInS3; // Return the array of file paths in S3
      });
    } catch (error) {
      throw error; // Handle any errors that occur during the S3 upload
    }
  };

  module.exports = { upload, upload1, uploadToS3, multipleUploadToS3 };
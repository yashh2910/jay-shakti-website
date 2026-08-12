require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const buffer = Buffer.from('hello world', 'utf8');

function testUpload() {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'jay-shakti/settings/favicon',
        resource_type: 'raw', // because it's text
      },
      (error, result) => {
        if (error) {
          console.error("Upload failed:", error);
          reject(error);
        } else {
          console.log("Upload success:", result.secure_url);
          resolve();
        }
      }
    );
    stream.end(buffer);
  });
}

testUpload();

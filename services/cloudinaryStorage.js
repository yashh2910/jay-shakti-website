/**
 * cloudinaryStorage.js
 * ---------------------
 * Cloudinary upload helper using the official cloudinary Node.js SDK v2.
 *
 * Required environment variables:
 *   CLOUDINARY_CLOUD_NAME  — your cloud name (shown on the Cloudinary dashboard)
 *   CLOUDINARY_API_KEY     — API key
 *   CLOUDINARY_API_SECRET  — API secret
 *
 * Uploaded files are served via Cloudinary's fast global CDN and the
 * returned secure_url is permanent — it never expires.
 */

require('dotenv').config();
const cloudinary = require('cloudinary').v2;

// The cloudinary v2 SDK automatically picks up the CLOUDINARY_URL environment variable.
// No manual cloudinary.config() is needed.

console.log('[CLOUDINARY] Service loaded. Checking environment variable:');
console.log('  CLOUDINARY_URL is', process.env.CLOUDINARY_URL ? 'SET (length: ' + process.env.CLOUDINARY_URL.length + ')' : 'NOT SET');


/**
 * Upload a file buffer to Cloudinary.
 *
 * @param {Buffer} buffer   - Raw file bytes from multer memoryStorage
 * @param {string} folder   - Sub-folder inside your Cloudinary account
 * @param {Object} options  - Additional Cloudinary upload options (e.g. transformations)
 * @returns {Promise<string>} Permanent public HTTPS URL (secure_url)
 */
function uploadToCloudinary(buffer, folder, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        ...options
      },
      (error, result) => {
        if (error) {
          console.error('[CLOUDINARY] upload_stream callback error:');
          console.error('  http_code  :', error.http_code);
          console.error('  message    :', error.message);
          console.error('  error obj  :', JSON.stringify(error, null, 2));
          return reject(error);
        }
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}


module.exports = { uploadToCloudinary };

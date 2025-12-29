import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'dastkar-rugs';
const BUCKET_REGION = process.env.AWS_REGION || 'us-east-2';

export interface Base64Image {
  data: string; // base64 encoded image data
  mimeType?: string; // optional mime type like 'image/jpeg'
}

/**
 * Upload base64 image to S3
 * @param base64Image - Base64 image data with optional mime type
 * @param folder - Folder path in S3 (default: 'rugs')
 * @returns S3 URL of the uploaded image
 */
export async function uploadImageToS3(
  base64Image: Base64Image,
  folder: string = 'rugs'
): Promise<string> {
  try {
    // Parse base64 data
    let imageData: string = base64Image.data;
    let mimeType: string = 'image/webp'; // default

    // Check if base64 string includes data URL prefix
    if (imageData.includes('data:')) {
      const parts = imageData.split(';base64,');
      if (parts.length === 2) {
        const mimeMatch = parts[0].match(/data:([^;]+)/);
        if (mimeMatch) {
          mimeType = mimeMatch[1];
        }
        imageData = parts[1];
      }
    } else if (base64Image.mimeType) {
      mimeType = base64Image.mimeType;
    }

    // Validate base64 data
    if (!imageData || imageData.length === 0) {
      throw new Error('Invalid base64 image data');
    }

    // Determine file extension from mime type
    const extMap: { [key: string]: string } = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
    };

    const extension = extMap[mimeType] || '.webp';

    // Generate unique filename
    const filename = `${uuidv4()}${extension}`;
    const key = `${folder}/${filename}`;

    // Decode base64 to buffer
    let buffer: Buffer;
    try {
      buffer = Buffer.from(imageData, 'base64');
    } catch (decodeError) {
      throw new Error('Invalid base64 encoding');
    }

    // Validate buffer is actually an image
    if (!buffer || buffer.length === 0) {
      throw new Error('Invalid image buffer');
    }

    // Basic validation: check if it's a reasonable image size (at least 100 bytes)
    if (buffer.length < 100) {
      throw new Error('Image file too small');
    }

    // Basic validation: check if it's not too large (max 10MB)
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    if (buffer.length > MAX_IMAGE_SIZE) {
      throw new Error('Image file too large (max 10MB)');
    }

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      // ACL removed - use bucket policy for public access instead
    });

    await s3Client.send(command);

    // Return S3 URL
    const s3Url = `https://${BUCKET_NAME}.s3.${BUCKET_REGION}.amazonaws.com/${key}`;
    return s3Url;
  } catch (error: any) {
    console.error('Error uploading image to S3:', error.message);
    throw new Error(`Failed to upload image to S3: ${error.message}`);
  }
}

/**
 * Delete image from S3
 * @param s3Url - Full S3 URL or key path
 * @returns void
 */
export async function deleteImageFromS3(s3Url: string): Promise<void> {
  try {
    if (!s3Url) {
      return;
    }

    // Extract key from S3 URL
    let key: string;
    if (s3Url.startsWith('https://') || s3Url.startsWith('http://')) {
      // Full URL format: https://bucket-name.s3.region.amazonaws.com/folder/filename.jpg
      const urlParts = s3Url.split('.amazonaws.com/');
      if (urlParts.length !== 2) {
        console.warn(`Invalid S3 URL format: ${s3Url}`);
        return;
      }
      key = urlParts[1];
    } else {
      // Assume it's already a key
      key = s3Url;
    }

    // Security check: ensure key is in rugs folder
    if (!key.startsWith('rugs/')) {
      console.warn(`Attempted to delete image outside rugs folder: ${key}`);
      return;
    }

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    console.log(`Deleted image from S3: ${key}`);
  } catch (error: any) {
    console.error(`Error deleting image from S3 ${s3Url}:`, error.message);
    // Don't throw - continue even if delete fails
  }
}

/**
 * Delete multiple images from S3
 * @param s3Urls - Array of S3 URLs
 */
export async function deleteImagesFromS3(s3Urls: string[]): Promise<void> {
  if (!s3Urls || s3Urls.length === 0) {
    return;
  }

  // Delete all images in parallel
  await Promise.all(s3Urls.map((url) => deleteImageFromS3(url)));
}

/**
 * Check if an image exists in S3
 * @param s3Url - Full S3 URL or key path
 * @returns boolean
 */
export async function imageExistsInS3(s3Url: string): Promise<boolean> {
  try {
    if (!s3Url) {
      return false;
    }

    // Extract key from S3 URL
    let key: string;
    if (s3Url.startsWith('https://') || s3Url.startsWith('http://')) {
      const urlParts = s3Url.split('.amazonaws.com/');
      if (urlParts.length !== 2) {
        return false;
      }
      key = urlParts[1];
    } else {
      key = s3Url;
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error: any) {
    // If error is 404 or NoSuchKey, image doesn't exist
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    console.error(`Error checking image existence in S3 ${s3Url}:`, error.message);
    return false;
  }
}



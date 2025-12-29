import { uploadImageToS3, deleteImageFromS3, deleteImagesFromS3, imageExistsInS3 } from './s3.util';

// Check if S3 credentials are configured
function checkS3Config(): void {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET_NAME) {
    throw new Error('AWS S3 credentials are required. Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET_NAME in environment variables.');
  }
}

export interface Base64Image {
  data: string; // base64 encoded image data
  mimeType?: string; // optional mime type like 'image/jpeg'
}

/**
 * Decode base64 image and save to S3
 * @param base64Image - Base64 image data with optional mime type
 * @returns S3 URL (e.g., "https://bucket.s3.region.amazonaws.com/rugs/abc123.webp")
 */
export async function saveBase64Image(base64Image: Base64Image): Promise<string> {
  try {
    // Check S3 configuration
    checkS3Config();
    
    // Upload to S3
    return await uploadImageToS3(base64Image, 'rugs');
  } catch (error: any) {
    console.error('Error saving base64 image to S3:', error.message);
    throw new Error(`Failed to save image to S3: ${error.message}`);
  }
}

/**
 * Delete an image file from S3
 * @param imagePath - S3 URL (e.g., "https://bucket.s3.region.amazonaws.com/rugs/abc123.webp")
 */
export async function deleteImage(imagePath: string): Promise<void> {
  try {
    if (!imagePath) {
      return;
    }

    // Check S3 configuration
    checkS3Config();

    // Validate it's an S3 URL
    if (!imagePath.startsWith('https://') && !imagePath.startsWith('http://')) {
      console.warn(`Invalid S3 URL format: ${imagePath}`);
      return;
    }

    // Delete from S3
    await deleteImageFromS3(imagePath);
  } catch (error: any) {
    console.error(`Error deleting image from S3 ${imagePath}:`, error.message);
    // Don't throw - continue even if delete fails
  }
}

/**
 * Delete multiple images from S3
 * @param imagePaths - Array of S3 URLs
 */
export async function deleteImages(imagePaths: string[]): Promise<void> {
  if (!imagePaths || imagePaths.length === 0) {
    return;
  }

  // Check S3 configuration
  checkS3Config();

  // Delete all images from S3 in parallel
  await deleteImagesFromS3(imagePaths);
}

/**
 * Check if an image exists in S3
 * @param imagePath - S3 URL (e.g., "https://bucket.s3.region.amazonaws.com/rugs/abc123.webp")
 * @returns boolean
 */
export async function imageExists(imagePath: string): Promise<boolean> {
  try {
    if (!imagePath) {
      return false;
    }

    // Check S3 configuration
    checkS3Config();

    // Validate it's an S3 URL
    if (!imagePath.startsWith('https://') && !imagePath.startsWith('http://')) {
      return false;
    }

    // Check in S3
    return await imageExistsInS3(imagePath);
  } catch (error) {
    return false;
  }
}



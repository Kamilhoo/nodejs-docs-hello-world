import { FastifyRequest, FastifyReply } from 'fastify';
import { saveBase64Image, deleteImage } from '../utils/image.util';

interface UploadImageBody {
  image: {
    data: string;
    mimeType?: string;
  };
}

interface DeleteImageBody {
  imageUrl: string;
}

/**
 * Upload single image (Admin only)
 * Returns image URL that can be used in rug creation/update
 */
export async function uploadImage(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const body = request.body as UploadImageBody;
    const { image } = body;

    if (!image || !image.data) {
      return reply.status(400).send({
        success: false,
        message: 'Image data is required',
      });
    }

    // Validate base64 data exists
    if (!image.data || image.data.length === 0) {
      return reply.status(400).send({
        success: false,
        message: 'Invalid image data',
      });
    }

    // Save image and get URL (S3 or local)
    const imageUrl = await saveBase64Image(image);

    reply.status(200).send({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl,
    });
  } catch (error: any) {
    console.error('Error uploading image:', error.message);
    reply.status(400).send({
      success: false,
      message: error.message || 'Failed to upload image',
    });
  }
}

/**
 * Delete/cancel uploaded image (Admin only)
 * Deletes the image file from the server
 */
export async function deleteUploadedImage(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const body = request.body as DeleteImageBody;
    const { imageUrl } = body;

    if (!imageUrl) {
      return reply.status(400).send({
        success: false,
        message: 'Image URL is required',
      });
    }

    // Validate image URL format (must be S3 URL)
    if (typeof imageUrl !== 'string' || (!imageUrl.startsWith('https://') && !imageUrl.startsWith('http://'))) {
      return reply.status(400).send({
        success: false,
        message: 'Invalid image URL format. Must be a valid S3 URL.',
      });
    }

    // Delete the image file (S3 or local)
    await deleteImage(imageUrl);

    reply.status(200).send({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting image:', error.message);
    reply.status(400).send({
      success: false,
      message: error.message || 'Failed to delete image',
    });
  }
}


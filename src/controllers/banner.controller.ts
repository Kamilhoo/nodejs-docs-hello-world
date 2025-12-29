import { FastifyRequest, FastifyReply } from 'fastify';
import { Banner, BannerDocument } from '../models/banner.model';
import { AuthRequest } from '../types';

interface AddDataBody {
  value: string;
}

interface UpdateDataBody {
  index: number;
  value: string;
}

interface DeleteDataBody {
  index: number;
}

/**
 * Get banner data (Public endpoint)
 */
export async function getBanner(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // Get or create banner document (there should only be one)
    let banner = await Banner.findOne();

    if (!banner) {
      // Create a new banner document if it doesn't exist
      banner = await Banner.create({ data: [] });
    }

    reply.status(200).send({
      success: true,
      banner: {
        data: banner.data || [],
        createdAt: banner.createdAt,
        updatedAt: banner.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Error getting banner:', error.message);
    reply.status(500).send({
      success: false,
      message: 'Failed to fetch banner data',
    });
  }
}

/**
 * Add data to array (Admin only)
 */
export async function addData(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authRequest = request as AuthRequest;

    if (!authRequest.user || !authRequest.user.id) {
      return reply.status(401).send({
        success: false,
        message: 'Unauthorized',
      });
    }

    const body = request.body as AddDataBody;
    const { value } = body;

    if (!value || typeof value !== 'string' || value.trim().length === 0) {
      return reply.status(400).send({
        success: false,
        message: 'Data value is required and must be a non-empty string',
      });
    }

    // Get or create banner document
    let banner = await Banner.findOne();

    if (!banner) {
      banner = await Banner.create({ data: [] });
    }

    // Add new data to array
    banner.data.push(value.trim());
    await banner.save();

    reply.status(200).send({
      success: true,
      message: 'Data added successfully',
      banner: {
        data: banner.data,
        createdAt: banner.createdAt,
        updatedAt: banner.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Error adding data:', error.message);

    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      return reply.status(400).send({
        success: false,
        message: 'Validation error: ' + Object.values(error.errors).map((e: any) => e.message).join(', '),
      });
    }

    reply.status(500).send({
      success: false,
      message: 'Failed to add data',
    });
  }
}

/**
 * Update data in array (Admin only)
 */
export async function updateData(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authRequest = request as AuthRequest;

    if (!authRequest.user || !authRequest.user.id) {
      return reply.status(401).send({
        success: false,
        message: 'Unauthorized',
      });
    }

    const body = request.body as UpdateDataBody;
    const { index, value } = body;

    if (index === undefined || typeof index !== 'number' || !Number.isInteger(index) || index < 0) {
      return reply.status(400).send({
        success: false,
        message: 'Valid integer index is required',
      });
    }

    if (!value || typeof value !== 'string' || value.trim().length === 0) {
      return reply.status(400).send({
        success: false,
        message: 'Data value is required and must be a non-empty string',
      });
    }

    // Get banner document
    const banner = await Banner.findOne();

    if (!banner) {
      return reply.status(404).send({
        success: false,
        message: 'Banner not found',
      });
    }

    // Check if index is valid
    if (index >= banner.data.length) {
      return reply.status(400).send({
        success: false,
        message: `Index ${index} is out of bounds. Array has ${banner.data.length} items.`,
      });
    }

    // Update data at index
    banner.data[index] = value.trim();
    await banner.save();

    reply.status(200).send({
      success: true,
      message: 'Data updated successfully',
      banner: {
        data: banner.data,
        createdAt: banner.createdAt,
        updatedAt: banner.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Error updating data:', error.message);

    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      return reply.status(400).send({
        success: false,
        message: 'Validation error: ' + Object.values(error.errors).map((e: any) => e.message).join(', '),
      });
    }

    reply.status(500).send({
      success: false,
      message: 'Failed to update data',
    });
  }
}

/**
 * Delete data from array (Admin only)
 */
export async function deleteData(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authRequest = request as AuthRequest;

    if (!authRequest.user || !authRequest.user.id) {
      return reply.status(401).send({
        success: false,
        message: 'Unauthorized',
      });
    }

    const body = request.body as DeleteDataBody;
    const { index } = body;

    if (index === undefined || typeof index !== 'number' || !Number.isInteger(index) || index < 0) {
      return reply.status(400).send({
        success: false,
        message: 'Valid integer index is required',
      });
    }

    // Get banner document
    const banner = await Banner.findOne();

    if (!banner) {
      return reply.status(404).send({
        success: false,
        message: 'Banner not found',
      });
    }

    // Check if index is valid
    if (index >= banner.data.length) {
      return reply.status(400).send({
        success: false,
        message: `Index ${index} is out of bounds. Array has ${banner.data.length} items.`,
      });
    }

    // Remove data at index
    banner.data.splice(index, 1);
    await banner.save();

    reply.status(200).send({
      success: true,
      message: 'Data deleted successfully',
      banner: {
        data: banner.data,
        createdAt: banner.createdAt,
        updatedAt: banner.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Error deleting data:', error.message);

    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      return reply.status(400).send({
        success: false,
        message: 'Validation error: ' + Object.values(error.errors).map((e: any) => e.message).join(', '),
      });
    }

    reply.status(500).send({
      success: false,
      message: 'Failed to delete data',
    });
  }
}


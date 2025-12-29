import { FastifyReply } from 'fastify';
import { AuthRequest } from '../types';
import { ShippingFee } from '../models/shippingFee.model';

interface CreateShippingFeeBody {
  freeShippingThreshold: number;
  shippingFee: number;
  country: string; // Required - country name
  isActive?: boolean;
}

interface GetShippingFeeQuery {
  country?: string; // Optional - if not provided, defaults to 'Pakistan'
}

/**
 * Create or Update Shipping Fee (Admin only)
 * Creates or updates shipping fee for a specific country
 */
export const createOrUpdateShippingFee = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    const body = request.body as CreateShippingFeeBody;

    // Validate required fields
    if (body.freeShippingThreshold === undefined || body.shippingFee === undefined || !body.country) {
      return reply.status(400).send({
        success: false,
        message: 'freeShippingThreshold, shippingFee, and country are required',
      });
    }

    // Validate freeShippingThreshold
    if (typeof body.freeShippingThreshold !== 'number' || body.freeShippingThreshold < 0) {
      return reply.status(400).send({
        success: false,
        message: 'freeShippingThreshold must be a non-negative number',
      });
    }

    // Validate shippingFee
    if (typeof body.shippingFee !== 'number' || body.shippingFee < 0) {
      return reply.status(400).send({
        success: false,
        message: 'shippingFee must be a non-negative number',
      });
    }

    // Validate country
    const country = body.country.trim();
    if (country.length === 0) {
      return reply.status(400).send({
        success: false,
        message: 'Country name cannot be empty',
      });
    }

    // Check if shipping fee already exists for this country
    let shippingFee = await ShippingFee.findOne({ country });
    let isNew = false;

    if (shippingFee) {
      // Update existing shipping fee for this country
      shippingFee.freeShippingThreshold = body.freeShippingThreshold;
      shippingFee.shippingFee = body.shippingFee;
      if (body.isActive !== undefined) {
        shippingFee.isActive = body.isActive;
      }
      await shippingFee.save();
    } else {
      // Create new shipping fee for this country
      isNew = true;
      shippingFee = await ShippingFee.create({
        freeShippingThreshold: body.freeShippingThreshold,
        shippingFee: body.shippingFee,
        country,
        isActive: body.isActive !== undefined ? body.isActive : true,
      });
    }

    return reply.status(200).send({
      success: true,
      message: isNew ? 'Shipping fee created successfully' : 'Shipping fee updated successfully',
      shippingFee: {
        id: shippingFee._id,
        freeShippingThreshold: shippingFee.freeShippingThreshold,
        shippingFee: shippingFee.shippingFee,
        country: shippingFee.country,
        isActive: shippingFee.isActive,
        createdAt: shippingFee.createdAt,
        updatedAt: shippingFee.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Error creating/updating shipping fee:', error);
    
    // Handle duplicate country error
    if (error.code === 11000 || error.name === 'MongoServerError') {
      return reply.status(400).send({
        success: false,
        message: `Shipping fee configuration already exists for this country`,
      });
    }

    return reply.status(500).send({
      success: false,
      message: 'Failed to create/update shipping fee',
    });
  }
};

/**
 * Get Shipping Fee Configuration (Public API)
 * Returns active shipping fee for the specified country
 */
export const getShippingFee = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    const query = request.query as GetShippingFeeQuery;
    const country = query.country ? query.country.trim() : 'Pakistan';

    // Get active shipping fee configuration for the country
    const shippingFee = await ShippingFee.findOne({
      country,
    });

    if (!shippingFee) {
      return reply.status(404).send({
        success: false,
        message: `Shipping fee configuration not found for country: ${country}`,
      });
    }

    return reply.status(200).send({
      success: true,
      shippingFee: {
        id: shippingFee._id,
        freeShippingThreshold: shippingFee.freeShippingThreshold,
        shippingFee: shippingFee.shippingFee,
        country: shippingFee.country,
        isActive: shippingFee.isActive,
        createdAt: shippingFee.createdAt,
        updatedAt: shippingFee.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Error fetching shipping fee:', error);
    return reply.status(500).send({
      success: false,
      message: 'Failed to fetch shipping fee',
    });
  }
};


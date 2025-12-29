import { FastifyRequest, FastifyReply } from 'fastify';
import { Rug, RugDocument } from '../models/rug.model';
import { deleteImages } from '../utils/image.util';
import { AuthRequest } from '../types';
import mongoose from 'mongoose';

interface CreateRugBody {
    title: string;
    brand: string;
    description?: string;
    images: string[]; // Array of image URLs from /upload/image endpoint
    category: string;
    originalPrice: number;
    discountPercent: number;
    colors?: string[];
    sizes?: string[];
    isOnSale?: boolean;
    isBestSeller?: boolean;
    stock?: number;
    isActive?: boolean;
}

interface UpdateRugBody {
    title?: string;
    brand?: string;
    description?: string;
    images?: string[]; // Array of image URLs from /upload/image endpoint
    category?: string;
    originalPrice?: number;
    discountPercent?: number;
    colors?: string[];
    sizes?: string[];
    isOnSale?: boolean;
    isBestSeller?: boolean;
    stock?: number;
    isActive?: boolean;
}

interface RugParams {
    id: string;
}

interface RugQuery {
    category?: string;
    brand?: string;
    isOnSale?: boolean;
    isBestSeller?: boolean;
    isActive?: boolean;
    minPrice?: number;
    maxPrice?: number;
    colors?: string[] | string;
    sizes?: string[] | string;
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'price' | 'title';
    sortOrder?: 'asc' | 'desc';
}

/**
 * Calculate sale price from original price and discount percentage
 * @param originalPrice - Original price in lowest unit (rupees)
 * @param discountPercent - Discount percentage (0-100)
 * @returns Sale price in lowest unit (rupees)
 */
function calculateSalePrice(originalPrice: number, discountPercent: number): number {
    return Math.round(originalPrice * (1 - discountPercent / 100));
}

/**
 * Get all rugs (Public endpoint - only active rugs)
 */
export async function getAllRugs(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    try {
        const query = request.query as RugQuery;
        const {
            category,
            brand,
            isOnSale,
            isBestSeller,
            minPrice,
            maxPrice,
            colors,
            sizes,
            page = 1,
            limit = 20,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = query;

        // Build filter query
        const filter: any = { isActive: true }; // Only show active rugs to public

        if (category) {
            filter.category = category;
        }
        if (brand) {
            filter.brand = brand;
        }
        if (isOnSale !== undefined) {
            filter.isOnSale = isOnSale;
        }
        if (isBestSeller !== undefined) {
            filter.isBestSeller = isBestSeller;
        }

        // Price filter
        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.salePrice = {};
            if (minPrice !== undefined) {
                filter.salePrice.$gte = minPrice;
            }
            if (maxPrice !== undefined) {
                filter.salePrice.$lte = maxPrice;
            }
        }

        // Colors filter - check if any of the provided colors match
        if (colors) {
            const colorArray = Array.isArray(colors) ? colors : [colors];
            filter.colors = { $in: colorArray };
        }

        // Sizes filter - check if any of the provided sizes match
        if (sizes) {
            const sizeArray = Array.isArray(sizes) ? sizes : [sizes];
            filter.sizes = { $in: sizeArray };
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Build sort object
        let sort: any = {};
        if (sortBy === 'price') {
            sort.salePrice = sortOrder === 'asc' ? 1 : -1;
        } else if (sortBy === 'title') {
            sort.title = sortOrder === 'asc' ? 1 : -1;
        } else {
            sort.createdAt = sortOrder === 'asc' ? 1 : -1;
        }

        // Execute query
        const [rugs, total] = await Promise.all([
            Rug.find(filter).sort(sort).skip(skip).limit(limit).lean(),
            Rug.countDocuments(filter),
        ]);

        const pages = Math.ceil(total / limit);

        reply.status(200).send({
            success: true,
            rugs,
            pagination: {
                page,
                limit,
                total,
                pages,
            },
        });
    } catch (error: any) {
        console.error('Error getting all rugs:', error.message);
        reply.status(500).send({
            success: false,
            message: 'Failed to fetch rugs',
        });
    }
}

/**
 * Get all rugs for admin (includes inactive)
 */
export async function getAllRugsAdmin(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    try {
        const query = request.query as RugQuery;
        const {
            category,
            brand,
            isOnSale,
            isBestSeller,
            isActive,
            colors,
            sizes,
            page = 1,
            limit = 20,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = query;

        // Build filter query
        const filter: any = {};

        if (category) {
            filter.category = category;
        }
        if (brand) {
            filter.brand = brand;
        }
        if (isOnSale !== undefined) {
            filter.isOnSale = isOnSale;
        }
        if (isBestSeller !== undefined) {
            filter.isBestSeller = isBestSeller;
        }
        if (isActive !== undefined) {
            filter.isActive = isActive;
        }

        // Colors filter - check if any of the provided colors match
        if (colors) {
            const colorArray = Array.isArray(colors) ? colors : [colors];
            filter.colors = { $in: colorArray };
        }

        // Sizes filter - check if any of the provided sizes match
        if (sizes) {
            const sizeArray = Array.isArray(sizes) ? sizes : [sizes];
            filter.sizes = { $in: sizeArray };
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Build sort object
        let sort: any = {};
        if (sortBy === 'price') {
            sort.salePrice = sortOrder === 'asc' ? 1 : -1;
        } else if (sortBy === 'title') {
            sort.title = sortOrder === 'asc' ? 1 : -1;
        } else {
            sort.createdAt = sortOrder === 'asc' ? 1 : -1;
        }

        // Execute query
        const [rugs, total] = await Promise.all([
            Rug.find(filter).sort(sort).skip(skip).limit(limit).lean(),
            Rug.countDocuments(filter),
        ]);

        const pages = Math.ceil(total / limit);

        reply.status(200).send({
            success: true,
            rugs,
            pagination: {
                page,
                limit,
                total,
                pages,
            },
        });
    } catch (error: any) {
        console.error('Error getting all rugs for admin:', error.message);
        reply.status(500).send({
            success: false,
            message: 'Failed to fetch rugs',
        });
    }
}

/**
 * Get rug by ID (Public endpoint)
 */
export async function getRugById(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    try {
        const params = request.params as RugParams;
        const { id } = params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return reply.status(400).send({
                success: false,
                message: 'Invalid rug ID',
            });
        }

        const rug = await Rug.findById(id).lean();

        if (!rug) {
            return reply.status(404).send({
                success: false,
                message: 'Rug not found',
            });
        }

        // Check if rug is active (public can only see active rugs)
        if (!rug.isActive) {
            return reply.status(404).send({
                success: false,
                message: 'Rug not found',
            });
        }

        reply.status(200).send({
            success: true,
            rug,
        });
    } catch (error: any) {
        console.error('Error getting rug by ID:', error.message);
        reply.status(500).send({
            success: false,
            message: 'Failed to fetch rug',
        });
    }
}

/**
 * Create rug (Admin only)
 */
export async function createRug(
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

        const body = request.body as CreateRugBody;
        const {
            title,
            brand,
            description = '',
            images,
            category,
            originalPrice,
            discountPercent,
            colors = [],
            sizes = [],
            isOnSale = false,
            isBestSeller = false,
            stock = 0,
            isActive = true,
        } = body;

        // Validate original price
        if (!originalPrice || originalPrice <= 0) {
            return reply.status(400).send({
                success: false,
                message: 'Valid original price is required',
            });
        }

        // Validate discount percent
        if (discountPercent < 0 || discountPercent > 100) {
            return reply.status(400).send({
                success: false,
                message: 'Discount percent must be between 0 and 100',
            });
        }

        // Validate images array
        if (!images || images.length === 0 || images.length > 5) {
            return reply.status(400).send({
                success: false,
                message: 'Please provide 1-5 image URLs',
            });
        }

        // Validate image URLs format (must be S3 URLs)
        for (const imageUrl of images) {
            if (!imageUrl || typeof imageUrl !== 'string') {
                return reply.status(400).send({
                    success: false,
                    message: 'Invalid image URL format. Images must be uploaded via /upload/image endpoint first.',
                });
            }
            
            // Check if it's a valid S3 URL
            if (!imageUrl.startsWith('https://') && !imageUrl.startsWith('http://')) {
                return reply.status(400).send({
                    success: false,
                    message: 'Invalid image URL format. Images must be valid S3 URLs.',
                });
            }
        }

        // Calculate sale price from original price and discount percent
        const salePrice = calculateSalePrice(originalPrice, discountPercent);

        // Validate stock
        if (stock !== undefined && (typeof stock !== 'number' || stock < 0)) {
            return reply.status(400).send({
                success: false,
                message: 'Stock must be a non-negative number',
            });
        }

        // Create rug
        const rug = await Rug.create({
            title,
            brand,
            description,
            images,
            category,
            originalPrice,
            salePrice,
            discountPercent,
            colors,
            sizes,
            isOnSale: isOnSale,
            isBestSeller: isBestSeller,
            stock,
            createdBy: authRequest.user.id,
            isActive,
        });

        reply.status(201).send({
            success: true,
            message: 'Rug created successfully',
            rug,
        });
    } catch (error: any) {
        console.error('Error creating rug:', error.message);

        // Handle specific MongoDB errors
        if (error.name === 'ValidationError') {
            return reply.status(400).send({
                success: false,
                message: 'Validation error: ' + Object.values(error.errors).map((e: any) => e.message).join(', '),
            });
        }

        reply.status(500).send({
            success: false,
            message: 'Failed to create rug',
        });
    }
}

/**
 * Update rug (Admin only)
 */
export async function updateRug(
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

        const params = request.params as RugParams;
        const { id } = params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return reply.status(400).send({
                success: false,
                message: 'Invalid rug ID',
            });
        }

        const rug = await Rug.findById(id);

        if (!rug) {
            return reply.status(404).send({
                success: false,
                message: 'Rug not found',
            });
        }

        const body = request.body as UpdateRugBody;
        const updateData: any = {};

        // Handle images update - replace old images with new ones
        if (body.images) {
            // Validate images array
            if (body.images.length === 0 || body.images.length > 5) {
                return reply.status(400).send({
                    success: false,
                    message: 'Please provide 1-5 image URLs',
                });
            }

            // Validate image URLs format (must be S3 URLs)
            for (const imageUrl of body.images) {
                if (!imageUrl || typeof imageUrl !== 'string') {
                    return reply.status(400).send({
                        success: false,
                        message: 'Invalid image URL format. Images must be uploaded via /upload/image endpoint first.',
                    });
                }
                
                // Check if it's a valid S3 URL
                if (!imageUrl.startsWith('https://') && !imageUrl.startsWith('http://')) {
                    return reply.status(400).send({
                        success: false,
                        message: 'Invalid image URL format. Images must be valid S3 URLs.',
                    });
                }
            }

            updateData.images = body.images;
        }

        // Handle price and discount updates
        let salePrice = rug.salePrice;
        if (body.originalPrice !== undefined || body.discountPercent !== undefined) {
            const originalPrice = body.originalPrice !== undefined
                ? body.originalPrice
                : rug.originalPrice;

            const discountPercent = body.discountPercent !== undefined
                ? body.discountPercent
                : rug.discountPercent;

            // Validate
            if (originalPrice <= 0) {
                return reply.status(400).send({
                    success: false,
                    message: 'Valid original price is required',
                });
            }

            if (discountPercent < 0 || discountPercent > 100) {
                return reply.status(400).send({
                    success: false,
                    message: 'Discount percent must be between 0 and 100',
                });
            }

            updateData.originalPrice = originalPrice;
            updateData.discountPercent = discountPercent;
            salePrice = calculateSalePrice(originalPrice, discountPercent);
            updateData.salePrice = salePrice;
            // Auto-set isOnSale based on discount if provided, otherwise keep it as is
            updateData.isOnSale = body.isOnSale || false;
        }

        // Handle other fields
        if (body.title !== undefined) updateData.title = body.title;
        if (body.brand !== undefined) updateData.brand = body.brand;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.category !== undefined) updateData.category = body.category;
        if (body.colors !== undefined) updateData.colors = body.colors;
        if (body.sizes !== undefined) updateData.sizes = body.sizes;

        // Handle stock update
        if (body.stock !== undefined) {
            if (typeof body.stock !== 'number' || body.stock < 0) {
                return reply.status(400).send({
                    success: false,
                    message: 'Stock must be a non-negative number',
                });
            }
            updateData.stock = body.stock;
        }

        // Only set isOnSale if discountPercent is NOT being updated (to avoid conflict)
        if (body.isOnSale !== undefined && body.originalPrice === undefined && body.discountPercent === undefined) {
            updateData.isOnSale = body.isOnSale;
        }

        if (body.isBestSeller !== undefined) updateData.isBestSeller = body.isBestSeller;
        if (body.isActive !== undefined) updateData.isActive = body.isActive;

        // Update rug
        try {
            const updatedRug = await Rug.findByIdAndUpdate(id, updateData, {
                new: true,
                runValidators: true,
            });

            reply.status(200).send({
                success: true,
                message: 'Rug updated successfully',
                rug: updatedRug,
            });
        } catch (dbError: any) {
            console.error('Error saving rug update to database:', dbError.message);

            // Handle specific MongoDB errors
            if (dbError.name === 'ValidationError') {
                return reply.status(400).send({
                    success: false,
                    message: 'Validation error: ' + Object.values(dbError.errors).map((e: any) => e.message).join(', '),
                });
            }

            throw dbError; // Re-throw to be caught by outer catch
        }
    } catch (error: any) {
        console.error('Error updating rug:', error.message);
        reply.status(500).send({
            success: false,
            message: 'Failed to update rug',
        });
    }
}

/**
 * Delete rug (Admin only)
 */
export async function deleteRug(
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

        const params = request.params as RugParams;
        const { id } = params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return reply.status(400).send({
                success: false,
                message: 'Invalid rug ID',
            });
        }

        const rug = await Rug.findById(id);

        if (!rug) {
            return reply.status(404).send({
                success: false,
                message: 'Rug not found',
            });
        }

        // Delete associated images (S3 or local)
        if (rug.images && rug.images.length > 0) {
            await deleteImages(rug.images);
        }

        // Delete rug from database
        await Rug.findByIdAndDelete(id);

        reply.status(200).send({
            success: true,
            message: 'Rug deleted successfully',
        });
    } catch (error: any) {
        console.error('Error deleting rug:', error.message);
        reply.status(500).send({
            success: false,
            message: 'Failed to delete rug',
        });
    }
}


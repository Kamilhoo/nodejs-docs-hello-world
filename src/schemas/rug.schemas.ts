import { FastifySchema } from 'fastify';

// Base64 image schema
const base64ImageSchema = {
  type: 'object',
  properties: {
    data: {
      type: 'string',
      description: 'Base64 encoded image data',
    },
    mimeType: {
      type: 'string',
      description: 'Optional mime type (e.g., image/jpeg, image/png)',
    },
  },
  required: ['data'],
};

// Create rug schema
export const createRugSchema: FastifySchema = {
  headers: {
    type: 'object',
    required: ['authorization'],
    properties: {
      authorization: {
        type: 'string',
        description: 'Bearer token',
      },
    },
  },
  body: {
    type: 'object',
    required: ['title', 'brand', 'category', 'images', 'originalPrice', 'discountPercent'],
    properties: {
      title: {
        type: 'string',
        minLength: 1,
        maxLength: 200,
        description: 'Rug title',
      },
      brand: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        description: 'Brand name',
      },
      description: {
        type: 'string',
        maxLength: 2000,
        default: '',
        description: 'Rug description',
      },
      images: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        maxItems: 5,
        description: 'Array of image URLs from /upload/image endpoint (max 5)',
      },
      category: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        description: 'Category name',
      },
      originalPrice: {
        type: 'number',
        minimum: 0,
        description: 'Original price in rupees',
      },
      discountPercent: {
        type: 'number',
        minimum: 0,
        maximum: 100,
        description: 'Discount percentage (0-100)',
      },
      colors: {
        type: 'array',
        items: { type: 'string' },
        default: [],
        description: 'Array of color hex codes',
      },
      sizes: {
        type: 'array',
        items: { type: 'string' },
        default: [],
        description: 'Array of sizes (e.g., ["5x8", "8x10"])',
      },
      isOnSale: {
        type: 'boolean',
        default: false,
        description: 'Whether rug is on sale',
      },
      isBestSeller: {
        type: 'boolean',
        default: false,
        description: 'Whether rug is a bestseller',
      },
      stock: {
        type: 'number',
        minimum: 0,
        default: 0,
        description: 'Stock availability',
      },
      isActive: {
        type: 'boolean',
        default: true,
        description: 'Whether rug is active/visible',
      },
    },
    additionalProperties: false,
  },
  response: {
    201: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        rug: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            brand: { type: 'string' },
            description: { type: 'string' },
            images: { type: 'array', items: { type: 'string' } },
            category: { type: 'string' },
            originalPrice: { type: 'number' },
            salePrice: { type: 'number' },
            discountPercent: { type: 'number' },
            colors: { type: 'array', items: { type: 'string' } },
            sizes: { type: 'array', items: { type: 'string' } },
            isOnSale: { type: 'boolean' },
            isBestSeller: { type: 'boolean' },
            stock: { type: 'number' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    400: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
    401: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
    403: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
    500: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  },
};

// Update rug schema
export const updateRugSchema: FastifySchema = {
  headers: {
    type: 'object',
    required: ['authorization'],
    properties: {
      authorization: {
        type: 'string',
        description: 'Bearer token',
      },
    },
  },
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        description: 'Rug ID',
      },
    },
  },
  body: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        minLength: 1,
        maxLength: 200,
        description: 'Rug title',
      },
      brand: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        description: 'Brand name',
      },
      description: {
        type: 'string',
        maxLength: 2000,
        description: 'Rug description',
      },
      images: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        maxItems: 5,
        description: 'Array of image URLs from /upload/image endpoint (max 5) - replaces all existing images',
      },
      category: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        description: 'Category name',
      },
      originalPrice: {
        type: 'number',
        minimum: 0,
        description: 'Original price in rupees',
      },
      discountPercent: {
        type: 'number',
        minimum: 0,
        maximum: 100,
        description: 'Discount percentage (0-100)',
      },
      colors: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of color hex codes',
      },
      sizes: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of sizes (e.g., ["5x8", "8x10"])',
      },
      isOnSale: {
        type: 'boolean',
        description: 'Whether rug is on sale',
      },
      isBestSeller: {
        type: 'boolean',
        description: 'Whether rug is a bestseller',
      },
      stock: {
        type: 'number',
        minimum: 0,
        description: 'Stock availability',
      },
      isActive: {
        type: 'boolean',
        description: 'Whether rug is active/visible',
      },
    },
    minProperties: 1,
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        rug: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            brand: { type: 'string' },
            description: { type: 'string' },
            images: { type: 'array', items: { type: 'string' } },
            category: { type: 'string' },
            originalPrice: { type: 'number' },
            salePrice: { type: 'number' },
            discountPercent: { type: 'number' },
            colors: { type: 'array', items: { type: 'string' } },
            sizes: { type: 'array', items: { type: 'string' } },
            isOnSale: { type: 'boolean' },
            isBestSeller: { type: 'boolean' },
            stock: { type: 'number' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    400: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
    401: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
    403: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
    404: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
    500: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  },
};

// Get rug by ID schema (public)
export const getRugSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        description: 'Rug ID',
      },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        rug: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            brand: { type: 'string' },
            description: { type: 'string' },
            images: { type: 'array', items: { type: 'string' } },
            category: { type: 'string' },
            originalPrice: { type: 'number' },
            salePrice: { type: 'number' },
            discountPercent: { type: 'number' },
            colors: { type: 'array', items: { type: 'string' } },
            sizes: { type: 'array', items: { type: 'string' } },
            isOnSale: { type: 'boolean' },
            isBestSeller: { type: 'boolean' },
            stock: { type: 'number' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    404: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
    500: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  },
};

// Get all rugs schema (public with filters)
export const getAllRugsSchema: FastifySchema = {
  querystring: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        description: 'Filter by category',
      },
      brand: {
        type: 'string',
        description: 'Filter by brand',
      },
      isOnSale: {
        type: 'boolean',
        description: 'Filter by sale status',
      },
      isBestSeller: {
        type: 'boolean',
        description: 'Filter by bestseller status',
      },
      minPrice: {
        type: 'number',
        minimum: 0,
        description: 'Minimum price filter',
      },
      maxPrice: {
        type: 'number',
        minimum: 0,
        description: 'Maximum price filter',
      },
      color: {
        anyOf: [
          { type: 'string' },
          { type: 'array', items: { type: 'string' } },
          { type: 'object' }, // Fastify-qs might parse as object in some cases
        ],
        description: 'Filter by color (supports color[] notation via fastify-qs)',
      },
      'color[]': {
        anyOf: [
          { type: 'string' },
          { type: 'array', items: { type: 'string' } },
          { type: 'object' },
        ],
        description: 'Filter by color[] (array notation, parsed by fastify-qs to color)',
      },
      colors: {
        anyOf: [
          { type: 'string' },
          { type: 'array', items: { type: 'string' } },
          { type: 'object' }, // Fastify-qs might parse as object in some cases
        ],
        description: 'Filter by colors (single color or array of colors, supports colors[] notation)',
      },
      'colors[]': {
        anyOf: [
          { type: 'string' },
          { type: 'array', items: { type: 'string' } },
          { type: 'object' },
        ],
        description: 'Filter by colors[] (array notation, will be parsed by fastify-qs)',
      },
      sizes: {
        anyOf: [
          { type: 'string' },
          { type: 'array', items: { type: 'string' } },
          { type: 'object' }, // Fastify-qs might parse as object in some cases
        ],
        description: 'Filter by sizes (single size or array of sizes, supports sizes[] notation)',
      },
      'sizes[]': {
        anyOf: [
          { type: 'string' },
          { type: 'array', items: { type: 'string' } },
          { type: 'object' },
        ],
        description: 'Filter by sizes[] (array notation, will be parsed by fastify-qs)',
      },
      page: {
        type: 'integer',
        minimum: 1,
        default: 1,
        description: 'Page number',
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 100,
        default: 20,
        description: 'Items per page',
      },
      sortBy: {
        type: 'string',
        enum: ['createdAt', 'price', 'title'],
        default: 'createdAt',
        description: 'Sort field',
      },
      sortOrder: {
        type: 'string',
        enum: ['asc', 'desc'],
        default: 'desc',
        description: 'Sort order',
      },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        rugs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              title: { type: 'string' },
              brand: { type: 'string' },
              description: { type: 'string' },
              images: { type: 'array', items: { type: 'string' } },
              category: { type: 'string' },
              originalPrice: { type: 'number' },
              salePrice: { type: 'number' },
              discountPercent: { type: 'number' },
              colors: { type: 'array', items: { type: 'string' } },
              sizes: { type: 'array', items: { type: 'string' } },
              isOnSale: { type: 'boolean' },
              isBestSeller: { type: 'boolean' },
              stock: { type: 'number' },
              isActive: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            pages: { type: 'number' },
          },
        },
      },
    },
    500: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  },
};

// Get all rugs for admin schema (includes inactive)
export const getAllRugsAdminSchema: FastifySchema = {
  headers: {
    type: 'object',
    required: ['authorization'],
    properties: {
      authorization: {
        type: 'string',
        description: 'Bearer token',
      },
    },
  },
  querystring: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        description: 'Filter by category',
      },
      brand: {
        type: 'string',
        description: 'Filter by brand',
      },
      isOnSale: {
        type: 'boolean',
        description: 'Filter by sale status',
      },
      isBestSeller: {
        type: 'boolean',
        description: 'Filter by bestseller status',
      },
      isActive: {
        type: 'boolean',
        description: 'Filter by active status',
      },
      color: {
        anyOf: [
          { type: 'string' },
          { type: 'array', items: { type: 'string' } },
          { type: 'object' }, // Fastify-qs might parse as object in some cases
        ],
        description: 'Filter by color (supports color[] notation via fastify-qs)',
      },
      'color[]': {
        anyOf: [
          { type: 'string' },
          { type: 'array', items: { type: 'string' } },
          { type: 'object' },
        ],
        description: 'Filter by color[] (array notation, parsed by fastify-qs to color)',
      },
      colors: {
        anyOf: [
          { type: 'string' },
          { type: 'array', items: { type: 'string' } },
          { type: 'object' }, // Fastify-qs might parse as object in some cases
        ],
        description: 'Filter by colors (single color or array of colors, supports colors[] notation)',
      },
      'colors[]': {
        anyOf: [
          { type: 'string' },
          { type: 'array', items: { type: 'string' } },
          { type: 'object' },
        ],
        description: 'Filter by colors[] (array notation, will be parsed by fastify-qs)',
      },
      sizes: {
        anyOf: [
          { type: 'string' },
          { type: 'array', items: { type: 'string' } },
          { type: 'object' }, // Fastify-qs might parse as object in some cases
        ],
        description: 'Filter by sizes (single size or array of sizes, supports sizes[] notation)',
      },
      'sizes[]': {
        anyOf: [
          { type: 'string' },
          { type: 'array', items: { type: 'string' } },
          { type: 'object' },
        ],
        description: 'Filter by sizes[] (array notation, will be parsed by fastify-qs)',
      },
      page: {
        type: 'integer',
        minimum: 1,
        default: 1,
        description: 'Page number',
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 100,
        default: 20,
        description: 'Items per page',
      },
      sortBy: {
        type: 'string',
        enum: ['createdAt', 'salePrice', 'title'],
        default: 'createdAt',
        description: 'Sort field',
      },
      sortOrder: {
        type: 'string',
        enum: ['asc', 'desc'],
        default: 'desc',
        description: 'Sort order',
      },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        rugs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              brand: { type: 'string' },
              description: { type: 'string' },
              images: { type: 'array', items: { type: 'string' } },
              category: { type: 'string' },
              originalPrice: { type: 'number' },
              salePrice: { type: 'number' },
              discountPercent: { type: 'number' },
              colors: { type: 'array', items: { type: 'string' } },
              sizes: { type: 'array', items: { type: 'string' } },
              isOnSale: { type: 'boolean' },
              isBestSeller: { type: 'boolean' },
              stock: { type: 'number' },
              isActive: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            pages: { type: 'number' },
          },
        },
      },
    },
    401: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
    403: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
    500: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  },
};

// Delete rug schema (admin only)
export const deleteRugSchema: FastifySchema = {
  headers: {
    type: 'object',
    required: ['authorization'],
    properties: {
      authorization: {
        type: 'string',
        description: 'Bearer token',
      },
    },
  },
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        description: 'Rug ID',
      },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
    401: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
    403: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
    404: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
    500: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  },
};


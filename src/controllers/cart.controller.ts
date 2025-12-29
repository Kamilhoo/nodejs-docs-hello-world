import { FastifyReply } from 'fastify';
import mongoose from 'mongoose';
import { AuthRequest } from '../types';
import { Cart, CartDocument } from '../models/cart.model';
import { Rug } from '../models/rug.model';
import { getCurrentPrice } from '../utils/price.util';

interface AddToCartBody {
  productId: string;
  quantity: number;
  size?: string;
}

interface UpdateCartItemParams {
  cartItemId: string;
}

interface UpdateCartItemBody {
  quantity: number;
}

interface DeleteCartItemParams {
  cartItemId: string;
}

const isValidObjectId = (id: string): boolean => mongoose.Types.ObjectId.isValid(id);

/**
 * Generate unique cart item ID
 */
function generateCartItemId(): string {
  return `cart_item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate total price for cart using single query
 */
async function calculateTotalPrice(cart: CartDocument): Promise<number> {
  if (!cart.products || cart.products.length === 0) {
    return 0;
  }

  // Get all unique product IDs
  const productIds = cart.products.map(item => item.productId);
  
  // Fetch all products in single query
  const products = await Rug.find({ _id: { $in: productIds } })
    .select('_id originalPrice salePrice discountPercent isOnSale isActive')
    .lean();

  // Create a map for quick lookup
  const productMap = new Map<string, any>();
  products.forEach(p => {
    if (p.isActive) {
      productMap.set(p._id.toString(), p);
    }
  });

  // Calculate total
  let total = 0;
  for (const item of cart.products) {
    const product = productMap.get(item.productId.toString());
    if (product) {
      const price = getCurrentPrice(product);
      total += price * item.quantity;
    }
  }

  return total;
}

/**
 * Format cart response with product details using single query
 */
async function formatCartResponse(cart: CartDocument) {
  if (!cart.products || cart.products.length === 0) {
    return {
      id: (cart._id as mongoose.Types.ObjectId).toString(),
      sessionId: cart.sessionId,
      products: [],
      totalPrice: cart.totalPrice,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }

  // Get all unique product IDs
  const productIds = cart.products.map(item => item.productId);
  
  // Fetch all products in single query
  const products = await Rug.find({ _id: { $in: productIds } })
    .select('_id title images originalPrice salePrice discountPercent isOnSale isActive stock')
    .lean();

  // Create a map for quick lookup
  const productMap = new Map<string, any>();
  products.forEach(p => {
    productMap.set(p._id.toString(), p);
  });

  // Build response array without map
  const productsWithDetails = [];
  for (const item of cart.products) {
    const product = productMap.get(item.productId.toString());
    
    if (!product || !product.isActive) {
      productsWithDetails.push({
        id: item.id,
        productId: item.productId.toString(),
        quantity: item.quantity,
        size: item.size || null,
        available: false,
        product: null,
        stock: 0,
      });
    } else {
      const price = getCurrentPrice(product);
      productsWithDetails.push({
        id: item.id,
        productId: item.productId.toString(),
        quantity: item.quantity,
        size: item.size || null,
        available: true,
        stock: product.stock || 0,
        product: {
          id: product._id.toString(),
          title: product.title,
          images: product.images && product.images.length > 0 ? [product.images[0]] : null,
          originalPrice: product.originalPrice,
          salePrice: product.salePrice,
          isOnSale: product.isOnSale,
          currentPrice: price,
        },
      });
    }
  }

  return {
    id: (cart._id as mongoose.Types.ObjectId).toString(),
    sessionId: cart.sessionId,
    products: productsWithDetails,
    totalPrice: cart.totalPrice,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
}

/**
 * GET /api/cart - Get cart by sessionId
 */
export const getCart = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    const sessionId = request.sessionId;

    if (!sessionId) {
      return reply.status(400).send({
        success: false,
        message: 'Invalid sessionId',
      });
    }

    // Find cart directly (without lean) to work with document
    // Select only required fields
    const cartDoc = await Cart.findOne({ sessionId }).select('sessionId products totalPrice createdAt updatedAt');

    // If cart doesn't exist, return empty cart structure
    if (!cartDoc) {
      return reply.status(200).send({
        success: true,
        cart: {
          sessionId,
          products: [],
          totalPrice: 0,
        },
      });
    }

    // Remove unavailable products using single query
    if (cartDoc.products && cartDoc.products.length > 0) {
      const productIds = cartDoc.products.map(item => item.productId);
      
      // Fetch all products in single query
      const products = await Rug.find({ _id: { $in: productIds } })
        .select('_id isActive')
        .lean();

      // Create a map for quick lookup
      const productMap = new Map<string, boolean>();
      products.forEach(p => {
        if (p.isActive) {
          productMap.set(p._id.toString(), true);
        }
      });

      // Filter available products
      const availableProducts = [];
      for (const item of cartDoc.products) {
        if (productMap.has(item.productId.toString())) {
          availableProducts.push(item);
        }
      }
      
      // Update cart with only available products
      cartDoc.products = availableProducts;
    }
    
    // Recalculate total price
    const totalPrice = await calculateTotalPrice(cartDoc);
    cartDoc.totalPrice = totalPrice;
    await cartDoc.save();

    // Format and return response
    const formattedCart = await formatCartResponse(cartDoc);

    return reply.status(200).send({
      success: true,
      cart: formattedCart,
    });
  } catch (error: any) {
    console.error('Error getting cart:', error);
    return reply.status(500).send({
      success: false,
      message: 'Failed to fetch cart',
    });
  }
};

/**
 * POST /api/cart - Add product to cart
 */
export const addToCart = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    const sessionId = request.sessionId;

    if (!sessionId) {
      return reply.status(400).send({
        success: false,
        message: 'Invalid sessionId',
      });
    }

    const { productId, quantity, size } = request.body as AddToCartBody;

    // Validate required fields
    if (!productId) {
      return reply.status(400).send({
        success: false,
        message: 'Product ID is required',
      });
    }

    if (!isValidObjectId(productId)) {
      return reply.status(400).send({
        success: false,
        message: 'Invalid product ID',
      });
    }

    if (typeof quantity !== 'number' || quantity < 1 || quantity > 1000) {
      return reply.status(400).send({
        success: false,
        message: 'Quantity must be between 1 and 1000',
      });
    }

    // Check if product exists and is active
    // Select only required fields
    const product = await Rug.findById(productId)
      .select('isActive sizes stock')
      .lean();

    if (!product) {
      return reply.status(404).send({
        success: false,
        message: 'Product not found',
      });
    }

    if (!product.isActive) {
      return reply.status(400).send({
        success: false,
        message: 'Product is not available',
      });
    }

    // Check stock availability
    if (product.stock === undefined || product.stock < 0) {
      return reply.status(400).send({
        success: false,
        message: 'Product stock information is not available',
      });
    }
    
    // Validate size if provided
    const normalizedSize = size && size.trim().length > 0 ? size.trim() : undefined;

    if (normalizedSize) {
      if (!product.sizes || product.sizes.length === 0) {
        return reply.status(400).send({
          success: false,
          message: 'Selected product does not have size options',
        });
      }

      if (!product.sizes.includes(normalizedSize)) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid size for the selected product',
        });
      }
    }

    // Find or create cart
    // Select only required fields
    let cart = await Cart.findOne({ sessionId }).select('sessionId products totalPrice createdAt updatedAt');

    if (!cart) {
      cart = await Cart.create({
        sessionId,
        products: [],
        totalPrice: 0,
      });
    }

    // Calculate total quantity of same productId in cart (single loop - efficient)
    let existingTotalQty = 0;
    let existingItemIndex = -1;
    for (let i = 0; i < cart.products.length; i++) {
      if (cart.products[i].productId.toString() === productId) {
        existingTotalQty += cart.products[i].quantity;
        if (cart.products[i].size === normalizedSize) {
          existingItemIndex = i;
        }
      }
    }

    // Calculate new total quantity
    let newTotalQty: number;
    if (existingItemIndex !== -1) {
      const newQuantity = cart.products[existingItemIndex].quantity + quantity;
      if (newQuantity > 1000) {
        return reply.status(400).send({
          success: false,
          message: 'Total quantity cannot exceed 1000',
        });
      }
      newTotalQty = existingTotalQty - cart.products[existingItemIndex].quantity + newQuantity;
    } else {
      newTotalQty = existingTotalQty + quantity;
    }

    // Check stock availability (total quantity for this productId across all sizes)
    if (newTotalQty > product.stock) {
      return reply.status(400).send({
        success: false,
        message: `Insufficient stock. Only ${product.stock} items available.`,
      });
    }

    // Update or add item after stock validation
    if (existingItemIndex !== -1) {
      cart.products[existingItemIndex].quantity = cart.products[existingItemIndex].quantity + quantity;
    } else {
      // Add new product with generated cart item ID
      const cartItemId = generateCartItemId();
      cart.products.push({
        id: cartItemId,
        productId: new mongoose.Types.ObjectId(productId),
        quantity,
        size: normalizedSize,
      });
    }

    // Recalculate total price
    const totalPrice = await calculateTotalPrice(cart);
    cart.totalPrice = totalPrice;
    await cart.save();

    // Return only message for create API
    return reply.status(200).send({
      success: true,
      message: 'Product added to cart successfully',
    });
  } catch (error: any) {
    console.error('Error adding to cart:', error);
    return reply.status(500).send({
      success: false,
      message: 'Failed to add product to cart',
    });
  }
};

/**
 * PUT /api/cart/item/:cartItemId - Update cart item quantity
 */
export const updateCartItem = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    const sessionId = request.sessionId;

    if (!sessionId) {
      return reply.status(400).send({
        success: false,
        message: 'Invalid sessionId',
      });
    }

    const { cartItemId } = request.params as UpdateCartItemParams;
    const { quantity } = request.body as UpdateCartItemBody;

    if (!cartItemId) {
      return reply.status(400).send({
        success: false,
        message: 'Cart item ID is required',
      });
    }

    if (typeof quantity !== 'number' || quantity < 1 || quantity > 1000) {
      return reply.status(400).send({
        success: false,
        message: 'Quantity must be between 1 and 1000',
      });
    }

    // Select only required fields
    const cart = await Cart.findOne({ sessionId }).select('sessionId products totalPrice createdAt updatedAt');

    if (!cart) {
      return reply.status(404).send({
        success: false,
        message: 'Cart not found',
      });
    }

    // Find cart item by cartItemId
    const itemIndex = cart.products.findIndex((item) => item.id === cartItemId);

    if (itemIndex === -1) {
      return reply.status(404).send({
        success: false,
        message: 'Cart item not found',
      });
    }

    // Validate that the product still exists and is active
    const cartItem = cart.products[itemIndex];
    // Select only required fields
    const product = await Rug.findById(cartItem.productId)
      .select('isActive stock')
      .lean();

    let itemRemoved = false;
    if (!product) {
      // Product was deleted, remove item from cart
      cart.products.splice(itemIndex, 1);
      itemRemoved = true;
    } else if (!product.isActive) {
      // Product is inactive, remove item from cart
      cart.products.splice(itemIndex, 1);
      itemRemoved = true;
    } else {
      // Check stock availability
      if (product.stock === undefined || product.stock < 0) {
        return reply.status(400).send({
          success: false,
          message: 'Product stock information is not available',
        });
      }
      
      // Check if requested quantity exceeds stock
      if (quantity > product.stock) {
        return reply.status(400).send({
          success: false,
          message: `Insufficient stock. Only ${product.stock} items available.`,
        });
      }
      
      // Product is valid, update quantity
      cart.products[itemIndex].quantity = quantity;
    }

    // Recalculate total price
    const totalPrice = await calculateTotalPrice(cart);
    cart.totalPrice = totalPrice;
    await cart.save();

    // Format and return response
    const formattedCart = await formatCartResponse(cart);

    return reply.status(200).send({
      success: true,
      message: itemRemoved 
        ? 'Cart item removed (product no longer available)' 
        : 'Cart item updated',
      cart: formattedCart,
    });
  } catch (error: any) {
    console.error('Error updating cart item:', error);
    return reply.status(500).send({
      success: false,
      message: 'Failed to update cart item',
    });
  }
};

/**
 * DELETE /api/cart/item/:cartItemId - Remove cart item
 */
export const removeCartItem = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    const sessionId = request.sessionId;

    if (!sessionId) {
      return reply.status(400).send({
        success: false,
        message: 'Invalid sessionId',
      });
    }

    const { cartItemId } = request.params as DeleteCartItemParams;

    if (!cartItemId) {
      return reply.status(400).send({
        success: false,
        message: 'Cart item ID is required',
      });
    }

    // Select only required fields
    const cart = await Cart.findOne({ sessionId }).select('sessionId products totalPrice createdAt updatedAt');

    if (!cart) {
      return reply.status(404).send({
        success: false,
        message: 'Cart not found',
      });
    }

    // Find cart item by cartItemId
    const itemIndex = cart.products.findIndex((item) => item.id === cartItemId);

    if (itemIndex === -1) {
      return reply.status(404).send({
        success: false,
        message: 'Cart item not found',
      });
    }

    // Remove item from products array
    cart.products.splice(itemIndex, 1);

    // Recalculate total price
    const totalPrice = await calculateTotalPrice(cart);
    cart.totalPrice = totalPrice;
    await cart.save();

    // Format and return response
    const formattedCart = await formatCartResponse(cart);

    return reply.status(200).send({
      success: true,
      message: 'Item removed from cart',
      cart: formattedCart,
    });
  } catch (error: any) {
    console.error('Error removing cart item:', error);
    return reply.status(500).send({
      success: false,
      message: 'Failed to remove cart item',
    });
  }
};

/**
 * DELETE /api/cart - Clear entire cart
 */
export const clearCart = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    const sessionId = request.sessionId;

    if (!sessionId) {
      return reply.status(400).send({
        success: false,
        message: 'Invalid sessionId',
      });
    }

    // Delete cart directly by sessionId
    const result = await Cart.deleteOne({ sessionId });

    if (result.deletedCount === 0) {
      return reply.status(404).send({
        success: false,
        message: 'Cart not found',
      });
    }

    return reply.status(200).send({
      success: true,
      message: 'Cart cleared successfully',
      cart: {
        sessionId,
        products: [],
        totalPrice: 0,
      },
    });
  } catch (error: any) {
    console.error('Error clearing cart:', error);
    return reply.status(500).send({
      success: false,
      message: 'Failed to clear cart',
    });
  }
};


import { FastifyReply } from 'fastify';
import mongoose from 'mongoose';
import { AuthRequest } from '../types';
import { Order, ORDER_STATUS_VALUES, PAYMENT_METHOD_VALUES, OrderStatus, OrderItem, OrderDocument } from '../models/order.model';
import { Rug } from '../models/rug.model';
import { getCurrentPrice } from '../utils/price.util';
import { calculateShippingFee } from '../utils/shippingFee.util';
import { sendOrderDeliveredEmail, sendOrderConfirmationEmail } from '../services/email.service';

interface OrderItemInput {
  productId: string;
  quantity: number;
  size?: string;
}

interface CreateOrderBody {
  email: string;
  username: string;
  phoneNumber?: string;
  // Always send products in items[] (even for single product)
  items: OrderItemInput[];
  // Address info
  address?: string;
  country?: string;
  city?: string;
  postalCode?: string;
}

interface CancelOrderParams {
  id: string;
}

interface CancelOrderBody {
  cancelReason?: string;
}

interface UpdateOrderStatusParams {
  id: string;
}

interface UpdateOrderStatusBody {
  status: 'confirm' | 'failed' | 'cancelled' | 'completed' | 'delivered' | 'refund';
  cancelReason?: string;
  trackingNumber?: string;
}

interface AdminOrdersQuery {
  email?: string;
  status?: 'pending' | 'confirm' | 'failed' | 'cancelled' | 'completed' | 'delivered' | 'refund';
  paymentMethod?: 'online' | 'pay_at_location';
  page?: number;
  limit?: number;
}

const isValidObjectId = (id: string): boolean => mongoose.Types.ObjectId.isValid(id);

export const createOrder = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    const {
      email,
      username,
      phoneNumber,
      items,
      address,
      country,
      city,
      postalCode,
    } = request.body as CreateOrderBody;

    // Validate required fields
    if (!email || !username) {
      return reply.status(400).send({
        success: false,
        message: 'Email and username are required',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return reply.status(400).send({
        success: false,
        message: 'Invalid email format',
      });
    }

    // Normalize items: FE must always send items[] (single or multiple)
    if (!Array.isArray(items) || items.length === 0) {
      return reply.status(400).send({
        success: false,
        message: 'At least one product in items[] is required to create an order',
      });
    }

    const normalizedItems: OrderItemInput[] = items;

    // Basic validation for each item
    for (const item of normalizedItems) {
      if (!item.productId || !isValidObjectId(item.productId)) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid product ID in items',
        });
      }

      if (typeof item.quantity !== 'number' || item.quantity < 1) {
        return reply.status(400).send({
          success: false,
          message: 'Quantity must be at least 1 for all items',
        });
      }
    }

    // Fetch all products in one go
    // Select only required fields including stock
    const productIds = normalizedItems.map((i) => i.productId);
    const products = await Rug.find({ _id: { $in: productIds } })
      .select('_id title images sizes isActive originalPrice salePrice discountPercent isOnSale stock')
      .lean();
    const productMap = new Map<string, any>();
    products.forEach((p) => {
      productMap.set(p._id.toString(), p);
    });

    const orderItems: OrderItem[] = [];
    let totalPrice = 0;

    for (const item of normalizedItems) {
      const product = productMap.get(item.productId);

      if (!product) {
        return reply.status(404).send({
          success: false,
          message: `Product not found for ID: ${item.productId}`,
        });
      }

      if (!product.isActive) {
        return reply.status(400).send({
          success: false,
          message: `Product is not available: ${product.title}`,
        });
      }

      // Check stock availability
      if (product.stock === undefined || product.stock < 0) {
        return reply.status(400).send({
          success: false,
          message: `Product stock information is not available: ${product.title}`,
        });
      }

      if (item.quantity > product.stock) {
        return reply.status(400).send({
          success: false,
          message: `Insufficient stock for "${product.title}". Only ${product.stock} items available.`,
        });
      }

      const normalizedSize =
        typeof item.size === 'string' && item.size.trim().length > 0
          ? item.size.trim()
          : undefined;

      if (normalizedSize) {
        if (!product.sizes || product.sizes.length === 0) {
          return reply.status(400).send({
            success: false,
            message: `Selected product "${product.title}" does not have size options`,
          });
        }

        const isValidSize = product.sizes.includes(normalizedSize);
        if (!isValidSize) {
          return reply.status(400).send({
            success: false,
            message: `Invalid size "${normalizedSize}" for product "${product.title}"`,
          });
        }
      }

      const unitPrice = getCurrentPrice(product);
      const lineTotal = unitPrice * item.quantity;
      totalPrice += lineTotal;

      const images: string[] = Array.isArray(product.images) ? product.images : [];
      const primaryImage = images.length > 0 ? images[0] : '';

      orderItems.push({
        productId: product._id,
        title: product.title,
        image: primaryImage,
        size: normalizedSize,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
      });
    }

    // Default currency for guest checkout
    const currency = 'PKR';

    // Calculate shipping fee based on order amount and country
    const orderCountry = country ? country.trim() : 'Pakistan';
    const shippingFee = await calculateShippingFee(totalPrice, orderCountry);

    // Add shipping fee to totalPrice (totalPrice = items sum + shipping fee)
    const finalTotalPrice = totalPrice + shippingFee;

    // Create order
    const order = await Order.create({
      email: email.toLowerCase().trim(),
      username: username.trim(),
      phoneNumber: phoneNumber ? phoneNumber.trim() : undefined,
      address: address ? address.trim() : undefined,
      country: orderCountry,
      city: city ? city.trim() : undefined,
      postalCode: postalCode ? postalCode.trim() : undefined,
      items: orderItems,
      totalPrice: finalTotalPrice, // totalPrice includes shipping fee
      shippingFee,
      status: 'confirm',
      paymentMethod: 'pay_at_location',
      currency,
    });

    // Update stock for all products in the order (atomic operation using $inc)
    for (const item of normalizedItems) {
      await Rug.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } }, // Decrease stock by order quantity
        { new: true }
      );
    }

    // Send order confirmation email
    try {
      await sendOrderConfirmationEmail({
        orderId: order.id,
        username: order.username,
        email: order.email,
        items: order.items.map((item) => ({
          title: item.title,
          image: item.image,
          size: item.size,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
        })),
        totalPrice: order.totalPrice,
        shippingFee: order.shippingFee,
        currency: order.currency,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
      });
    } catch (emailError: any) {
      // Log email error but don't fail the request
      console.error('Error sending order confirmation email:', emailError);
      // Continue with success response even if email fails
    }

    return reply.status(201).send({
      success: true,
      message: 'Order created successfully',
      order: {
        id: order._id,
        email: order.email,
        username: order.username,
        phoneNumber: order.phoneNumber || null,
        items: order.items.map((item) => ({
          productId: item.productId,
          title: item.title,
          image: item.image,
          size: item.size || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
        })),
        status: order.status,
        paymentMethod: order.paymentMethod,
        totalPrice: order.totalPrice,
        shippingFee: order.shippingFee,
        currency: order.currency,
        createdAt: order.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return reply.status(500).send({
      success: false,
      message: 'Failed to create order',
    });
  }
};

export const getUserOrders = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    const query = request.query as { email?: string };
    const email = query.email;

    if (!email) {
      return reply.status(400).send({
        success: false,
        message: 'Email is required',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return reply.status(400).send({
        success: false,
        message: 'Invalid email format',
      });
    }

    const orders = await Order.find({ email: email.toLowerCase().trim() })
      .sort({ createdAt: -1 })
      .lean();

    const formattedOrders = orders.map((order) => {
      return {
        id: order._id,
        items: (order.items || []).map((item: any) => ({
          productId: item.productId,
          title: item.title,
          image: item.image,
          size: item.size || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
        })),
        totalPrice: order.totalPrice,
        shippingFee: order.shippingFee,
        status: order.status,
        trackingNumber: order.trackingNumber || null,
        createdAt: order.createdAt,
        cancelReason: order.cancelReason || null,
        paymentMethod: order.paymentMethod,
        currency: order.currency,
      };
    });

    return reply.status(200).send({
      success: true,
      orders: formattedOrders,
    });
  } catch (error: any) {
    console.error('Error fetching user orders:', error);
    return reply.status(500).send({
      success: false,
      message: 'Failed to fetch orders',
    });
  }
};

export const cancelOrder = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as CancelOrderParams;
    const query = request.query as { email?: string };
    const email = query.email;
    const body = request.body as CancelOrderBody;
    const cancelReason = body.cancelReason;

    if (!isValidObjectId(id)) {
      return reply.status(400).send({
        success: false,
        message: 'Invalid order ID',
      });
    }

    if (!email) {
      return reply.status(400).send({
        success: false,
        message: 'Email is required',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return reply.status(400).send({
        success: false,
        message: 'Invalid email format',
      });
    }

    // Validate cancel reason if provided
    if (cancelReason !== undefined) {
      const trimmedReason = cancelReason.trim();
      if (trimmedReason.length === 0) {
        return reply.status(400).send({
          success: false,
          message: 'Cancel reason cannot be empty',
        });
      }
      if (trimmedReason.length > 500) {
        return reply.status(400).send({
          success: false,
          message: 'Cancel reason cannot exceed 500 characters',
        });
      }
    }

    const order = await Order.findOne({ _id: id, email: email.toLowerCase().trim() });

    if (!order) {
      return reply.status(404).send({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.status !== 'confirm') {
      return reply.status(400).send({
        success: false,
        message: 'Only confirmed orders can be cancelled',
      });
    }

    order.status = 'cancelled';
    if (cancelReason !== undefined && cancelReason.trim().length > 0) {
      order.cancelReason = cancelReason.trim();
    }
    await order.save();

    return reply.status(200).send({
      success: true,
      message: 'Order cancelled successfully',
      order: {
        id: order._id,
        status: order.status,
        cancelReason: order.cancelReason || null,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Error cancelling order:', error);
    return reply.status(500).send({
      success: false,
      message: 'Failed to cancel order',
    });
  }
};

export const getAllOrdersAdmin = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    const query = request.query as AdminOrdersQuery;
    const filter: Record<string, any> = {};

    // Email filter
    if (query.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(query.email)) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid email filter provided',
        });
      }

      filter.email = query.email.toLowerCase().trim();
    }

    // Status filter - single value only
    if (query.status) {
      if (!ORDER_STATUS_VALUES.includes(query.status as any)) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid status filter provided',
        });
      }

      filter.status = query.status;
    }

    // Payment method filter - single value only
    if (query.paymentMethod) {
      if (!PAYMENT_METHOD_VALUES.includes(query.paymentMethod as any)) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid payment method filter provided',
        });
      }

      filter.paymentMethod = query.paymentMethod;
    }

    // Pagination
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 && query.limit <= 100 ? query.limit : 20;
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    const pages = Math.ceil(total / limit);

    const formattedOrders = orders.map((order) => ({
      id: order._id,
      status: order.status,
      paymentMethod: order.paymentMethod,
      totalPrice: order.totalPrice,
      shippingFee: order.shippingFee,
      currency: order.currency,
      cancelReason: order.cancelReason || null,
      trackingNumber: order.trackingNumber || null,
      createdAt: order.createdAt,
      user: {
        email: order.email || null,
        username: order.username || null,
        country: order.country || null,
        address: order.address || null,
        city: order.city || null,
        postalCode: order.postalCode || null,
        phoneNumber: order.phoneNumber || null,
      },
      items: (order.items || []).map((item: any) => ({
        productId: item.productId,
        title: item.title,
        image: item.image,
        size: item.size || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      })),
    }));

    return reply.status(200).send({
      success: true,
      orders: formattedOrders,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    });
  } catch (error: any) {
    console.error('Error fetching admin orders:', error);
    return reply.status(500).send({
      success: false,
      message: 'Failed to fetch orders',
    });
  }
};

export const updateOrderStatus = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as UpdateOrderStatusParams;
    const { status, cancelReason, trackingNumber } = request.body as UpdateOrderStatusBody;

    if (!isValidObjectId(id)) {
      return reply.status(400).send({
        success: false,
        message: 'Invalid order ID',
      });
    }

    // Valid statuses for update (exclude 'pending' as orders can't be updated to pending)
    const allowedStatuses: OrderStatus[] = ['confirm', 'failed', 'cancelled', 'completed', 'delivered', 'refund'];
    if (!status || !allowedStatuses.includes(status)) {
      return reply.status(400).send({
        success: false,
        message: 'Invalid order status provided. Allowed statuses: confirm, failed, cancelled, completed, delivered, refund',
      });
    }

    const order: OrderDocument | null = await Order.findById(id);

    if (!order) {
      return reply.status(404).send({
        success: false,
        message: 'Order not found',
      });
    }

    // Prevent status change if order is already completed or cancelled
    // Exception: Allow changing to 'refund' even if order is completed
    if ((order.status === 'completed' || order.status === 'cancelled') && status !== 'refund') {
      return reply.status(400).send({
        success: false,
        message: `Cannot change status. Order is already ${order.status}.`,
      });
    }

    // Validate cancel reason if status is being changed to cancelled
    if (status === 'cancelled') {
      if (!cancelReason || cancelReason.trim().length === 0) {
        return reply.status(400).send({
          success: false,
          message: 'Cancel reason is required when cancelling an order',
        });
      }
      if (cancelReason.trim().length > 500) {
        return reply.status(400).send({
          success: false,
          message: 'Cancel reason cannot exceed 500 characters',
        });
      }
      order.cancelReason = cancelReason.trim();
    }

    // Validate tracking number if status is being changed to delivered
    if (status === 'delivered') {
      if (!trackingNumber || trackingNumber.trim().length === 0) {
        return reply.status(400).send({
          success: false,
          message: 'Tracking number is required when marking order as delivered',
        });
      }
      if (trackingNumber.trim().length > 100) {
        return reply.status(400).send({
          success: false,
          message: 'Tracking number cannot exceed 100 characters',
        });
      }
      order.trackingNumber = trackingNumber.trim();
    }

    order.status = status;
    await order.save();

    // Send delivery email if status is changed to delivered
    if (status === 'delivered') {
      try {
        await sendOrderDeliveredEmail({
          orderId: order.id,
          username: order.username,
          email: order.email,
          trackingNumber: order.trackingNumber || '',
          items: order.items.map((item) => ({
            title: item.title,
            image: item.image,
            size: item.size,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
          })),
          totalPrice: order.totalPrice,
          shippingFee: order.shippingFee,
          currency: order.currency,
          paymentMethod: order.paymentMethod,
          address: order.address,
          city: order.city,
          country: order.country,
          postalCode: order.postalCode,
          phoneNumber: order.phoneNumber,
          createdAt: order.createdAt,
        });
      } catch (emailError: any) {
        // Log email error but don't fail the request
        console.error('Error sending delivery email:', emailError);
        // Continue with success response even if email fails
      }
    }

    return reply.status(200).send({
      success: true,
      message: 'Order status updated successfully',
      order: {
        id: order._id,
        status: order.status,
        cancelReason: order.cancelReason || null,
        trackingNumber: order.trackingNumber || null,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return reply.status(500).send({
      success: false,
      message: 'Failed to update order status',
    });
  }
};

export const getOrderByIdAdmin = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as UpdateOrderStatusParams;

    if (!isValidObjectId(id)) {
      return reply.status(400).send({
        success: false,
        message: 'Invalid order ID',
      });
    }

    const order = await Order.findById(id).lean();

    if (!order) {
      return reply.status(404).send({
        success: false,
        message: 'Order not found',
      });
    }

    return reply.status(200).send({
      success: true,
      order: {
        id: order._id,
        status: order.status,
        paymentMethod: order.paymentMethod,
        totalPrice: order.totalPrice,
        shippingFee: order.shippingFee,
        currency: order.currency,
        cancelReason: order.cancelReason || null,
        trackingNumber: order.trackingNumber || null,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        user: {
          email: order.email || null,
          username: order.username || null,
          phoneNumber: order.phoneNumber || null,
          address: order.address || null,
          country: order.country || null,
          city: order.city || null,
          postalCode: order.postalCode || null,
        },
        items: (order.items || []).map((item: any) => ({
          productId: item.productId,
          title: item.title,
          image: item.image,
          size: item.size || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
        })),
      },
    });
  } catch (error: any) {
    console.error('Error fetching order details:', error);
    return reply.status(500).send({
      success: false,
      message: 'Failed to fetch order details',
    });
  }
};



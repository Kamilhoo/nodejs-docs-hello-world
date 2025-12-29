import mongoose, { Schema } from 'mongoose';

export type OrderStatus = 'pending' | 'confirm' | 'failed' | 'cancelled' | 'completed' | 'delivered' | 'refund';
export type PaymentMethod = 'online' | 'pay_at_location';

// Single line item inside a multi‑product order
export interface OrderItem {
  productId: mongoose.Types.ObjectId;
  title: string;
  image: string;
  size?: string;
  quantity: number;
  unitPrice: number; // price at order time
  lineTotal: number; // unitPrice * quantity
}

export interface OrderDocument extends mongoose.Document {
  email: string;
  username: string;
  phoneNumber?: string;
  address?: string;
  country?: string;
  city?: string;
  postalCode?: string;
  items: OrderItem[]; // multiple products per order
  totalPrice: number; // sum of lineTotal
  shippingFee: number; // calculated shipping fee based on order amount and country
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  currency: string;
  cancelReason?: string;
  trackingNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const ORDER_STATUS_VALUES: OrderStatus[] = ['pending', 'confirm', 'failed', 'cancelled', 'completed', 'delivered', 'refund'];
export const PAYMENT_METHOD_VALUES: PaymentMethod[] = ['online', 'pay_at_location'];

// Sub‑schema for items
const orderItemSchema = new Schema<OrderItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Rug',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    image: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    size: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const orderSchema = new Schema<OrderDocument>(
  {
    email: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    address: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    country: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    city: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    postalCode: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      default: [],
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingFee: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ORDER_STATUS_VALUES,
      default: 'confirm',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHOD_VALUES,
      default: 'pay_at_location',
    },
    currency: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
      default: 'PKR',
    },
    cancelReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    trackingNumber: {
      type: String,
      trim: true,
      maxlength: 100,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ email: 1, createdAt: -1 });
// Index to optimize analytics queries that filter by status and createdAt
orderSchema.index({ status: 1, createdAt: -1 });

export const Order = mongoose.model<OrderDocument>('Order', orderSchema);



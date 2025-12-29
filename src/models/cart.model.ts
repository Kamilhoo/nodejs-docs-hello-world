import mongoose, { Schema } from 'mongoose';

export interface CartItem {
  id: string; // Unique cart item ID (e.g., "cart_item_1234567890_abc123")
  productId: mongoose.Types.ObjectId;
  quantity: number;
  size?: string;
}

export interface CartDocument extends mongoose.Document {
  sessionId: string;
  products: CartItem[];
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<CartItem>(
  {
    id: {
      type: String,
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Rug',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    size: {
      type: String,
      trim: true,
      maxlength: 100,
    },
  },
  { _id: false }
);

const cartSchema = new Schema<CartDocument>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    products: {
      type: [cartItemSchema],
      default: [],
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster product queries
cartSchema.index({ 'products.productId': 1 });

export const Cart = mongoose.model<CartDocument>('Cart', cartSchema);



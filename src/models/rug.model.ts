import mongoose, { Schema } from 'mongoose';

export interface RugDocument extends mongoose.Document {
  title: string;
  brand: string;
  description: string;
  images: string[];
  category: string;
  originalPrice: number;
  salePrice: number;
  discountPercent: number;
  colors: string[];
  sizes: string[];
  isOnSale: boolean;
  isBestSeller: boolean;
  stock: number; // Stock availability
  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Custom validator: array should not exceed 5 images
function arrayLimit(val: string[]) {
  return val.length <= 5;
}

const rugSchema = new Schema<RugDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    images: {
      type: [String], // store image URLs like "/uploads/rugs/xyz.webp"
      validate: [arrayLimit, '{PATH} exceeds the limit of 5'],
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    originalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    salePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    colors: {
      type: [String], // e.g. hex codes
      default: [],
    },
    sizes: {
      type: [String], // e.g. ["5x8", "8x10", "9x12"]
      default: [],
    },
    isOnSale: {
      type: Boolean,
      default: false,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LiteUser', // admin user
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Indexes for better query performance
rugSchema.index({ isActive: 1 });
rugSchema.index({ category: 1 });
rugSchema.index({ brand: 1 });
rugSchema.index({ isOnSale: 1 });
rugSchema.index({ isBestSeller: 1 });
rugSchema.index({ createdAt: -1 });

export const Rug = mongoose.model<RugDocument>('Rug', rugSchema);


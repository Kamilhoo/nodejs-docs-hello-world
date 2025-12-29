import mongoose, { Schema } from 'mongoose';

export interface ShippingFeeDocument extends mongoose.Document {
  freeShippingThreshold: number; // Minimum order amount for free shipping (e.g., 10000)
  shippingFee: number; // Fee amount if order is below threshold
  country: string; // For "inside country" shipping (domestic)
  isActive: boolean; // Enable/disable shipping fee rules
  createdAt: Date;
  updatedAt: Date;
}

const shippingFeeSchema = new Schema<ShippingFeeDocument>(
  {
    freeShippingThreshold: {
      type: Number,
      required: true,
      min: 0,
      default: 10000,
    },
    shippingFee: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    country: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      default: 'Pakistan',
      unique: true, // Each country can have only one shipping fee configuration
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for active shipping fee queries by country
shippingFeeSchema.index({ country: 1, isActive: 1 });

export const ShippingFee = mongoose.model<ShippingFeeDocument>('ShippingFee', shippingFeeSchema);


import mongoose, { Schema } from 'mongoose';

export interface BannerDocument extends mongoose.Document {
  data: string[];
  createdAt: Date;
  updatedAt: Date;
}

const bannerSchema = new Schema<BannerDocument>(
  {
    data: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Note: Banner is designed as a singleton - there should only be one banner document
// The application logic ensures this by using findOne() and creating if not exists

export const Banner = mongoose.model<BannerDocument>('Banner', bannerSchema);


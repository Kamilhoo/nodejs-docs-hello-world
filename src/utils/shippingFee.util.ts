import { ShippingFee } from '../models/shippingFee.model';

/**
 * Calculate shipping fee based on order amount and country
 * @param orderAmount - Total order amount
 * @param country - Country name (default: 'Pakistan')
 * @returns Shipping fee amount (0 if free shipping)
 */
export const calculateShippingFee = async (
  orderAmount: number,
  country: string = 'Pakistan'
): Promise<number> => {
  try {
    // Get active shipping fee configuration for the country
    const shippingFeeConfig = await ShippingFee.findOne({
      country: country.trim(),
      isActive: true,
    });

    // If no configuration exists, return free shipping
    if (!shippingFeeConfig) {
      return 0;
    }

    // Calculate shipping fee based on order amount
    const isFreeShipping = orderAmount >= shippingFeeConfig.freeShippingThreshold;
    return isFreeShipping ? 0 : shippingFeeConfig.shippingFee;
  } catch (error) {
    console.error('Error calculating shipping fee:', error);
    // Return 0 (free shipping) on error
    return 0;
  }
};


import { RugDocument } from '../models/rug.model';

/**
 * Price calculation input type (works with both document and lean objects)
 */
interface PriceInput {
  isOnSale: boolean;
  salePrice: number;
  originalPrice: number;
}

/**
 * Get current price of a rug (sale price if on sale, otherwise original price)
 * @param rug - Rug document or lean object
 * @returns Current price in PKR
 */
export function getCurrentPrice(rug: PriceInput): number {
  // Validate sale price is valid: isOnSale must be true, salePrice > 0, and salePrice < originalPrice
  if (rug.isOnSale && rug.salePrice > 0 && rug.salePrice < rug.originalPrice) {
    return rug.salePrice;
  }
  return rug.originalPrice;
}



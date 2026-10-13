export const LOW_STOCK_THRESHOLD = 3;

export const isLowStock = (stock: number) =>
  stock > 0 && stock <= LOW_STOCK_THRESHOLD;

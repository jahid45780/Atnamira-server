

import { IProduct } from "./product.interface";
import { Product } from "./product.model";

const createProduct = async (payload: IProduct) => {
  const product = await Product.create(payload);

  return {
    data: product,
  };
};

export const productService = {
  createProduct,
};
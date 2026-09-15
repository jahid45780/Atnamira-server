

import { IProduct } from "./product.interface";
import { Product } from "./product.model";

const createProduct = async (payload: IProduct) => {
  const product = await Product.create(payload);

  return {
    data: product,
  };
};


// Get All Products
// ================================

const getAllProducts = async () => {
  const products = await Product.find()
    .sort({ createdAt: -1 });

  return {
    data: products,
  };
};

// ================================
// Get Single Product
// ================================

const getSingleProduct = async (id: string) => {
  const product = await Product.findById(id);

  if (!product) {
    throw new Error("Product not found");
  }

  return {
    data: product,
  };
};


 // ================================
// Update Product
// ================================

const updateProduct = async (
  id: string,
  payload: Partial<IProduct>
) => {
  const product = await Product.findByIdAndUpdate(
    id,
    payload,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!product) {
    throw new Error("Product not found");
  }

  return {
    data: product,
  };
};


 // ================================
// Delete Product
// ================================

const deleteProduct = async (id: string) => {
  const product = await Product.findByIdAndDelete(id);

  if (!product) {
    throw new Error("Product not found");
  }

  return {
    data: product,
  };
};


export const productService = {
  createProduct,
  getAllProducts,
  getSingleProduct,
   updateProduct,
   deleteProduct
};


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


 const getAllProducts = async (query: Record<string, unknown>) => {
  const {
    search,
    category,
    sort = "newest",
    page = 1,
    limit = 5,
  } = query;

  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.max(Number(limit) || 5, 1);

  const skip = (pageNumber - 1) * limitNumber;

  const filter: Record<string, unknown> = {
    isActive: true,
  };

  // =========================
  // Category Filter
  // =========================
  if (category && category !== "All") {
    filter.category = category;
  }

  // =========================
  // Search: name + description
  // =========================
  if (search) {
    filter.$or = [
      {
        name: {
          $regex: String(search),
          $options: "i",
        },
      },
      {
        description: {
          $regex: String(search),
          $options: "i",
        },
      },
    ];
  }

  // =========================
  // Sorting
  // =========================
  let sortQuery: Record<string, 1 | -1> = {
    createdAt: -1,
  };

  if (sort === "price-low") {
    sortQuery = {
      price: 1,
    };
  }

  if (sort === "price-high") {
    sortQuery = {
      price: -1,
    };
  }

  if (sort === "rating") {
    sortQuery = {
      rating: -1,
    };
  }

  if (sort === "popular") {
    sortQuery = {
      reviews: -1,
    };
  }

  // Sizes sorting
  if (sort === "size") {
    sortQuery = {
      sizes: 1,
    };
  }

  if (sort === "size-desc") {
    sortQuery = {
      sizes: -1,
    };
  }

  // =========================
  // Get Products + Total
  // =========================
  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sortQuery)
      .skip(skip)
      .limit(limitNumber),

    Product.countDocuments(filter),
  ]);

  return {
    data: products,
    meta: {
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPage: Math.ceil(total / limitNumber),
    },
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
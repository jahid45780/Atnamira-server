

import { IProduct } from "./product.interface";
import { Product } from "./product.model";


   const PRODUCTS_PER_DAY = 10;

   const ROTATION_START_DATE = new Date(
  "2026-09-23T00:00:00.000Z"
);


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
    badge,
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
  // Badge Filter
  // =========================
  if (badge && badge !== "All") {
    filter.badge = badge;
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



const getBestSellingToday = async () => {
  const products = await Product.find({
    badge: "Best Seller",
    isActive: true,
  })
    .sort({
      createdAt: 1,
      _id: 1,
    })
    .lean();

  const totalProducts = products.length;

  if (totalProducts === 0) {
    return {
      products: [],
      totalProducts: 0,
    };
  }

  const differenceInDays = Math.floor(
    (Date.now() - ROTATION_START_DATE.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const startIndex =
    (differenceInDays * PRODUCTS_PER_DAY) %
    totalProducts;

  let todayProducts = products.slice(
    startIndex,
    startIndex + PRODUCTS_PER_DAY
  );

  if (todayProducts.length < PRODUCTS_PER_DAY) {
    const remaining =
      PRODUCTS_PER_DAY - todayProducts.length;

    todayProducts = [
      ...todayProducts,
      ...products.slice(0, remaining),
    ];
  }

  return {
    products: todayProducts,
    totalProducts,
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
   deleteProduct,
   getBestSellingToday
};
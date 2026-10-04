

import { cloudinaryUpload } from "../../config/cloudinary.config";
import AppError from "../../errorHerplrs/appError";
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
  payload: Record<string, any> = {},
  files?: {
    [fieldname: string]: Express.Multer.File[];
  }
) => {
  // =========================
  // FIND PRODUCT
  // =========================

  const product = await Product.findById(id);

  if (!product) {
    throw new AppError(
      404,
      "Product not found"
    );
  }

  // =========================
  // UPDATE DATA
  // =========================

  const updateData: Record<string, any> = {};

  // =========================
  // TEXT FIELDS
  // =========================

  if (payload.name !== undefined) {
    updateData.name = String(payload.name);
  }

  if (payload.slug !== undefined) {
    updateData.slug = String(payload.slug);
  }

  if (payload.category !== undefined) {
    updateData.category = String(
      payload.category
    );
  }

  if (payload.description !== undefined) {
    updateData.description = String(
      payload.description
    );
  }

  // =========================
  // PRICE
  // =========================

  if (
    payload.price !== undefined &&
    payload.price !== ""
  ) {
    const price = Number(payload.price);

    if (Number.isNaN(price)) {
      throw new AppError(
        400,
        "Invalid product price"
      );
    }

    updateData.price = price;
  }

  // =========================
  // OLD PRICE
  // =========================

  if (
    payload.oldPrice !== undefined &&
    payload.oldPrice !== ""
  ) {
    const oldPrice = Number(
      payload.oldPrice
    );

    if (Number.isNaN(oldPrice)) {
      throw new AppError(
        400,
        "Invalid old price"
      );
    }

    updateData.oldPrice = oldPrice;
  }

  // =========================
  // STOCK
  // =========================

  if (
    payload.stock !== undefined &&
    payload.stock !== ""
  ) {
    const stock = Number(payload.stock);

    if (Number.isNaN(stock)) {
      throw new AppError(
        400,
        "Invalid product stock"
      );
    }

    updateData.stock = stock;
  }

  // =========================
  // BADGE
  // =========================

  if (
    payload.badge !== undefined &&
    payload.badge !== ""
  ) {
    updateData.badge = payload.badge;
  }

  // =========================
  // IS ACTIVE
  // =========================

  if (
    payload.isActive !== undefined &&
    payload.isActive !== ""
  ) {
    if (
      payload.isActive === true ||
      payload.isActive === "true"
    ) {
      updateData.isActive = true;
    }

    if (
      payload.isActive === false ||
      payload.isActive === "false"
    ) {
      updateData.isActive = false;
    }
  }

  // =========================
  // COLORS
  // =========================

  if (
    payload.colors !== undefined &&
    payload.colors !== ""
  ) {
    if (typeof payload.colors === "string") {
      try {
        const parsedColors = JSON.parse(
          payload.colors
        );

        if (Array.isArray(parsedColors)) {
          updateData.colors = parsedColors;
        }
      } catch {
        updateData.colors = payload.colors
          .split(",")
          .map((item: string) =>
            item.trim()
          )
          .filter(Boolean);
      }
    } else if (
      Array.isArray(payload.colors)
    ) {
      updateData.colors = payload.colors;
    }
  }

  // =========================
  // SIZES
  // =========================

  if (
    payload.sizes !== undefined &&
    payload.sizes !== ""
  ) {
    if (typeof payload.sizes === "string") {
      try {
        const parsedSizes = JSON.parse(
          payload.sizes
        );

        if (Array.isArray(parsedSizes)) {
          updateData.sizes = parsedSizes;
        }
      } catch {
        updateData.sizes = payload.sizes
          .split(",")
          .map((item: string) =>
            item.trim()
          )
          .filter(Boolean);
      }
    } else if (
      Array.isArray(payload.sizes)
    ) {
      updateData.sizes = payload.sizes;
    }
  }

  // =========================
  // EXISTING IMAGES
  // =========================

  const images = {
    main: product.images?.main,
    hover: product.images?.hover,
  };

  // =========================
  // NEW MAIN IMAGE
  // =========================

  if (files?.main?.[0]) {
    const mainFile = files.main[0];

    console.log(
      "MAIN FILE RECEIVED:",
      mainFile.originalname,
      mainFile.mimetype,
      mainFile.path
    );

    if (!mainFile.path) {
      throw new AppError(
        400,
        "Main image upload failed"
      );
    }

    images.main = mainFile.path;
  }

  // =========================
  // NEW HOVER IMAGE
  // =========================

  if (files?.hover?.[0]) {
    const hoverFile = files.hover[0];

    console.log(
      "HOVER FILE RECEIVED:",
      hoverFile.originalname,
      hoverFile.mimetype,
      hoverFile.path
    );

    if (!hoverFile.path) {
      throw new AppError(
        400,
        "Hover image upload failed"
      );
    }

    images.hover = hoverFile.path;
  }

  // =========================
  // SAVE IMAGES
  // =========================

  if (
    files?.main?.[0] ||
    files?.hover?.[0]
  ) {
    updateData.images = images;
  }

  // =========================
  // DEBUG
  // =========================

  console.log(
    "========== PRODUCT UPDATE =========="
  );

  console.log("Product ID:", id);

  console.log(
    "Original Payload:",
    payload
  );

  console.log(
    "Update Data:",
    updateData
  );

  console.log(
    "Main Image:",
    files?.main?.[0]?.path
  );

  console.log(
    "Hover Image:",
    files?.hover?.[0]?.path
  );

  // =========================
  // DATABASE UPDATE
  // =========================

  const updatedProduct =
    await Product.findByIdAndUpdate(
      id,
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      }
    );

  if (!updatedProduct) {
    throw new AppError(
      404,
      "Product update failed"
    );
  }

  // =========================
  // RESULT
  // =========================

  console.log(
    "Updated Product:",
    updatedProduct
  );

  console.log(
    "===================================="
  );

  return {
    data: updatedProduct,
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

function uploadToCloudinary(path: string) {
  throw new Error("Function not implemented.");
}

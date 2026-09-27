"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productService = void 0;
const product_model_1 = require("./product.model");
const PRODUCTS_PER_DAY = 10;
const ROTATION_START_DATE = new Date("2026-09-23T00:00:00.000Z");
const createProduct = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield product_model_1.Product.create(payload);
    return {
        data: product,
    };
});
// Get All Products
// ================================
const getAllProducts = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { search, category, badge, sort = "newest", page = 1, limit = 5, } = query;
    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.max(Number(limit) || 5, 1);
    const skip = (pageNumber - 1) * limitNumber;
    const filter = {
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
    let sortQuery = {
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
    const [products, total] = yield Promise.all([
        product_model_1.Product.find(filter)
            .sort(sortQuery)
            .skip(skip)
            .limit(limitNumber),
        product_model_1.Product.countDocuments(filter),
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
});
const getBestSellingToday = () => __awaiter(void 0, void 0, void 0, function* () {
    const products = yield product_model_1.Product.find({
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
    const differenceInDays = Math.floor((Date.now() - ROTATION_START_DATE.getTime()) /
        (1000 * 60 * 60 * 24));
    const startIndex = (differenceInDays * PRODUCTS_PER_DAY) %
        totalProducts;
    let todayProducts = products.slice(startIndex, startIndex + PRODUCTS_PER_DAY);
    if (todayProducts.length < PRODUCTS_PER_DAY) {
        const remaining = PRODUCTS_PER_DAY - todayProducts.length;
        todayProducts = [
            ...todayProducts,
            ...products.slice(0, remaining),
        ];
    }
    return {
        products: todayProducts,
        totalProducts,
    };
});
// ================================
// Get Single Product
// ================================
const getSingleProduct = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield product_model_1.Product.findById(id);
    if (!product) {
        throw new Error("Product not found");
    }
    return {
        data: product,
    };
});
// ================================
// Update Product
// ================================
const updateProduct = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield product_model_1.Product.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    if (!product) {
        throw new Error("Product not found");
    }
    return {
        data: product,
    };
});
// ================================
// Delete Product
// ================================
const deleteProduct = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield product_model_1.Product.findByIdAndDelete(id);
    if (!product) {
        throw new Error("Product not found");
    }
    return {
        data: product,
    };
});
exports.productService = {
    createProduct,
    getAllProducts,
    getSingleProduct,
    updateProduct,
    deleteProduct,
    getBestSellingToday
};

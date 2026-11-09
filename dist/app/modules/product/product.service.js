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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productService = void 0;
const appError_1 = __importDefault(require("../../errorHerplrs/appError"));
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
const updateProduct = (id_1, ...args_1) => __awaiter(void 0, [id_1, ...args_1], void 0, function* (id, payload = {}, files) {
    // =========================
    // FIND PRODUCT
    // =========================
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const product = yield product_model_1.Product.findById(id);
    if (!product) {
        throw new appError_1.default(404, "Product not found");
    }
    // =========================
    // UPDATE DATA
    // =========================
    const updateData = {};
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
        updateData.category = String(payload.category);
    }
    if (payload.description !== undefined) {
        updateData.description = String(payload.description);
    }
    // =========================
    // PRICE
    // =========================
    if (payload.price !== undefined &&
        payload.price !== "") {
        const price = Number(payload.price);
        if (Number.isNaN(price)) {
            throw new appError_1.default(400, "Invalid product price");
        }
        updateData.price = price;
    }
    // =========================
    // OLD PRICE
    // =========================
    if (payload.oldPrice !== undefined &&
        payload.oldPrice !== "") {
        const oldPrice = Number(payload.oldPrice);
        if (Number.isNaN(oldPrice)) {
            throw new appError_1.default(400, "Invalid old price");
        }
        updateData.oldPrice = oldPrice;
    }
    // =========================
    // STOCK
    // =========================
    if (payload.stock !== undefined &&
        payload.stock !== "") {
        const stock = Number(payload.stock);
        if (Number.isNaN(stock)) {
            throw new appError_1.default(400, "Invalid product stock");
        }
        updateData.stock = stock;
    }
    // =========================
    // BADGE
    // =========================
    if (payload.badge !== undefined &&
        payload.badge !== "") {
        updateData.badge = payload.badge;
    }
    // =========================
    // IS ACTIVE
    // =========================
    if (payload.isActive !== undefined &&
        payload.isActive !== "") {
        if (payload.isActive === true ||
            payload.isActive === "true") {
            updateData.isActive = true;
        }
        if (payload.isActive === false ||
            payload.isActive === "false") {
            updateData.isActive = false;
        }
    }
    // =========================
    // COLORS
    // =========================
    if (payload.colors !== undefined &&
        payload.colors !== "") {
        if (typeof payload.colors === "string") {
            try {
                const parsedColors = JSON.parse(payload.colors);
                if (Array.isArray(parsedColors)) {
                    updateData.colors = parsedColors;
                }
            }
            catch (_l) {
                updateData.colors = payload.colors
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean);
            }
        }
        else if (Array.isArray(payload.colors)) {
            updateData.colors = payload.colors;
        }
    }
    // =========================
    // SIZES
    // =========================
    if (payload.sizes !== undefined &&
        payload.sizes !== "") {
        if (typeof payload.sizes === "string") {
            try {
                const parsedSizes = JSON.parse(payload.sizes);
                if (Array.isArray(parsedSizes)) {
                    updateData.sizes = parsedSizes;
                }
            }
            catch (_m) {
                updateData.sizes = payload.sizes
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean);
            }
        }
        else if (Array.isArray(payload.sizes)) {
            updateData.sizes = payload.sizes;
        }
    }
    // =========================
    // EXISTING IMAGES
    // =========================
    const images = {
        main: (_a = product.images) === null || _a === void 0 ? void 0 : _a.main,
        hover: (_b = product.images) === null || _b === void 0 ? void 0 : _b.hover,
    };
    // =========================
    // NEW MAIN IMAGE
    // =========================
    if ((_c = files === null || files === void 0 ? void 0 : files.main) === null || _c === void 0 ? void 0 : _c[0]) {
        const mainFile = files.main[0];
        console.log("MAIN FILE RECEIVED:", mainFile.originalname, mainFile.mimetype, mainFile.path);
        if (!mainFile.path) {
            throw new appError_1.default(400, "Main image upload failed");
        }
        images.main = mainFile.path;
    }
    // =========================
    // NEW HOVER IMAGE
    // =========================
    if ((_d = files === null || files === void 0 ? void 0 : files.hover) === null || _d === void 0 ? void 0 : _d[0]) {
        const hoverFile = files.hover[0];
        console.log("HOVER FILE RECEIVED:", hoverFile.originalname, hoverFile.mimetype, hoverFile.path);
        if (!hoverFile.path) {
            throw new appError_1.default(400, "Hover image upload failed");
        }
        images.hover = hoverFile.path;
    }
    // =========================
    // SAVE IMAGES
    // =========================
    if (((_e = files === null || files === void 0 ? void 0 : files.main) === null || _e === void 0 ? void 0 : _e[0]) ||
        ((_f = files === null || files === void 0 ? void 0 : files.hover) === null || _f === void 0 ? void 0 : _f[0])) {
        updateData.images = images;
    }
    // =========================
    // DEBUG
    // =========================
    console.log("========== PRODUCT UPDATE ==========");
    console.log("Product ID:", id);
    console.log("Original Payload:", payload);
    console.log("Update Data:", updateData);
    console.log("Main Image:", (_h = (_g = files === null || files === void 0 ? void 0 : files.main) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.path);
    console.log("Hover Image:", (_k = (_j = files === null || files === void 0 ? void 0 : files.hover) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.path);
    // =========================
    // DATABASE UPDATE
    // =========================
    const updatedProduct = yield product_model_1.Product.findByIdAndUpdate(id, {
        $set: updateData,
    }, {
        new: true,
        runValidators: true,
    });
    if (!updatedProduct) {
        throw new appError_1.default(404, "Product update failed");
    }
    // =========================
    // RESULT
    // =========================
    console.log("Updated Product:", updatedProduct);
    console.log("====================================");
    return {
        data: updatedProduct,
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
function uploadToCloudinary(path) {
    throw new Error("Function not implemented.");
}

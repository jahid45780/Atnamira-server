import { Schema, model } from "mongoose";
import { IProduct } from "./product.interface";

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },

    slug: {
      type: String,
      required: [true, "Product slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    category: {
      type: String,
      required: [true, "Product category is required"],
      enum: [
        "Dog Lovers",
        "Cat Lovers",
        "Paw Collection",
        "Custom",
      ],
    },

    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
    },

    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },

    oldPrice: {
      type: Number,
      min: [0, "Old price cannot be negative"],
    },

    rating: {
      type: Number,
      default: 0,
      min: [0, "Rating cannot be less than 0"],
      max: [5, "Rating cannot be greater than 5"],
    },

    reviews: {
      type: Number,
      default: 0,
      min: [0, "Reviews cannot be negative"],
    },

    images: {
      main: {
        type: String,
      },
      hover: {
        type: String,
      },
    },

    colors: {
      type: [String],
      default: [],
    },

    sizes: {
      type: [String],
      default: [],
    },

    badge: {
      type: String,
      enum: [
        "New",
        "Trending",
        "Popular",
        "Sale",
        "Best Seller",
      ],
    },

    stock: {
      type: Number,
      required: [true, "Product stock is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);


// ==========================================
// Auto Generate Unique Slug From Product Name
// ==========================================

productSchema.pre("validate", async function () {
  if (!this.isModified("name")) {
    return;
  }

  const baseSlug = this.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  let slug = baseSlug;
  let counter = 1;

  while (await Product.exists({ slug })) {
    slug = `${baseSlug}-${counter++}`;
  }

  this.slug = slug;
});


export const Product = model<IProduct>(
  "Product",
  productSchema
);
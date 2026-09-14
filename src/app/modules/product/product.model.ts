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
      min: 0,
      max: 5,
    },

    reviews: {
      type: Number,
      default: 0,
      min: 0,
    },

    images: {
      main: {
        type: String,
        default: "https://placehold.co/600x600?text=Product",
      },

      hover: {
        type: String,
        default: "https://placehold.co/600x600?text=Product",
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

export const Product = model<IProduct>(
  "Product",
  productSchema
);
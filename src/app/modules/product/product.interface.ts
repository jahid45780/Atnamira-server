import { Document } from "mongoose";

export interface IProduct extends Document {
  name: string;

  slug: string;

  category:
    | "Dog Lovers"
    | "Cat Lovers"
    | "Paw Collection"
    | "Custom";

  description: string;

  price: number;

  oldPrice?: number;

  rating: number;

  reviews: number;

  images: {
    main: string;
    hover?: string;
  };

  colors: string[];

  sizes: string[];

  badge?: "New" | "Trending" | "Popular" | "Sale";

  stock: number;

  isActive: boolean;

  createdAt: Date;

  updatedAt: Date;
}
import { Cart } from "./cart.model";
import { Product } from "../product/product.model";

interface IAddToCart {
  user: string;
  product: string;
  quantity: number;
  color?: string;
  size?: string;
}

interface IUpdateCartItem {
  user: string;
  itemId: string;
  quantity: number;
}

/**
 * Add Product To Cart
 */
const addToCart = async (payload: IAddToCart) => {
  const {
    user,
    product,
    quantity,
    color = "",
    size = "",
  } = payload;

  if (!quantity || quantity < 1) {
    throw new Error("Quantity must be at least 1");
  }

  const productData = await Product.findById(product);

  if (!productData) {
    throw new Error("Product not found");
  }

  if (productData.stock <= 0) {
    throw new Error("Product is out of stock");
  }

  if (productData.stock < quantity) {
    throw new Error("Not enough stock available");
  }

  let cart = await Cart.findOne({ user });

  // Create new cart
  if (!cart) {
    cart = await Cart.create({
      user,
      items: [
        {
          product,
          quantity,
          color,
          size,
        },
      ],
    });

    return cart;
  }

  // Find same product + color + size
  const existingItem = cart.items.find(
    (item) =>
      item.product.toString() === product &&
      item.color === color &&
      item.size === size
  );

  if (existingItem) {
    const newQuantity =
      existingItem.quantity + quantity;

    if (newQuantity > productData.stock) {
      throw new Error("Not enough stock available");
    }

    existingItem.quantity = newQuantity;
  } else {
    cart.items.push({
      product: productData._id,
      quantity,
      color,
      size,
    });
  }

  await cart.save();

  return cart;
};

/**
 * Get My Cart
 */
const getMyCart = async (user: string) => {
  const cart = await Cart.findOne({ user }).populate({
    path: "items.product",
    select:
      "name slug price oldPrice images category stock badge",
  });

  if (!cart) {
    return {
      user,
      items: [],
    };
  }

  return cart;
};

/**
 * Update Cart Item Quantity
 */
const updateCartItem = async (
  payload: IUpdateCartItem
) => {
  const {
    user,
    itemId,
    quantity,
  } = payload;

  if (!quantity || quantity < 1) {
    throw new Error("Quantity must be at least 1");
  }

  const cart = await Cart.findOne({ user });

  if (!cart) {
    throw new Error("Cart not found");
  }

  const item = cart.items.id(itemId);

  if (!item) {
    throw new Error("Cart item not found");
  }

  const product = await Product.findById(item.product);

  if (!product) {
    throw new Error("Product not found");
  }

  if (product.stock <= 0) {
    throw new Error("Product is out of stock");
  }

  if (quantity > product.stock) {
    throw new Error(
      `Only ${product.stock} items available in stock`
    );
  }

  item.quantity = quantity;

  await cart.save();

  return cart;
};

/**
 * Remove Cart Item
 */
const removeCartItem = async (
  user: string,
  itemId: string
) => {
  const cart = await Cart.findOne({ user });

  if (!cart) {
    throw new Error("Cart not found");
  }

  const item = cart.items.id(itemId);

  if (!item) {
    throw new Error("Cart item not found");
  }

  item.deleteOne();

  await cart.save();

  return cart;
};

/**
 * Clear Cart
 */
const clearCart = async (user: string) => {
  const cart = await Cart.findOne({ user });

  if (!cart) {
    throw new Error("Cart not found");
  }

  // Don't use cart.items = []
  // Use pull to avoid Mongoose DocumentArray typing issue
  cart.items.splice(0, cart.items.length);

  await cart.save();

  return cart;
};

export const cartService = {
  addToCart,
  getMyCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
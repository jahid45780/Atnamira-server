
import { Cart } from "./cart.model";
import { Product } from "../product/product.model";

interface IAddToCart {
  user: string;
  product: string;
  quantity: number;
  color: string;
  size: string;
}

const addToCart = async (payload: IAddToCart) => {
  const {
    user,
    product,
    quantity,
    color,
    size,
  } = payload;

  // Product check
  const productData = await Product.findById(product);

  if (!productData) {
    throw new Error("Product not found");
  }

  // Stock check
  if (productData.stock < quantity) {
    throw new Error("Not enough stock available");
  }

  // Find user's cart
  let cart = await Cart.findOne({
    user,
  });

  // If cart doesn't exist
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

  // Check same product + color + size
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
      product,
      quantity,
      color,
      size,
    });
  }

  await cart.save();

  return cart;
};

export const cartService = {
  addToCart,
};
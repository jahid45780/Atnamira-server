// import { Cart } from "./cart.model";
// import { Product } from "../product/product.model";

// interface IAddToCart {
//   user: string;
//   product: string;
//   quantity: number;
//   color?: string;
//   size?: string;
// }

// interface IUpdateCartItem {
//   user: string;
//   itemId: string;
//   quantity: number;
// }

// /**
//  * Add Product To Cart
//  */
// const addToCart = async (payload: IAddToCart) => {
//   const {
//     user,
//     product,
//     quantity,
//     color = "",
//     size = "",
//   } = payload;

//   if (!quantity || quantity < 1) {
//     throw new Error("Quantity must be at least 1");
//   }

//   const productData = await Product.findById(product);

//   if (!productData) {
//     throw new Error("Product not found");
//   }

//   if (productData.stock <= 0) {
//     throw new Error("Product is out of stock");
//   }

//   if (productData.stock < quantity) {
//     throw new Error("Not enough stock available");
//   }

//   let cart = await Cart.findOne({ user });

//   // Create new cart
//   if (!cart) {
//     cart = await Cart.create({
//       user,
//       items: [
//         {
//           product,
//           quantity,
//           color,
//           size,
//         },
//       ],
//     });

//     return cart;
//   }

//   // Find same product + color + size
//   const existingItem = cart.items.find(
//     (item) =>
//       item.product.toString() === product &&
//       item.color === color &&
//       item.size === size
//   );

//   if (existingItem) {
//     const newQuantity =
//       existingItem.quantity + quantity;

//     if (newQuantity > productData.stock) {
//       throw new Error("Not enough stock available");
//     }

//     existingItem.quantity = newQuantity;
//   } else {
//     cart.items.push({
//       product: productData._id,
//       quantity,
//       color,
//       size,
//     });
//   }

//   await cart.save();

//   return cart;
// };

// /**
//  * Get My Cart
//  */
// const getMyCart = async (user: string) => {
//   const cart = await Cart.findOne({ user }).populate({
//     path: "items.product",
//     select:
//       "name slug price oldPrice images category stock badge",
//   });

//   if (!cart) {
//     return {
//       user,
//       items: [],
//     };
//   }

//   return cart;
// };

// /**
//  * Update Cart Item Quantity
//  */
// const updateCartItem = async (
//   payload: IUpdateCartItem
// ) => {
//   const {
//     user,
//     itemId,
//     quantity,
//   } = payload;

//   if (!quantity || quantity < 1) {
//     throw new Error("Quantity must be at least 1");
//   }

//   const cart = await Cart.findOne({ user });

//   if (!cart) {
//     throw new Error("Cart not found");
//   }

//   const item = cart.items.id(itemId);

//   if (!item) {
//     throw new Error("Cart item not found");
//   }

//   const product = await Product.findById(item.product);

//   if (!product) {
//     throw new Error("Product not found");
//   }

//   if (product.stock <= 0) {
//     throw new Error("Product is out of stock");
//   }

//   if (quantity > product.stock) {
//     throw new Error(
//       `Only ${product.stock} items available in stock`
//     );
//   }

//   item.quantity = quantity;

//   await cart.save();

//   return cart;
// };

// /**
//  * Remove Cart Item
//  */
// const removeCartItem = async (
//   user: string,
//   itemId: string
// ) => {
//   const cart = await Cart.findOne({ user });

//   if (!cart) {
//     throw new Error("Cart not found");
//   }

//   const item = cart.items.id(itemId);

//   if (!item) {
//     throw new Error("Cart item not found");
//   }

//   item.deleteOne();

//   await cart.save();

//   return cart;
// };

// /**
//  * Clear Cart
//  */
// const clearCart = async (user: string) => {
//   const cart = await Cart.findOne({ user });

//   if (!cart) {
//     throw new Error("Cart not found");
//   }

//   // Don't use cart.items = []
//   // Use pull to avoid Mongoose DocumentArray typing issue
//   cart.items.splice(0, cart.items.length);

//   await cart.save();

//   return cart;
// };

// export const cartService = {
//   addToCart,
//   getMyCart,
//   updateCartItem,
//   removeCartItem,
//   clearCart,
// };




import { Cart } from "./cart.model";
import { Product } from "../product/product.model";

export interface ICartOwner {
  user?: string;
  guestId?: string;
}

interface IAddToCart extends ICartOwner {
  product: string;
  quantity: number;
  color?: string;
  size?: string;
}

interface IUpdateCartItem extends ICartOwner {
  itemId: string;
  quantity: number;
}

const getOwnerQuery = (owner: ICartOwner) => {
  if (owner.user) {
    return { user: owner.user };
  }

  if (owner.guestId) {
    return { guestId: owner.guestId };
  }

  throw new Error("Cart owner not found");
};

/**
 * Add Product To Cart
 */
const addToCart = async (payload: IAddToCart) => {
  const {
    product,
    quantity,
    color = "",
    size = "",
  } = payload;

  const ownerQuery = getOwnerQuery(payload);

  if (!Number.isInteger(quantity) || quantity < 1) {
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

  let cart = await Cart.findOne(ownerQuery);

  if (!cart) {
    cart = await Cart.create({
      ...ownerQuery,
      items: [
        {
          product: productData._id,
          quantity,
          color,
          size,
        },
      ],
    });

    return cart;
  }

  const existingItem = cart.items.find(
    (item) =>
      item.product.toString() === product &&
      item.color === color &&
      item.size === size
  );

  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;

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
 * Get Cart
 */
const getMyCart = async (owner: ICartOwner) => {
  const ownerQuery = getOwnerQuery(owner);

  const cart = await Cart.findOne(ownerQuery).populate({
    path: "items.product",
    select:
      "name slug price oldPrice images category stock badge",
  });

  if (!cart) {
    return {
      ...ownerQuery,
      items: [],
    };
  }

  return cart;
};

/**
 * Update Cart Item Quantity
 */
const updateCartItem = async (payload: IUpdateCartItem) => {
  const {
    itemId,
    quantity,
  } = payload;

  const ownerQuery = getOwnerQuery(payload);

  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("Quantity must be at least 1");
  }

  const cart = await Cart.findOne(ownerQuery);

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
  owner: ICartOwner,
  itemId: string
) => {
  const ownerQuery = getOwnerQuery(owner);

  const cart = await Cart.findOne(ownerQuery);

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
const clearCart = async (owner: ICartOwner) => {
  const ownerQuery = getOwnerQuery(owner);

  const cart = await Cart.findOne(ownerQuery);

  if (!cart) {
    return {
      ...ownerQuery,
      items: [],
    };
  }

  cart.items.splice(0, cart.items.length);

  await cart.save();

  return cart;
};



const mergeGuestCart = async (
  userId: string,
  guestId: string
) => {
  const guestCart = await Cart.findOne({ guestId });
  if (!guestCart || guestCart.items.length === 0) {
    return getMyCart({ user: userId });
  }

  let userCart = await Cart.findOne({ user: userId });

  if (!userCart) {
    userCart = await Cart.create({
      user: userId,
      items: [],
    });
  }

  for (const guestItem of guestCart.items) {
    const productId = guestItem.product.toString();

    const product = await Product.findById(productId);

    if (!product || product.stock <= 0) {
      continue;
    }

    const existingItem = userCart.items.find(
      (item) =>
        item.product.toString() === productId &&
        item.color === guestItem.color &&
        item.size === guestItem.size
    );

    if (existingItem) {
      existingItem.quantity = Math.min(
        existingItem.quantity + guestItem.quantity,
        product.stock
      );
    } else {
      userCart.items.push({
        product: guestItem.product,
        quantity: Math.min(
          guestItem.quantity,
          product.stock
        ),
        color: guestItem.color,
        size: guestItem.size,
      });
    }
  }

  await userCart.save();

  // Remove guest cart after successful merge.
  await guestCart.deleteOne();

  return getMyCart({ user: userId });
};

export const cartService = {
  addToCart,
  getMyCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  mergeGuestCart
};
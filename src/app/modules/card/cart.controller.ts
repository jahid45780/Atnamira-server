// import { Request, Response } from "express";
// import httpStatus from "http-status-codes";

// import { cartService } from "./cart.service";
// import { sentResponse } from "../../utils/sendResponse";
// import { catchAsync } from "../../utils/catchAsync";
// import AppError from "../../errorHerplrs/appError";

// /**
//  * Add To Cart
//  */
// const addToCart = catchAsync(
//   async (req: Request, res: Response) => {
//     if (!req.user) {
//       throw new AppError(401, "Unauthorized");
//     }

//     const result = await cartService.addToCart({
//       user: req.user.userId,
//       product: req.body.product,
//       quantity: req.body.quantity,
//       color: req.body.color,
//       size: req.body.size,
//     });

//     sentResponse(res, {
//       success: true,
//       statusCode: httpStatus.OK,
//       message: "Product added to cart successfully",
//       data: result,
//     });
//   }
// );

// /**
//  * Get My Cart
//  */
// const getMyCart = catchAsync(
//   async (req: Request, res: Response) => {
//     if (!req.user) {
//       throw new AppError(401, "Unauthorized");
//     }

//     const result = await cartService.getMyCart(
//       req.user.userId
//     );

//     sentResponse(res, {
//       success: true,
//       statusCode: httpStatus.OK,
//       message: "Cart retrieved successfully",
//       data: result,
//     });
//   }
// );

// /**
//  * Update Cart Item
//  */
// const updateCartItem = catchAsync(
//   async (req: Request, res: Response) => {
//     if (!req.user) {
//       throw new AppError(401, "Unauthorized");
//     }

//     const itemId = String(req.params.itemId);

//     const result =
//       await cartService.updateCartItem({
//         user: req.user.userId,
//         itemId,
//         quantity: req.body.quantity,
//       });

//     sentResponse(res, {
//       success: true,
//       statusCode: httpStatus.OK,
//       message: "Cart quantity updated successfully",
//       data: result,
//     });
//   }
// );

// /**
//  * Remove Cart Item
//  */
// const removeCartItem = catchAsync(
//   async (req: Request, res: Response) => {
//     if (!req.user) {
//       throw new AppError(401, "Unauthorized");
//     }

//     const itemId = String(req.params.itemId);

//     const result =
//       await cartService.removeCartItem(
//         req.user.userId,
//         itemId
//       );

//     sentResponse(res, {
//       success: true,
//       statusCode: httpStatus.OK,
//       message: "Cart item removed successfully",
//       data: result,
//     });
//   }
// );

// /**
//  * Clear Cart
//  */
// const clearCart = catchAsync(
//   async (req: Request, res: Response) => {
//     if (!req.user) {
//       throw new AppError(401, "Unauthorized");
//     }

//     const result =
//       await cartService.clearCart(
//         req.user.userId
//       );

//     sentResponse(res, {
//       success: true,
//       statusCode: httpStatus.OK,
//       message: "Cart cleared successfully",
//       data: result,
//     });
//   }
// );

// export const cartController = {
//   addToCart,
//   getMyCart,
//   updateCartItem,
//   removeCartItem,
//   clearCart,
// };




import { Request, Response } from "express";
import httpStatus from "http-status-codes";

import { cartService, ICartOwner } from "./cart.service";
import { sentResponse } from "../../utils/sendResponse";
import { catchAsync } from "../../utils/catchAsync";
import AppError from "../../errorHerplrs/appError";

const getCartOwner = (res: Response): ICartOwner => {
  const owner = res.locals.cartOwner as
    | ICartOwner
    | undefined;

  if (!owner || (!owner.user && !owner.guestId)) {
    throw new Error("Cart owner not initialized");
  }

  return owner;
};

const addToCart = catchAsync(
  async (req: Request, res: Response) => {
    const owner = getCartOwner(res);

    const result = await cartService.addToCart({
      ...owner,
      product: req.body.product,
      quantity: req.body.quantity,
      color: req.body.color,
      size: req.body.size,
    });

    sentResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Product added to cart successfully",
      data: result,
    });
  }
);

const getMyCart = catchAsync(
  async (req: Request, res: Response) => {
    const owner = getCartOwner(res);

    const result = await cartService.getMyCart(owner);

    sentResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Cart retrieved successfully",
      data: result,
    });
  }
);

const updateCartItem = catchAsync(
  async (req: Request, res: Response) => {
    const owner = getCartOwner(res);

    const result = await cartService.updateCartItem({
      ...owner,
      itemId: String(req.params.itemId),
      quantity: req.body.quantity,
    });

    sentResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Cart quantity updated successfully",
      data: result,
    });
  }
);

const removeCartItem = catchAsync(
  async (req: Request, res: Response) => {
    const owner = getCartOwner(res);

    const result = await cartService.removeCartItem(
      owner,
      String(req.params.itemId)
    );

    sentResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Cart item removed successfully",
      data: result,
    });
  }
);

const clearCart = catchAsync(
  async (req: Request, res: Response) => {
    const owner = getCartOwner(res);

    const result = await cartService.clearCart(owner);

    sentResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Cart cleared successfully",
      data: result,
    });
  }
);



const mergeGuestCart = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(401, "Login required");
    }

    const guestId = req.cookies?.guestCartId;

    if (!guestId) {
      const result = await cartService.getMyCart({
        user: req.user.userId,
      });

      return sentResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "No guest cart to merge",
        data: result,
      });
    }

    const result = await cartService.mergeGuestCart(
      req.user.userId,
      guestId
    );

    res.clearCookie("guestCartId", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return sentResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Guest cart merged successfully",
      data: result,
    });
  }
);

export const cartController = {
  addToCart,
  getMyCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  mergeGuestCart
};
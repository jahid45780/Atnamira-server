import { Router } from "express";
import { productController } from "./product.controller";


const router = Router();

router.post(
  "/create-product", productController.createProduct
);

export const productRoutes = router
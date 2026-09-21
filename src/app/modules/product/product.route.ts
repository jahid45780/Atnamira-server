import { Router } from "express";
import { productController } from "./product.controller";
import { multerUpload } from "../../config/multer.config";




const router = Router();

router.post(
  "/create-product",
  multerUpload.array("files", 2),
  productController.createProduct
);

router.get(
  "/get-all-product",
  productController.getAllProducts
);

router.get(
  "/:id",
  productController.getSingleProduct
);


router.patch(
  "/:id",
  productController.updateProduct
);


router.delete(
  "/:id",
  productController.deleteProduct
);



export const productRoutes = router
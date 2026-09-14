import { Router } from "express";
import { userRoutes } from "../modules/user/user.route";
import { authRoutes } from "../modules/auth/auth.route";
import { productRoutes } from "../modules/product/product.route";

  export const  router  = Router()

 const moduleRoutes = [
    {
        path:'/user',
        route: userRoutes
    },
    {
        path:'/auth',
        route:authRoutes
    },
    {
        path:'/product',
        route: productRoutes
    }
 ]

 moduleRoutes.forEach((route)=>{
     router.use(route.path, route.route)
 })


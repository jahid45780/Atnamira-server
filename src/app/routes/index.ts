import { Router } from "express";
import { userRoutes } from "../modules/user/user.route";
import { authRoutes } from "../modules/auth/auth.route";
import { productRoutes } from "../modules/product/product.route";
import { cartRoutes } from "../modules/card/card.route";
import { bookingRoutes } from "../modules/booking/booking.route";
import { statsRoutes } from "../modules/stats/stats.route";
import { systemHealthRoutes } from "../modules/systemHealth/system-health.route";

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
    },
     {
        path:'/card',
        route: cartRoutes
    },
    {
        path:'/booking',
        route: bookingRoutes
    },
     {
        path:'/stats',
        route: statsRoutes
    },
    {
        path:'/system-health',
        route: systemHealthRoutes
    },

 ]

 moduleRoutes.forEach((route)=>{
     router.use(route.path, route.route)
 })


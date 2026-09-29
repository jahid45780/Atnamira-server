"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const user_route_1 = require("../modules/user/user.route");
const auth_route_1 = require("../modules/auth/auth.route");
const product_route_1 = require("../modules/product/product.route");
const card_route_1 = require("../modules/card/card.route");
const booking_route_1 = require("../modules/booking/booking.route");
const stats_route_1 = require("../modules/stats/stats.route");
const system_health_route_1 = require("../modules/systemHealth/system-health.route");
const tracking_route_1 = require("../modules/tracking/tracking.route");
const seo_route_1 = require("../modules/seo/seo.route");
const analytics_route_1 = require("../modules/analytics/analytics.route");
exports.router = (0, express_1.Router)();
const moduleRoutes = [
    {
        path: '/user',
        route: user_route_1.userRoutes
    },
    {
        path: '/auth',
        route: auth_route_1.authRoutes
    },
    {
        path: '/product',
        route: product_route_1.productRoutes
    },
    {
        path: '/card',
        route: card_route_1.cartRoutes
    },
    {
        path: '/booking',
        route: booking_route_1.bookingRoutes
    },
    {
        path: '/stats',
        route: stats_route_1.statsRoutes
    },
    {
        path: '/system-health',
        route: system_health_route_1.systemHealthRoutes
    },
    {
        path: '/tracking',
        route: tracking_route_1.trackingRoutes
    },
    {
        path: '/seo',
        route: seo_route_1.seoRoutes
    },
    {
        path: '/analytics',
        route: analytics_route_1.analyticsRoutes
    },
];
moduleRoutes.forEach((route) => {
    exports.router.use(route.path, route.route);
});

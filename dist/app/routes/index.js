"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_routes_1 = require("../modules/auth/auth.routes");
const product_routes_1 = require("../modules/product/product.routes");
const category_routes_1 = require("../modules/category/category.routes");
const router = express_1.default.Router();
const routes = [
    {
        path: '/auth',
        route: auth_routes_1.AuthRoutes,
    },
    {
        path: '/products',
        route: product_routes_1.ProductRoutes,
    },
    {
        path: '/categories',
        route: category_routes_1.CategoryRoutes,
    },
];
routes.forEach((route) => {
    router.use(route.path, route.route);
});
exports.default = router;

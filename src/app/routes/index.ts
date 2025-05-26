import express from 'express';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { ProductRoutes } from '../modules/product/product.routes';
import { CategoryRoutes } from '../modules/category/category.routes';
import { UserRoutes } from '../modules/user/user.routes';
import { OrderRoutes } from '../modules/order/order.routes';
import { SettingRoutes } from '../modules/setting/setting.routes';
import { StatsRoutes } from '../modules/stats/stats.routes';
import { ShopRoutes } from '../modules/shop/shop.routes';

const router = express.Router();

type Route = { path: string; route: express.Router };

const routes: Route[] = [
  { path: '/auth', route: AuthRoutes },
  { path: '/shops', route: ShopRoutes },
  { path: '/products', route: ProductRoutes },
  { path: '/categories', route: CategoryRoutes },
  { path: '/users', route: UserRoutes },
  { path: '/orders', route: OrderRoutes },
  { path: '/setting', route: SettingRoutes },
  { path: '/stats', route: StatsRoutes },
];

routes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;

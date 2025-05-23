import express from 'express';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { ProductRoutes } from '../modules/product/product.routes';
import { CategoryRoutes } from '../modules/category/category.routes';

const router = express.Router();

type Route = {
  path: string;
  route: express.Router;
};

const routes: Route[] = [
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/products',
    route: ProductRoutes,
  },
  {
    path: '/categories',
    route: CategoryRoutes,
  },
];

routes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;

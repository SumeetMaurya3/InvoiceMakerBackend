import { Router, Request, Response } from 'express';
import { user } from './user.route';
import { product } from './product.route';

// import { UserMiddleware } from '../middlewares';

const routes = Router();
// const userMiddleware = new UserMiddleware();

// Home route
routes.get('/', (req: Request, res: Response) => {
    res.send('Welcome to the API project!');
});

// API routes
routes.use('/api/user', user);
routes.use('/api/product', product);

// With Middleware
// routes.use('/api/user', userMiddleware.validateToken, userMiddleware.hasAnyRole(['user', 'admin']), user);

export default routes;

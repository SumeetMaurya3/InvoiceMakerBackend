import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import createError from 'http-errors';
import mongoose from 'mongoose';
import type { TServerConfig } from './types';

export class InitServer {
    server: Express;
    database: typeof mongoose;

    constructor() {
        this.server = express();
        this.database = mongoose;
    }

    setup(config: TServerConfig) {
        // Setup server configs
        this.server.set('host', config.host);
        this.server.set('port', config.port);
        this.server.set('db_url', config.db_url);
        this.server.set('log_level', config.log_level);

        // Setup CORS to allow credentials and the specific frontend
        this.server.use(cors({
            origin: '*',  // Ensure correct frontend URL
            credentials: true,
        }));

        // Explicitly handle OPTIONS preflight requests
        this.server.options('*', (req: Request, res: Response) => {
            res.setHeader('Access-Control-Allow-Origin', 'https://invoice-maker-frontend.vercel.app');
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            res.sendStatus(200);
        });

        // Apply other middlewares
        this.server.use(helmet());
        this.server.use(morgan('tiny'));
        this.server.use(cookieParser());
        this.server.use(express.json());
        this.server.use(express.urlencoded({ extended: false }));

        // Setup routes
        this.server.use('/', routes);

        // Catch-all for 404 errors
        this.server.use((req: Request, res: Response, next: NextFunction) => {
            next(createError(404));
        });
    }

    async start() {
        const host = this.server.get('host');
        const port = this.server.get('port');

        try {
            await this.database.connect(process.env.DB_URL!);
            this.server.listen(port, () => console.log(`[server]: server is running at ${host}:${port}`));
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    }
}

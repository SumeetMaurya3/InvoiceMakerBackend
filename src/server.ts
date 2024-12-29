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
        this.server.use(cors({
            origin: 'https://invoice-maker-frontend.vercel.app',
            credentials: true,
            methods: ['GET', 'POST', 'OPTIONS'],  // Allow OPTIONS preflight requests
            allowedHeaders: ['Content-Type', 'Authorization'], // Adjust for custom headers if needed
        }));
        

        this.server.set('host', config.host);
        this.server.set('port', config.port);
        this.server.set('db_url', config.db_url);
        this.server.set('log_level', config.log_level);

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

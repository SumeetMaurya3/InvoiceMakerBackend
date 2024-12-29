import { JwtPayload } from 'jsonwebtoken';
import { Request } from 'express';

export type TUser = {
    username: string;
    password?: string;
    email: string;
    roles: Array<string>;
    _id: string;
    createdAt?: string;
    updatedAt?: string;
    __v?: number;
};

export type TPayload = string | JwtPayload | null | undefined;

// Extend Express Request to include `user`
declare global {
    namespace Express {
        interface Request {
            user?: TUser; // `user` is now a part of the Request object
        }
    }
}

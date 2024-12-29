import { getTokenInfo } from '../utils';
import type { Request, Response, NextFunction } from 'express';

export const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.access_token;
  if (!token) {
    return res.status(401).json({ error: true, message: 'Access token is required' });
  }

  const tokenInfo = getTokenInfo({ token, token_type: 'access' });

  if (tokenInfo?.is_valid_token && tokenInfo?.user) {
    req.user = tokenInfo.user; // Assign the user to req.user
    next();
  } else {
    return res.status(403).json({ error: true, message: 'Invalid or expired token' });
  }
};

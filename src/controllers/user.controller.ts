import bcrypt from 'bcrypt';
import { User } from '../models/user.model';
import { RefreshToken } from '../models/refresh-token.model';
import { generateTokens } from '../utils';
import type { Request, Response } from 'express';
import { getTokenInfo } from '../utils';

export const signup = async (req: Request, res: Response) => {
    try {
        const { body } = req;
        const user_username = await User.findOne({ username: body.username });
        const user_email = await User.findOne({ email: body.email });

        if (user_email || user_username) {
            let message = `${user_username ? 'Username' : 'Email'} already exists`;
            if (user_username && user_email) {
                message = 'Username and email already exist';
            }
            return res.status(400).json({ error: true, message });
        }

        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(body.password, salt);
        const new_user = await User.create({ ...body, password: hashedPassword });

        return res.status(201).json({
            error: false,
            message: 'User created successfully',
            user: {
                username: new_user.username,
                email: new_user.email,
                roles: new_user.roles,
                _id: new_user._id,
            },
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: true, message: 'Internal Server Error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const invalid_error_object = {
            error: true,
            message: 'Email or password is wrong',
        };

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json(invalid_error_object);
        }

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(400).json(invalid_error_object);
        }

        const tokens = await generateTokens(user);  // This should generate both access and refresh tokens

        res.status(200).json({
            error: false,
            access_token: tokens?.access_token,
            refresh_token: tokens?.refresh_token,  // Return refresh token
            message: 'User logged in successfully',
            user: {
                username: user.username,
                email: user.email,
                roles: user.roles,
                _id: user._id,
            },
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: true, message: 'Internal Server Error' });
    }
};

export const refresh = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refresh_token; // Get refresh token from cookies

  if (!refreshToken) {
    return res.status(400).json({ error: true, message: "Refresh token is required" });
  }

  try {
    const tokenInfo = getTokenInfo({ token: refreshToken, token_type: "refresh" });

    if (tokenInfo?.is_valid_token && tokenInfo?.user) {
      const tokens = await generateTokens(tokenInfo.user);
      return res.status(200).json({
        error: false,
        user: tokenInfo.user,
        access_token: tokens?.access_token,
        message: "Token refreshed successfully",
      });
    }

    return res.status(407).json({
      error: true,
      message: "Refresh token is invalid or expired. Please log in again.",
    });
  } catch (error) {
    console.error("Error refreshing token:", error);
    return res.status(500).json({ error: true, message: "Internal server error" });
  }
};


  export const validate = async (req: Request, res: Response) => {
      // Extract token from cookies (instead of body)
      const token = req.cookies.access_token; // Assumes cookie-parser is used
  
      if (!token) {
          return res.status(400).json({ error: true, message: 'Access token is required' });
      }
  
      const is_valid_token = getTokenInfo(token)?.is_valid_token;
  
      if (is_valid_token) {
          return res.status(200).json({
              error: false,
              message: 'Token is valid',
          });
      } else {
          return refresh(req, res); // Handle token refresh if invalid
      }
  };

export const logout =  async (req: Request, res: Response) => {
    const { refresh_token } = req.body;
  
    try {
      // Find the refresh token in the database and delete it
      await RefreshToken.deleteOne({ refresh_token });
  
      res.status(200).json({ error: false, message: 'Logged out successfully' });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: true, message: 'Internal Server Error' });
    }
  };
  
export const getUserProfile = (req: Request, res: Response) => {
    // Extract token from cookies
    const token = req.cookies.access_token;

    if (!token) {
        return res.status(400).json({ error: true, message: 'Access token is required' });
    }

    // Validate token
    const tokenInfo = getTokenInfo({ token, token_type: 'access' });

    if (!tokenInfo?.is_valid_token) {
        return res.status(403).json({ error: true, message: 'Invalid or expired token' });
    }

    // If token is valid, return user profile data
    const user = tokenInfo.user;

    if (!user) {
        return res.status(404).json({ error: true, message: 'User not found' });
    }

    res.status(200).json({
        error: false,
        message: 'User profile retrieved successfully',
        user,
    });
};
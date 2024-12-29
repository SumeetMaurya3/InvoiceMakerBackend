import express from 'express';
import { addProduct, getProductsByUserId } from '../controllers/product.controllers';
import {generateUserProductsPdf } from '../controllers/pdfgenerator.controller';
export const product = express.Router();

product.post('/add', addProduct);
product.get("/generate-products-pdf/:userId", generateUserProductsPdf);
product.get('/user/:user_id', getProductsByUserId);

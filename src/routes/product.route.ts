import express from 'express';
import { addProduct, getProductsByUserId } from '../controllers/product.controllers';
import { generateUserProductsPdf } from '../controllers/pdfgenerator.controller';

export const product = express.Router();

product.post('/add', addProduct);
product.post('/user/products', getProductsByUserId);  // Change to POST request with user_id in body
product.post("/generate-products-pdf", generateUserProductsPdf);

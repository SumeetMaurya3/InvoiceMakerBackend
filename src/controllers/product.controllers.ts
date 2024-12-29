import { Request, Response } from 'express';
import { Product } from '../models/product.model'

// Controller to add a new product
export const addProduct = async (req: Request, res: Response) => {
    try {
        const { user_id, name, quantity, price } = req.body;

        // Create a new product
        const newProduct = new Product({ user_id, name, quantity, price });
        const savedProduct = await newProduct.save();

        res.status(201).json({ message: 'Product added successfully', product: savedProduct });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ message: 'Failed to add product', error });
    }
};

// Controller to find all products by user_id
export const getProductsByUserId = async (req: Request, res: Response) => {
    try {
        const { user_id } = req.params;

        // Find all products for the given user_id
        const products = await Product.find({ user_id });

        if (!products || products.length === 0) {
            return res.status(404).json({ message: 'No products found for this user' });
        }

        res.status(200).json({ message: 'Products retrieved successfully', products });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Failed to fetch products', error });
    }
};

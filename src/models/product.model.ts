import mongoose,  { Schema, model } from 'mongoose';

const ProductSchema = new Schema({
    user_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    name: { 
        type: String, 
        required: true 
    },
    quantity: { 
        type: Number, 
        required: true 
    },
    price: { 
        type: Number, 
        required: true 
    },
}, {
    timestamps: true,
});

const Product = model('Product', ProductSchema);

export {  Product };

import { Request, Response } from "express";
import puppeteerExtra from "puppeteer-extra";
import path from "path";
import { Product } from "../models/product.model";
import { User } from "../models/user.model";

// Launch puppeteer-extra without any plugins for simple PDF generation
export const generateUserProductsPdf = async (req: Request, res: Response) => {
  try {
    // Extract userId from request parameters (or body/query)
    const { userId } = req.params;

    if (!userId) {
      return res
        .status(400)
        .json({ error: true, message: "User ID is required" });
    }

    // Fetch the user by userId using the User model
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: true, message: "User not found" });
    }

    // Fetch products for the user
    const products = await Product.find({ user_id: user._id });

    if (!products || products.length === 0) {
      return res
        .status(404)
        .json({ error: true, message: "No products found for this user" });
    }

    // Calculate total price and taxed price
    let totalPrice = 0;
    const taxedProducts = products.map((product) => {
      const totalProductPrice = product.price * product.quantity;
      totalPrice += totalProductPrice;
      const taxedPrice = totalProductPrice * 1.18; // 18% tax
      return {
        ...product.toObject(),
        totalPrice: totalProductPrice.toFixed(2),
        taxedPrice: taxedPrice.toFixed(2),
      };
    });

    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD

    // Create an HTML template
    const html = `
            <html>
            <head>
                <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0 20px;
            }
            .header .logo {
                font-size: 24px;
                font-weight: bold;
            }
            .header .invoice-details {
                text-align: right;
            }
            .container {
                padding: 20px;
            }
            .user-info {
                background: linear-gradient(to right, #0d0d0d, #1e1e1e);
                color: #b8ff00;
                padding: 20px;
                border-radius: 8px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .user-info h2 {
                margin: 0;
            }
            .user-info p {
                color: #fff;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }
            table, th, td {
                border: none;
            }
            th, td {
                padding: 10px;
                text-align: left;
            }
            th {
                background-color: #202020;
                color: white;
                padding: 12px;
            }
            tbody tr:nth-child(even) {
                background-color: #f9f9f9;
            }
            .total {
                margin-top: 20px;
                display: flex;
                justify-content: right;
                padding: 15px;
                border-radius: 8px;
            }
            .total h3 {
                margin: 5px 0;
            }
            .total h2 {
                color: #0066ff;
            }
            .footer {
                margin: 40px 80px;
                background-color: #1e1e1e;
                color: white;
                font-size: 14px;
                padding: 20px;
                text-align: center;
                border-radius: 50px;
            }
        </style>
            </head>
            <body>
            <div class="header">
            <div class="logo">Levitation Infotech</div>
            <div class="invoice-details">
                <h3>INVOICE GENERATOR</h3>
                <p>output for invoice generator</p>
            </div>
            </div>
            <hr>
                <div class="container">
                <div class="user-info">
                <div>
                <p>Name:</p>
                <h2>${user.username}</h2>
                </div>
                <div style="justify-content: right;">
                <div style="width: 100%; text-align: right; color: white;"><strong>Date:</strong> ${formattedDate}</div>
                <p style="padding: 8px; background-color: white; border-radius: 20px; color: black;"> ${user.email}</p>
                </div>
                </div>
                    <table>
                        <thead>
                            <tr>
                                <th style="border-radius: 20px 0 0 20px;">Product</th>
                                <th>Qty</th>
                                <th>Price</th>
                                <th  style="border-radius:  0 20px 20px 0;">Total Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${taxedProducts
                            .map(
                                (product) => `
                                <tr>
                                    <td>${product.name}</td>
                                    <td>${product.quantity}</td>
                                    <td>${product.price}</td>
                                    <td>${product.totalPrice}</td>
                                </tr>
                            `
                              )
                              .join("")}
                        </tbody>
                    </table>
                    <div class="total">
                    <div style="border: 0.5px solid black; padding: 5px; width: 40%; border-radius: 8px; justify-content:right; padding: 10px;">
                <div style="display: flex; justify-content: space-between; font-size:14px; font-weight: 600; color:grey"> <div>Total Charges</div>     <div>${totalPrice.toFixed(2)}</div></div>
                <div style="display: flex; justify-content: space-between; font-size:12px; font-weight: 500; margin-top:10px; color:grey"> <div>GST (18%)</div>     <div>${(totalPrice*1.18 - totalPrice).toFixed(2)}</div></div>
                <div style="display: flex; justify-content: space-between; font-size:17px; font-weight: 700; margin-top:10px;"> <div>Total Price</div>     <div style="color:blue;">${(totalPrice * 1.18).toFixed(2)}</div></div>
                </div>
                </div>
                </div>
                <p style="margin-top: 30px; padding: 20px;"><strong>Date:</strong> ${formattedDate}</p>
                 <div class="footer">
            We are pleased to provide any further information you may require and look forward to assisting with your next order. Rest assured, it will receive our prompt and dedicated attention.
        </div>
            </body>
            </html>
        `;

    const browser = await puppeteerExtra.launch({ headless: true });

    const page = await browser.newPage();

    // Set content and create PDF
    await page.setContent(html);
    await page.emulateMediaType("screen");

    // Specify download path for the PDF
    const downloadPath = path.resolve("./downloads"); // Specify the download path

    // Ensure the directory exists
    const fs = require("fs");
    if (!fs.existsSync(downloadPath)) {
      fs.mkdirSync(downloadPath);
    }

    // Define the path where the PDF will be saved
    const pdfPath = path.join(downloadPath, "user_products_report.pdf");

    // Generate the PDF and save it to the specified path
    await page.pdf({
      path: pdfPath, // Save PDF to specified path
      format: "A4",
      printBackground: true,
    });

    // Send the generated PDF as a response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="user_products_report.pdf"'
    );
    res.sendFile(pdfPath);

    await browser.close();
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: true, message: "Failed to generate PDF" });
  }
};

import Invoice from "../models/Invoice.js";
import Order from "../models/Order.js";
import User from "../models/User.js";

// Helper for complex fee constraints (e.g. 5% tax + 50LKR flat service charge)
const calculateTotal = (items) => {
    const subTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subTotal * 0.05; // 5% example tax
    const serviceCharge = 50; // 50 LKR flat processing fee
    const totalAmount = subTotal + tax + serviceCharge;

    return {
        subTotal,
        tax,
        serviceCharge,
        totalAmount
    };
};

export const generateInvoice = async (req, res) => {
    try {
        const { orderId } = req.params;
        const studentId = req.userId; // Provided by auth middleware

        // Validate order existence and ownership
        const order = await Order.findById(orderId).populate('canteen');
        if (!order) return res.status(404).json({ message: "Order not found" });
        
        // Fetch user to verify roles globally to prevent dual-tab login 403 errors
        const user = await User.findById(studentId);
        if (order.student.toString() !== studentId && user.role !== 'admin' && user.role !== 'staff') {
            return res.status(403).json({ message: "Not authorized to generate invoice for this order" });
        }

        // Check if an invoice already exists for this order
        const existingInvoice = await Invoice.findOne({ order: orderId });
        if (existingInvoice) {
            return res.status(200).json({ message: "Invoice already exists", invoice: existingInvoice });
        }

        const itemsMapped = order.items.map(i => ({
            name: i.name,
            quantity: i.quantity,
            price: i.price,
            amount: i.quantity * i.price
        }));

        const pricing = calculateTotal(itemsMapped);

        const newInvoice = new Invoice({
            order: order._id,
            student: order.student,
            canteen: order.canteen._id,
            items: itemsMapped,
            ...pricing,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus
        });

        await newInvoice.save();

        res.status(201).json({ message: "Invoice generated successfully", invoice: newInvoice });
    } catch (error) {
        res.status(500).json({ message: error.message, stack: error.stack });
    }
};

export const getInvoice = async (req, res) => {
    try {
        const { invoiceId } = req.params;
        const invoice = await Invoice.findById(invoiceId)
            .populate('canteen', 'name location')
            .populate('order', 'orderID timeSlot orderToken')
            .populate('student', 'name userID email');

        if (!invoice) return res.status(404).json({ message: "Invoice not found" });

        // Security check - fetch user to verify role
        const user = await User.findById(req.userId);
        if (invoice.student._id.toString() !== req.userId && user.role !== 'admin' && user.role !== 'staff') {
            return res.status(403).json({ message: "Not authorized to view this invoice" });
        }

        res.status(200).json({ invoice });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getUserInvoices = async (req, res) => {
    try {
        const studentId = req.userId;
        const invoices = await Invoice.find({ student: studentId })
            .populate('canteen', 'name')
            .populate('order', 'orderID timeSlot status orderToken')
            .sort({ createdAt: -1 });

        res.status(200).json({ invoices });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Helper function to generate HTML invoice
const generateInvoiceHTML = (invoice) => {
    const formattedDate = new Date(invoice.createdAt).toLocaleDateString();
    const formattedTime = new Date(invoice.createdAt).toLocaleTimeString();
    const itemsHTML = invoice.items
        .map(
            (item) => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">LKR ${item.price.toFixed(2)}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">LKR ${item.amount.toFixed(2)}</td>
        </tr>
        `
        )
        .join('');

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice ${invoice.invoiceID}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f9fafb;
                padding: 20px;
            }
            .invoice-container {
                max-width: 900px;
                margin: 0 auto;
                background: white;
                border-radius: 8px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            .invoice-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 40px;
            }
            .header-content {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
            }
            .company-info h1 {
                font-size: 32px;
                margin-bottom: 10px;
                font-weight: 700;
            }
            .company-info p {
                font-size: 14px;
                opacity: 0.9;
                margin: 5px 0;
            }
            .invoice-details {
                text-align: right;
            }
            .invoice-details p {
                font-size: 14px;
                margin: 5px 0;
            }
            .invoice-number {
                font-size: 24px;
                font-weight: 700;
                margin-bottom: 10px;
            }
            .invoice-body {
                padding: 40px;
            }
            .section {
                margin-bottom: 30px;
            }
            .section-title {
                font-size: 13px;
                font-weight: 700;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 15px;
                border-bottom: 2px solid #e5e7eb;
                padding-bottom: 10px;
            }
            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 30px;
            }
            .info-item {
                font-size: 14px;
            }
            .info-item strong {
                color: #374151;
                display: block;
                margin-bottom: 5px;
            }
            .info-item p {
                color: #6b7280;
                margin: 3px 0;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
            }
            table thead {
                background-color: #f3f4f6;
                border-bottom: 2px solid #e5e7eb;
            }
            table th {
                padding: 12px 10px;
                text-align: left;
                font-size: 13px;
                font-weight: 700;
                color: #374151;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            table td {
                padding: 10px;
                border-bottom: 1px solid #e5e7eb;
                font-size: 14px;
            }
            .summary-box {
                background-color: #f9fafb;
                border-radius: 8px;
                padding: 20px;
                border: 1px solid #e5e7eb;
            }
            .summary-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 12px;
                font-size: 14px;
            }
            .summary-row.total {
                border-top: 2px solid #e5e7eb;
                border-bottom: 2px solid #e5e7eb;
                padding-top: 12px;
                padding-bottom: 12px;
                margin-bottom: 12px;
                font-weight: 700;
                font-size: 16px;
                color: #667eea;
            }
            .summary-label {
                color: #6b7280;
                font-weight: 500;
            }
            .summary-value {
                color: #374151;
                font-weight: 600;
            }
            .footer {
                background-color: #f3f4f6;
                padding: 20px 40px;
                border-top: 1px solid #e5e7eb;
                font-size: 12px;
                color: #6b7280;
                text-align: center;
            }
            .status-badge {
                display: inline-block;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
            }
            .status-paid {
                background-color: #d1fae5;
                color: #065f46;
            }
            .status-pending {
                background-color: #fef3c7;
                color: #92400e;
            }
            @media (max-width: 600px) {
                .header-content {
                    flex-direction: column;
                }
                .invoice-details {
                    text-align: left;
                    margin-top: 20px;
                }
                .info-grid {
                    grid-template-columns: 1fr;
                }
                table {
                    font-size: 12px;
                }
                table th, table td {
                    padding: 8px 5px;
                }
            }
            @media print {
                body {
                    background: white;
                    padding: 0;
                }
                .invoice-container {
                    box-shadow: none;
                    border-radius: 0;
                }
            }
        </style>
    </head>
    <body>
        <div class="invoice-container">
            <div class="invoice-header">
                <div class="header-content">
                    <div class="company-info">
                        <h1>⭐ ${invoice.canteen?.name || 'Canteen'}</h1>
                        <p>Smart Queue Management System</p>
                    </div>
                    <div class="invoice-details">
                        <div class="invoice-number">INVOICE</div>
                        <p><strong>${invoice.invoiceID}</strong></p>
                        <p><strong>Order:</strong> ${invoice.order?.orderID || 'N/A'}</p>
                    </div>
                </div>
            </div>
            
            <div class="invoice-body">
                <div class="section">
                    <div class="section-title">Invoice Information</div>
                    <div class="info-grid">
                        <div class="info-item">
                            <strong>Date</strong>
                            <p>${formattedDate} ${formattedTime}</p>
                        </div>
                        <div class="info-item">
                            <strong>Payment Status</strong>
                            <p><span class="status-badge ${invoice.paymentStatus === 'Paid' ? 'status-paid' : 'status-pending'}">${invoice.paymentStatus}</span></p>
                        </div>
                        <div class="info-item">
                            <strong>Payment Method</strong>
                            <p>${invoice.paymentMethod || 'Cash'}</p>
                        </div>
                    </div>
                </div>
                
                <div class="section">
                    <div class="section-title">Customer Details</div>
                    <div class="info-grid">
                        <div class="info-item">
                            <strong>Name</strong>
                            <p>${invoice.student?.name || 'N/A'}</p>
                        </div>
                        <div class="info-item">
                            <strong>Student ID</strong>
                            <p>${invoice.student?.userID || 'N/A'}</p>
                        </div>
                        <div class="info-item">
                            <strong>Email</strong>
                            <p>${invoice.student?.email || 'N/A'}</p>
                        </div>
                    </div>
                </div>
                
                <div class="section">
                    <div class="section-title">Order Items</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Item Name</th>
                                <th style="text-align: center;">Quantity</th>
                                <th style="text-align: right;">Unit Price</th>
                                <th style="text-align: right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHTML}
                        </tbody>
                    </table>
                </div>
                
                <div class="summary-box">
                    <div class="summary-row">
                        <span class="summary-label">Subtotal:</span>
                        <span class="summary-value">LKR ${invoice.subTotal.toFixed(2)}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Tax (5%):</span>
                        <span class="summary-value">LKR ${invoice.tax.toFixed(2)}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Service Charge:</span>
                        <span class="summary-value">LKR ${invoice.serviceCharge.toFixed(2)}</span>
                    </div>
                    <div class="summary-row total">
                        <span>Total Amount:</span>
                        <span>LKR ${invoice.totalAmount.toFixed(2)}</span>
                    </div>
                </div>
            </div>
            
            <div class="footer">
                <p>Thank you for your order! This is an automated invoice.</p>
                <p style="margin-top: 10px; border-top: 1px solid #d1d5db; padding-top: 10px;">
                    Generated on ${new Date().toLocaleString()}
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
};

// Get or generate invoice by order ID
export const getOrGenerateInvoiceByOrder = async (req, res) => {
    try {
        const { orderId } = req.params;

        // Fetch the order
        const order = await Order.findById(orderId).populate('canteen', 'name');
        if (!order) return res.status(404).json({ message: "Order not found" });

        // Check if invoice already exists
        let invoice = await Invoice.findOne({ order: orderId })
            .populate('canteen', 'name location')
            .populate('order', 'orderID timeSlot status')
            .populate('student', 'name userID email');

        // If invoice doesn't exist, generate it
        if (!invoice) {
            const itemsMapped = order.items.map(i => ({
                name: i.name,
                quantity: i.quantity,
                price: i.price,
                amount: i.quantity * i.price
            }));

            const pricing = calculateTotal(itemsMapped);

            invoice = new Invoice({
                order: order._id,
                student: order.student,
                canteen: order.canteen._id,
                items: itemsMapped,
                ...pricing,
                paymentMethod: order.paymentMethod,
                paymentStatus: order.paymentStatus
            });

            await invoice.save();
            await invoice.populate('canteen', 'name location');
            await invoice.populate('order', 'orderID timeSlot status');
            await invoice.populate('student', 'name userID email');
        }

        res.status(200).json({ invoice });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Download invoice as HTML file
export const downloadInvoiceFile = async (req, res) => {
    try {
        const { invoiceId } = req.params;
        const invoice = await Invoice.findById(invoiceId)
            .populate('canteen', 'name location')
            .populate('order', 'orderID timeSlot status orderToken')
            .populate('student', 'name userID email');

        if (!invoice) return res.status(404).json({ message: "Invoice not found" });

        // Security check - fetch user to verify role
        const user = await User.findById(req.userId);
        if (invoice.student._id.toString() !== req.userId && user.role !== 'admin' && user.role !== 'staff') {
            return res.status(403).json({ message: "Not authorized to download this invoice" });
        }

        const htmlContent = generateInvoiceHTML(invoice);
        
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        res.setHeader('Content-Disposition', `attachment; filename="Invoice_${invoice.invoiceID}.html"`);
        res.send(htmlContent);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

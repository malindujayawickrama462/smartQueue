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
            .populate('order', 'orderID timeSlot')
            .populate('student', 'name userID email');

        if (!invoice) return res.status(404).json({ message: "Invoice not found" });

        // Security check
        if (invoice.student._id.toString() !== req.userId && req.userRole !== 'admin' && req.userRole !== 'staff') {
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
            .populate('order', 'orderID timeSlot status')
            .sort({ createdAt: -1 });

        res.status(200).json({ invoices });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

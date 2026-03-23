import Complaint from "../models/Complaint.js";
import User from "../models/User.js";

export const createComplaint = async (req, res) => {
    try {
        const { title, description } = req.body;
        const userId = req.userId;
        if (!title || !description) return res.status(400).json({ message: "Title and description are required" });
        
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const complaint = await Complaint.create({ title, description, user: userId, role: user.role });
        res.status(201).json({ message: "Complaint created successfully", complaint });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getMyComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find({ user: req.userId }).sort({ createdAt: -1 });
        res.status(200).json({ complaints });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getAllComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find().populate('user', 'name email role').sort({ createdAt: -1 });
        res.status(200).json({ complaints });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

export const updateComplaintStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminReply } = req.body;
        
        const updateData = {};
        if (status) updateData.status = status;
        if (adminReply !== undefined) updateData.adminReply = adminReply;

        const complaint = await Complaint.findByIdAndUpdate(id, updateData, { new: true });
        if (!complaint) return res.status(404).json({ message: "Complaint not found" });
        res.status(200).json({ message: "Updated successfully", complaint });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

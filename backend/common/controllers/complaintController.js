import Complaint from "../models/Complaint.js";

// Student submits complaint.
export const submitComplaint = async (req, res) => {
  const { studentId, canteenId, canteenID, category, description, imageUrl } = req.body;

  try {
    const complaint = new Complaint({
      studentId,
      canteenID: canteenID || canteenId,
      category,
      description,
      imageUrl: imageUrl ?? "",
    });

    await complaint.save();
    res.status(201).json({ message: "Complaint submitted", complaint });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Student views their complaints.
export const getMyComplaints = async (req, res) => {
  const { studentId } = req.params;

  try {
    const complaints = await Complaint.find({ studentId }).sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin views all complaints.
export const getAllComplaints = async (_req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin updates complaint status.
export const updateComplaintStatus = async (req, res) => {
  const { id } = req.params;
  const { status, adminResponse } = req.body;

  try {
    const updated = await Complaint.findByIdAndUpdate(
      id,
      {
        status,
        adminResponse: adminResponse ?? "",
        resolvedAt: status === "Resolved" ? new Date() : undefined,
      },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


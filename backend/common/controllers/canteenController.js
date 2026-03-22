import Canteen from "../models/Canteen.js";
import User from "../models/User.js";
import CanteenStaff from "../models/CanteenStaff.js";
import mongoose from "mongoose";

const getCanteenQuery = (id) => mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { canteenID: id };

// Admin: Create a new canteen
export async function createCanteen(req, res) {
    try {
        const { name, location, description, capacity } = req.body;

        if (!name || !location || !capacity) {
            return res.status(400).json({
                msg: "name, location, and capacity are required"
            });
        }

        const canteen = await Canteen.create({
            name,
            location,
            description: description || "",
            capacity,
            createdBy: req.userId
        });

        res.status(201).json({
            msg: "Canteen created successfully",
            canteenID: canteen.canteenID,
            name: canteen.name,
            location: canteen.location,
            capacity: canteen.capacity
        });
    } catch (err) {
        res.status(500).json({
            msg: err.message
        });
    }
}

// Student: View all active canteens
export async function viewCanteens(req, res) {
    try {
        const canteens = await Canteen.find({ isActive: true })
            .select("canteenID name location description capacity createdAt")
            .populate("createdBy", "name");

        res.status(200).json({
            msg: "Canteens retrieved successfully",
            canteens: canteens
        });
    } catch (err) {
        res.status(500).json({
            msg: err.message
        });
    }
}

// Student: Get single canteen details
export async function getCanteenDetails(req, res) {
    try {
        const { canteenID } = req.params;

        const canteen = await Canteen.findOne(getCanteenQuery(canteenID))
            .populate("createdBy", "name email");

        if (!canteen) {
            return res.status(404).json({
                msg: "Canteen not found"
            });
        }

        res.status(200).json(canteen);
    } catch (err) {
        res.status(500).json({
            msg: err.message
        });
    }
}

// Admin: Get all canteens (including inactive)
export async function getAllCanteens(req, res) {
    try {
        const canteens = await Canteen.find()
            .populate("createdBy", "name email");

        res.status(200).json({
            msg: "All canteens retrieved successfully",
            count: canteens.length,
            canteens: canteens
        });
    } catch (err) {
        res.status(500).json({
            msg: err.message
        });
    }
}

// Admin: Update canteen
export async function updateCanteen(req, res) {
    try {
        const { canteenID } = req.params;
        const { name, location, description, capacity, isActive } = req.body;

        const canteen = await Canteen.findOne(getCanteenQuery(canteenID));

        if (!canteen) {
            return res.status(404).json({
                msg: "Canteen not found"
            });
        }

        // Only the creator or another admin can update
        if (canteen.createdBy.toString() !== req.userId && req.userRole !== "admin") {
            return res.status(403).json({
                msg: "Access denied"
            });
        }

        if (name) canteen.name = name;
        if (location) canteen.location = location;
        if (description !== undefined) canteen.description = description;
        if (capacity) canteen.capacity = capacity;
        if (isActive !== undefined) canteen.isActive = isActive;

        await canteen.save();

        res.status(200).json({
            msg: "Canteen updated successfully",
            canteen: canteen
        });
    } catch (err) {
        res.status(500).json({
            msg: err.message
        });
    }
}

// Admin: Delete canteen
export async function deleteCanteen(req, res) {
    try {
        const { canteenID } = req.params;

        const canteen = await Canteen.findOneAndDelete(getCanteenQuery(canteenID));

        if (!canteen) {
            return res.status(404).json({
                msg: "Canteen not found"
            });
        }

        res.status(200).json({
            msg: "Canteen deleted successfully"
        });
    } catch (err) {
        res.status(500).json({
            msg: err.message
        });
    }
}

// Admin: Assign manager to canteen
export async function assignManagerToCanteen(req, res) {
    try {
        const { canteenID } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                msg: "userId is required"
            });
        }

        const canteen = await Canteen.findOne(getCanteenQuery(canteenID));

        if (!canteen) {
            return res.status(404).json({
                msg: "Canteen not found"
            });
        }

        const user = await User.findOne(mongoose.Types.ObjectId.isValid(userId) ? { _id: userId } : { userID: userId });

        if (!user) {
            return res.status(404).json({
                msg: "User not found"
            });
        }

        // Check if user is already assigned to this canteen as staff
        const isStaff = await CanteenStaff.findOne({
            canteen: canteen._id,
            staff: user._id
        });

        if (!isStaff) {
            return res.status(400).json({
                msg: "User must be part of the canteen staff to be assigned as manager"
            });
        }

        canteen.manager = user._id;
        await canteen.save();

        res.status(200).json({
            msg: "Manager assigned successfully",
            canteenID: canteen.canteenID,
            manager: { userID: user.userID, name: user.name }
        });
    } catch (err) {
        res.status(500).json({
            msg: err.message
        });
    }
}

// Admin: Add staff to canteen
export async function addStaffToCanteen(req, res) {
    try {
        const { canteenID } = req.params;
        const { staffId, role } = req.body;

        if (!staffId) {
            return res.status(400).json({
                msg: "staffId is required"
            });
        }

        const canteen = await Canteen.findOne(getCanteenQuery(canteenID));

        if (!canteen) {
            return res.status(404).json({
                msg: "Canteen not found"
            });
        }

        const staff = await User.findOne(mongoose.Types.ObjectId.isValid(staffId) ? { _id: staffId } : { userID: staffId });

        if (!staff) {
            return res.status(404).json({
                msg: "Staff user not found"
            });
        }

        if (staff.role !== "staff") {
            return res.status(400).json({
                msg: "Only users with the 'staff' role can be assigned to a canteen"
            });
        }

        // Check if already assigned
        const existingAssignment = await CanteenStaff.findOne({
            canteen: canteen._id,
            staff: staff._id
        });

        if (existingAssignment) {
            return res.status(400).json({
                msg: "Staff member is already assigned to this canteen"
            });
        }

        const canteenStaff = await CanteenStaff.create({
            canteen: canteen._id,
            staff: staff._id,
            assignedBy: req.userId,
            role: role || "staff"
        });

        await canteenStaff.populate("staff", "userID name email");

        res.status(201).json({
            msg: "Staff assigned to canteen successfully",
            assignment: canteenStaff
        });
    } catch (err) {
        res.status(500).json({
            msg: err.message
        });
    }
}

// Admin: Get staff assigned to canteen
export async function getCanteenStaff(req, res) {
    try {
        const { canteenID } = req.params;

        const canteen = await Canteen.findOne(getCanteenQuery(canteenID));

        if (!canteen) {
            return res.status(404).json({
                msg: "Canteen not found"
            });
        }

        const staff = await CanteenStaff.find({ canteen: canteen._id })
            .populate("staff", "userID name email role")
            .populate("assignedBy", "name")
            .select("-canteen");

        res.status(200).json({
            msg: "Canteen staff retrieved successfully",
            canteenID: canteen.canteenID,
            manager: canteen.manager,
            staffCount: staff.length,
            staff: staff
        });
    } catch (err) {
        res.status(500).json({
            msg: err.message
        });
    }
}

// Admin: Remove staff from canteen
export async function removeStaffFromCanteen(req, res) {
    try {
        const { canteenID, staffId } = req.params;

        const canteen = await Canteen.findOne(getCanteenQuery(canteenID));

        if (!canteen) {
            return res.status(404).json({
                msg: "Canteen not found"
            });
        }

        const result = await CanteenStaff.findOneAndDelete({
            canteen: canteen._id,
            staff: staffId
        });

        if (!result) {
            return res.status(404).json({
                msg: "Staff assignment not found"
            });
        }

        res.status(200).json({
            msg: "Staff removed from canteen successfully"
        });
    } catch (err) {
        res.status(500).json({
            msg: err.message
        });
    }
}

// Staff: Get the canteen assigned to the logged-in staff member
export async function getStaffAssignedCanteen(req, res) {
    try {
        const assignment = await CanteenStaff.findOne({ staff: req.userId })
            .populate("canteen");

        if (!assignment) {
            return res.status(404).json({
                msg: "No canteen assignment found for this staff member"
            });
        }

        res.status(200).json(assignment.canteen);
    } catch (err) {
        res.status(500).json({
            msg: err.message
        });
    }
}

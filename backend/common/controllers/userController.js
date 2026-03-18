import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function RegisterUser(req,res) {
    try {
        const{name,email,password,role}=req.body;
        if(!name||!email||!password){
            return res.status(400).json({
                msg:"required al fields"
            });
        }

        // Bootstrap rule:
        // - Only the first-ever admin can be created publicly.
        // - After an admin exists, creating ANY user requires an admin JWT.
        const adminCount = await User.countDocuments({ role: "admin" });
        const requestedRole = role || "admin";

        if (adminCount > 0) {
            const token = req.header("Authorization")?.replace("Bearer ", "");
            if (!token) {
                return res.status(403).json({
                    msg: "Registration is disabled. Admin must create users."
                });
            }

            let decoded;
            try {
                decoded = jwt.verify(token, process.env.SECRET_KEY);
            } catch (err) {
                return res.status(401).json({
                    msg: err.name === "TokenExpiredError" ? "Token has expired" : "Invalid token"
                });
            }

            const requester = await User.findById(decoded.id);
            if (!requester || requester.role !== "admin") {
                return res.status(403).json({
                    msg: "Access denied. Admin role required."
                });
            }
        } else {
            // No admins exist yet: only allow creating the first admin publicly
            if (requestedRole !== "admin") {
                return res.status(400).json({
                    msg: "First user must be an admin."
                });
            }
        }

        const userExists = await User.findOne({email});
        if(userExists){
            return res.status(400).json({
                msg:"user already exists"
            });
        }
        const salt = await bcrypt.genSalt(10);
        const hasashedPassword = await bcrypt.hash(password,salt);
        const user = await User.create({
            name,
            email,
            password:hasashedPassword,
            role : requestedRole
        })
        if(user){
            res.status(201).json({
                userID:user.userID,
                name:user.name,
                email:user.email,
                role:user.role
            });
        }else{
            res.status(400).json({
                msg:"Invalid data"
            });
        }
    } catch (err) {
        res.status(500).json({
            msg:err.message
        });
    }
};

export async function loginUser(req,res) {
    try {
        const{email,password}=req.body;
        if(!email||!password){
            return res.status(400).json({
                msg:"required all fields"
            });
        }
        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json({
                msg:"Invalid email or password"
            });
        }
        const isMatch = await bcrypt.compare(password,user.password);
        if(!isMatch){
            return res.status(400).json({
                msg:"Invalid email or password"
            });
        }
        if(user&&isMatch){
            res.status(201).json({
                msg:"login successfull",
                userID:user.userID,
                name:user.name,
                email:user.email,
                role:user.role,
                token:genarateToken(user._id)
            })
        }
        
    } catch (err) {
        res.status(500).json({
            msg:err.message
        })
    }
};

export async function getUserByID(req,res) {
    try {
        const user = await User.findOne({userID:req.params.ID});
        if(!user){
            return res.status(400).json({
                msg:"user not found"
            });
        }
        res.status(201).json(user);
    } catch (err) {
        res.status(500).json({
            msg:err.message
        });
    }
};

function genarateToken(id){
    return jwt.sign({id},process.env.SECRET_KEY,{
        expiresIn:'30d',
    })
};
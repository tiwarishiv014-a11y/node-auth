import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { generateAccessToken, generateRefreshToken } from '../utils/token.js';
import AppError from '../utils/AppError.js';

// REGISTER
export const register = async (req, res) => {
    try {
        const{name, password,email,phone,address,gender,role}= req.body;
        if (!name || !email || !password || !phone || !address || !gender || !role) {
            return res.json({ message: "All fields are required" });
        }

        // Check if user already exists
        
        const existingPhone = await User.findOne({ phone });
        if (existingPhone) {
            return res.json({ message: " user with Phone number already exists" });
        }
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name ,
            email,
            password: hashedPassword 
            ,phone,
            address,
            gender,
            role
            
        });
        await user.save();

        res.json({ message: "User created successfully" });
    } catch (err) {
        next(err);
    }
};
// UPDATE USER
export const update = async (req, res) => {
    try {
        // 🔍 get phone from token (set by authMiddleware)
        const phone = req.user.phone;

        // 📦 get fields from body
        const { name, email, address, gender, password } = req.body;

        // 🔴 check if at least one field is provided
        if (!name && !email && !address && !gender && !password) {
            return res.status(400).json({ message: "No fields provided to update" });
        }

        // 🔍 email duplicate check
        if (email) {
            const existing = await User.findOne({ email });
            if (existing && existing.phone !== phone) {
                return res.status(400).json({ message: "Email already in use" });
            }
        }

        // ✅ build update object — only add fields that are provided
        const updateFields = {};
        if (name) updateFields.name = name;
        if (email) updateFields.email = email;
        if (address) updateFields.address = address;
        if (gender) updateFields.gender = gender;

        // 🔐 hash password if provided
        if (password) {
            updateFields.password = await bcrypt.hash(password, 10);
        }

        // 💾 find user by phone and update
        const user = await User.findOneAndUpdate(
            { phone },                  // 🔍 find by phone from token
            { $set: updateFields },     // ✅ only update provided fields
            { new: true }               // 📦 return updated document
        ).select('-password -refreshToken'); // 🔒 hide sensitive fields

        // 🔴 user not found
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // ✅ success
        res.json({ message: "User updated successfully", user });

    } catch (err) {
        next(err);
    }
};

// GET USERS
export const getUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.json({ error: err.message });
    }
};

// LOGIN

export const login = async (req, res) => {
    const { email, password } = req.body;


    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ message: "Invalid credentials" });
        }
        // campare the password
        const isMatch= await bcrypt.compare(password,user.password);
        if (!isMatch) {
            return res.json({message:"password do not match"}); 
        }
        const accessToken = generateAccessToken(user);
const refreshToken = generateRefreshToken(user);

user.refreshToken = refreshToken;
        await user.save();
// console.log("Generated refreshToken:", refreshToken);

// user.refreshToken = refreshToken;

// console.log("Before save:", user);

// await user.save();

// console.log("After save:", user);


        if (user) {
            res.json({ message: "Login successful",
                accessToken,
                refreshToken
            });
        } 
        else {
            res.json({ message: "Invalid credentials"       

            });
        } 
        

    } catch (err) {
        next(err);
    }
};

// logout
export const logout = async (req, res) => {
    try {
        const phone = req.user.phone;

        await User.findOneAndUpdate(
            {phone},
            { refreshToken: null},
            { new: true }
        );
        res.json({message:"Logged out successfully"});
    } catch (err) {
        next(err);
    }
    };

// REFRESH TOKEN
export const refresh = async (req, res) => {
    try {
        // 📦 get refresh token from body
        const { refreshToken } = req.body;

        // 🔴 check if refresh token is provided
        if (!refreshToken) {
            return res.status(401).json({ message: "Refresh token is required" });
        }

        // 🔍 verify refresh token signature
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

        // 🔍 find user in DB by id from token
        const user = await User.findById(decoded.id);

        // 🔴 user not found
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // 🔴 check if refresh token matches the one stored in DB
        if (user.refreshToken !== refreshToken) {
            return res.status(403).json({ message: "Invalid refresh token" });
        }

        // ✅ generate new access token
        const newAccessToken = generateAccessToken(user);

        // ✅ send new access token
        res.json({ accessToken: newAccessToken });

    } catch (err) {
        res.status(403).json({ message: "Invalid or expired refresh token" });
    }
};

export const getProfile = async (req, res) => {
    try{
        const phone = req.user.phone;
        const user = await User.findOne({phone
            }).select('-password -refreshToken');

            if (!user){
                return res.status(404).json({messahe:"User not found"});
            }
            res.json(user);
    }catch(err){
        next(err);
        
    }
};




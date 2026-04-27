import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { generateAccessToken, generateRefreshToken } from '../utils/token.js';
import AppError from '../utils/AppError.js';
import { generateOTP } from '../utils/otp.js';

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
export const getUsers = async (req, res, next) => {
    try {
        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 100;
        const skip  = (page - 1) * limit;

        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        if (req.query.role)   filter.role   = req.query.role;

        const total = await User.countDocuments(filter);
        const users = await User.find(filter)
            .select('-password -refreshToken -otp -otpExpiry -otpAttempts')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        res.status(200).json({
            total,
            page,
            totalPages: Math.ceil(total / limit),
            users    // ← dashboard reads data.users
        });

    } catch (err) { next(err); }
};

// LOGIN

// export const login = async (req, res) => {
//     const { email, password } = req.body;


//     try {
//         const user = await User.findOne({ email });
//         if (!user) {
//             return res.json({ message: "Invalid credentials" });
//         }
//         // campare the password
//         const isMatch= await bcrypt.compare(password,user.password);
//         if (!isMatch) {
//             return res.json({message:"password do not match"}); 
//         }
//         const accessToken = generateAccessToken(user);
// const refreshToken = generateRefreshToken(user);

// user.refreshToken = refreshToken;
//         await user.save();
// // console.log("Generated refreshToken:", refreshToken);

// // user.refreshToken = refreshToken;

// // console.log("Before save:", user);

// // await user.save();

// // console.log("After save:", user);


//         if (user) {
//             res.json({ message: "Login successful",
//                 accessToken,
//                 refreshToken
//             });
//         } 
//         else {
//             res.json({ message: "Invalid credentials"       

//             });
//         } 
        

//     } catch (err) {
//         next(err);
//     }
// };

export const login = async (req, res, next) => {
    try {
        const { phone } = req.body;
        const user = await User.findOne({ phone });

        // NEW USER → create pending
        if (!user) {
            await User.create({ phone, status: 'pending' });
            return res.status(200).json({
                message: "Request sent to admin for approval. Please wait.",
                status: "pending"
            });
        }

        // PENDING
        if (user.status === 'pending')
            return res.status(403).json({ message: "Awaiting admin approval.", status: "pending" });

        // REJECTED
        if (user.status === 'rejected')
            return res.status(403).json({ message: "Account rejected. Contact support.", status: "rejected" });

        // APPROVED → send OTP
        const otp = generateOTP();
        user.otp         = otp;
        user.otpExpiry = new Date(Date.now() + 30 * 60 * 1000);  // 30 minutes
        user.otpAttempts = 0;
        user.activityLog.push({ action: 'otp_request', ip: req.ip });
        await user.save();
        

        // DEV MODE → return OTP directly for Postman testing
        if (process.env.NODE_ENV === 'development') {
            return res.status(200).json({ message: "OTP sent (dev mode)", status: "otp_sent", otp });
        }

        res.status(200).json({ message: "OTP sent to your phone.", status: "otp_sent" });

    } catch (err) { next(err); }
};
// VERIFY OTP
export const verifyOtp = async (req, res, next) => {
    try {
        const { phone, otp } = req.body;
        const user = await User.findOne({ phone });
        if (!user) return next(new AppError("User not found", 404));

        // Too many wrong attempts
        if (user.otpAttempts >= 3)
            return next(new AppError("Too many attempts. Login again to get new OTP.", 429));

        // Expired
        if (!user.otpExpiry || user.otpExpiry < Date.now()) {
            user.otp = null; user.otpExpiry = null;
            await user.save();
            return next(new AppError("OTP expired. Login again.", 400));
        }

        // Wrong OTP
        if (user.otp !== otp) {
            user.otpAttempts += 1;
            user.activityLog.push({ action: 'otp_failed', ip: req.ip });
            await user.save();
            return next(new AppError(`Wrong OTP. ${3 - user.otpAttempts} attempts left.`, 400));
        }

        // SUCCESS
        user.otp = null; user.otpExpiry = null; user.otpAttempts = 0;
        const accessToken  = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        user.refreshToken  = refreshToken;
        user.activityLog.push({ action: 'login', ip: req.ip });
        await user.save();

        res.status(200).json({
            message: "Login successful",
            accessToken,
            refreshToken,
            user: { phone: user.phone, name: user.name, role: user.role }
        });

    } catch (err) { next(err); }
};
// get pending user and update status for admin

export const getPendingUsers = async (req, res, next) => {
    try {
        const users = await User.find({ status: 'pending' }).select('-otp -otpExpiry -refreshToken');
        res.status(200).json({ total: users.length, users });
    } catch (err) { next(err); }
};

export const updateUserStatus = async (req, res, next) => {
    try {
        const { phone, status } = req.body;
        const user = await User.findOneAndUpdate({ phone }, { status }, { new: true })
            .select('-otp -otpExpiry -refreshToken');
        if (!user) return next(new AppError("User not found", 404));
        res.status(200).json({ message: `User ${status}`, user });
    } catch (err) { next(err); }
};


// logout
export const logout = async (req, res, next) => {    // ← ADD next here
    try {
        const phone = req.user.phone;

        await User.findOneAndUpdate(
            { phone },
            { 
                refreshToken: null,
                $push: { activityLog: { action: 'logout', ip: req.ip } }  // ← ADD
            },
            { new: true }
        );

        res.json({ message: "Logged out successfully" });

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

// ✅ POST /upload-picture
export const uploadPicture = async (req, res, next) => {
    try {
        // multer saves file and puts info in req.file
        if (!req.file) {
            return next(new AppError("No file uploaded", 400));
        }

        const phone = req.user.phone;

        // save file path to DB
        const filePath = req.file.path;

        const user = await User.findOneAndUpdate(
            { phone },
            { profilePicture: filePath },
            { new: true }
        ).select('-password -refreshToken');

        if (!user) {
            return next(new AppError("User not found", 404));
        }

        res.status(200).json({
            message: "Profile picture uploaded successfully",
            profilePicture: filePath,
            user
        });

    } catch (err) {
        next(err);
    }
};
export const getUserDetail = async (req, res, next) => {
    try {
        const {phone} = req.params;
        const user = await User.findOne({phone})
        .select('-password -refreshToken -otp -otpExpiry -otpAttempts');

        if 
             (!user) return next(new AppError("User not found", 404));
        
        res.status(200).json({user});
    } catch (err) {
        next(err);
    }
};

export const editUser = async (req, res, next) => {
    try {
        const {phone} = req.params;
        const { name, email, address, gender, role, status} = req.body;

        const updateFields = {};
        if (name) updateFields.name = name;
        if (email) updateFields.email = email;
        if (address) updateFields.address = address;
        if (gender) updateFields.gender = gender;
        if (role) updateFields.role = role;
        if (status) updateFields.status = status;

        const user = await User. findOneAndUpdate(
            {phone},
            {$set: updateFields},
            {new: true}
        ).select('-password -refreshToken -otp -otpExpiry -otpAttempts');

        if (!user) {
            return next(new AppError("User not found", 404));
        }

        res.status(200).json({ message: "User updated successfully", user });
    } catch (err) {
        next(err);
    }
};

export const deleteUser = async (req, res, next) => {
    try {
        const {phone} = req.params;

        const user = await User.findOneAndDelete({phone});

        if (!user) 
            return next(new AppError("User not found", 404));
        res.status(200).json({ message: "User deleted successfully" });
    } catch (err){
        next(err);
    }
};
export const getDashboardData = async (req, res, next) => {
    try {
        const [total, pending, approved, rejected, users] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ status: 'pending' }),
            User.countDocuments({ status: 'approved' }),
            User.countDocuments({ status: 'rejected' }),
            User.find()
                .select('-password -refreshToken -otp -otpExpiry -otpAttempts')
                .sort({ createdAt: -1 })
                .limit(100)
        ]);

        res.status(200).json({
            metrics: { total, pending, approved, rejected },
            users
        });

    } catch (err) { next(err); }
};
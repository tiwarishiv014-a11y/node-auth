import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: false
    },
    email: {
    type: String,
    required: false,
    unique: true,
    sparse: true,    // ← now works correctly
},
    password: {
        type: String,
        required: false
    },
    phone: {
        type: String,
        
        unique: true
    },
    address: {
        type: String,
        
    },
    role: {
        type: String,
        default: "user"
    },
    gender: {
        type: String,
        
    },
    isActive: {
        type: Boolean,
        default: true
    },
    
    refreshToken: {
        type: String,
        default: null
},
profilePicture: {
    type: String,
    default: null    // stores file path
},
status:       { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
otp:          { type: String, default: null },
otpExpiry:    { type: Date,   default: null },
otpAttempts:  { type: Number, default: 0 },
activityLog: [{
    action:    { type: String },   // 'login', 'otp_request', 'otp_failed', 'logout'
    timestamp: { type: Date, default: Date.now },
    ip:        { type: String }
}]
},
    { timestamps: true 
    
});

export default mongoose.model('User', userSchema);
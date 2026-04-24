import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        
        required: true,
        
    },
    password: {
        type: String,
        required: true
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
},
    { timestamps: true 
    
});

export default mongoose.model('User', userSchema);
import jwt from 'jsonwebtoken';

export const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user._id, email: user.email, phone: user.phone },
        process.env.ACCESS_SECRET, // 👈 directly here, not at top
        { expiresIn: '15m' }
    );
};

export const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user._id, email: user.email, phone: user.phone },
        process.env.REFRESH_SECRET, // 👈 directly here, not at top
        { expiresIn: '7d' }
    );
};
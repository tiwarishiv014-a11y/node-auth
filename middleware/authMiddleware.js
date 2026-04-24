import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_SECRET); // 👈 use env
        req.user = decoded; // contains id, email, phone
        next();
    } catch (err) {
        return res.status(403).json({ message: "Invalid or expired token" });
    }
};
export const adminMiddleware = (req, res, next) => {
    if (req.user.role !== 'admin')
        return res.status(403).json({ error: "Admin access only" });
    next();
};
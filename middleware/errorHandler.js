const errorhandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.statuscode (statusCode).json({
        message: err.message || "Internal Server Error",
        stack: process.env.NODE_ENV === "devlopment" ? err.stack : undefined
    });
};
export default errorhandler;
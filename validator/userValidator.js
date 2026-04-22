import e from 'express';
import {body, validationResult} from 'express-validator';

export const registervalidation =[
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({min:6}).withMessage('Password must be at least 6 characters'),
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('address').notEmpty().withMessage('Address is required'),
    body('gender').notEmpty().withMessage('Gender is required'),
    body('role').notEmpty().withMessage('Role is required'),        
];
export const loginvalidation =[
    body('email')
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Must be a valid email'),

    body('password')
        .notEmpty()
        .withMessage('Password is required'),
];

export const updatevalidation =[
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Must be a valid email'),
    body('password').optional().isLength({min:6}).withMessage('Password must be at least 6 characters'),
    body('address').optional().notEmpty().withMessage('Address cannot be empty')];

    export const validate = (req, res, next) => {
        const errors = validationresult(req); 
        if (!errors.isEmpty()) {
        return res.status(400).json({
            message: "Validation failed",
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }

    next(); 
     };
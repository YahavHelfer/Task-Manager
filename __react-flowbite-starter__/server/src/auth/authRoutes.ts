import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { check, validationResult } from 'express-validator';
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt';
import User from '../models/user'; // ודא שהנתיב נכון!
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

// --- פונקציית ה-signinHandler (ללא שינוי מהגרסה הקודמת שעבדה) ---
const signinHandler: RequestHandler = async (req, res, _next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({ message: "Please provide email and password" });
        return;
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }

        const payload = {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            isAdmin: user.isAdmin
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "4h" });
        res.json({ token });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


// --- כללי הולידציה (ללא שינוי) ---
const registerValidationRules = [
  check('firstName')
    .trim().notEmpty().withMessage('First name is required.')
    .isLength({ min: 2 }).withMessage('First name must be at least 2 characters long.')
    .escape(),
  check('lastName')
    .trim().notEmpty().withMessage('Last name is required.')
    .isLength({ min: 2 }).withMessage('Last name must be at least 2 characters long.')
    .escape(),
  check('email')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  check('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
];

// --- פונקציית ה-registerHandler (מתוקנת סופית) ---
const registerHandler: RequestHandler = async (req, res, _next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // **תוקן:** הסרת return לפני res.status
      res.status(400).json({ errors: errors.array() });
      return; // ה-return הזה נשאר כי הוא רק עוצר את הפונקציה
    }

    const { firstName, lastName, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            // **תוקן:** הסרת return לפני res.status
            res.status(400).json({
                errors: [{ msg: 'Email already exists' }] // שמירה על מבנה שגיאות אחיד
            });
            return; // ה-return הזה נשאר
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword
        });

        await newUser.save();

        // כאן אין return, זה תקין
        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: newUser._id,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email,
                isAdmin: newUser.isAdmin
            }
        });

    } catch (error) {
        console.error("Registration error:", error);
        if (error instanceof Error && error.name === 'ValidationError') {
             // **תוקן:** הסרת return לפני res.status
             res.status(400).json({ message: "Validation Error", errors: (error as any).errors });
             return; // ה-return הזה נשאר
        }
        // **תוקן:** הסרת return לפני res.status
        res.status(500).json({ message: "Internal server error" });
        // ה-return האחרון כאן מיותר כי הפונקציה מסתיימת
    }
};

// --- חיבור הפונקציות לנתיבים (ללא שינוי) ---
router.post("/signin", signinHandler);
router.post("/register", registerValidationRules, registerHandler);

// ייצוא הראוטר
export default router;
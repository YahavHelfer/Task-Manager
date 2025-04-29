// src/middlewares/authMiddleware.ts (עם תיקון לשגיאת ה-unknown)
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

export const authMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    console.log(`[AUTH MIDDLEWARE START] Path: ${req.path}, Method: ${req.method}`);
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn("[AUTH MIDDLEWARE] Failed: No Bearer token found in header.");
        res.status(401).json({ message: 'Unauthorized: Access token is missing or invalid format.' });
        return;
    }

    const token = authHeader.split(" ")[1];
    console.log(`[AUTH MIDDLEWARE] Token found (starts with): ${token.substring(0,10)}...`);

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string, isAdmin?: boolean, email?: string };
        console.log(`[AUTH MIDDLEWARE] Token VERIFIED successfully for user ID: ${decoded.id}`);
        res.locals.user = decoded;
        console.log("[AUTH MIDDLEWARE] Calling next()...");
        next();

    } catch (error) { // כאן error הוא מסוג unknown
        // --- התיקון כאן: בדיקת טיפוס לפני גישה ל-message ---
        let errorMessage = "Unknown verification error"; // הודעת ברירת מחדל
        if (error instanceof Error) {
            // אם זה אובייקט Error סטנדרטי, אפשר לגשת בבטחה ל-message
            errorMessage = error.message;
        } else if (typeof error === 'string') {
             // אם במקרה השגיאה היא רק מחרוזת
             errorMessage = error;
        }
        console.warn("[AUTH MIDDLEWARE] Token VERIFICATION FAILED:", errorMessage); // הדפסת הודעת השגיאה הבטוחה
        // ----------------------------------------------------

        res.status(401).json({ message: 'Unauthorized: Token is invalid or expired.' });
    }
};
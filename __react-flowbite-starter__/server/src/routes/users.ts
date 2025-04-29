import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import {User} from '../models/user'; // ודא שהנתיב למודל User נכון!
import { Task } from '../models/Task'; // 1. ייבוא מודל המשימה (ודא נתיב ושם קובץ נכון!)
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';

const router = express.Router();

// --- פונקציית טיפול עבור GET /api/users ---
const getAllUsersHandler: RequestHandler = async (req, res, next) => {
    try {
        const users = await User.find({}, '-password');
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        next(error);
    }
};

// --- פונקציית טיפול עבור PUT /api/users/:id/toggle-admin ---
const toggleAdminHandler: RequestHandler = async (req, res, next) => {
    try {
        const targetUserId = req.params.id;
        const actingUserId = res.locals.user.id;

        // if (targetUserId === actingUserId) { ... } // Optional self-demotion check

        const userToUpdate = await User.findById(targetUserId);

        if (!userToUpdate) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        userToUpdate.isAdmin = !userToUpdate.isAdmin;
        await userToUpdate.save();

        const { password, ...userToSend } = userToUpdate.toObject();
        res.json(userToSend);

    } catch (error) {
        console.error("Error toggling admin status:", error);
        next(error);
    }
};

// --- 2. פונקציית טיפול עבור DELETE /api/users/:id ---
const deleteUserHandler: RequestHandler = async (req, res, next) => {
    try {
        const targetUserId = req.params.id; // ID המשתמש למחיקה
        const actingUserId = res.locals.user.id; // ID האדמין הפועל

        // בדיקה למניעת מחיקה עצמית
        if (targetUserId === actingUserId) {
            res.status(400).json({ message: "Admin cannot delete themselves." });
            return;
        }

        // מצא ומחק את המשתמש
        const deletedUser = await User.findByIdAndDelete(targetUserId);

        // אם המשתמש לא נמצא
        if (!deletedUser) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        // מחק את המשימות של המשתמש
        try {
            const deleteResult = await Task.deleteMany({ userId: targetUserId });
            console.log(`User ${deletedUser.email} deleted. Deleted ${deleteResult.deletedCount} tasks.`);
        } catch (taskError) {
            console.error(`User ${deletedUser.email} deleted, but failed to delete their tasks:`, taskError);
            // החלטה: האם להחזיר שגיאה ללקוח? כרגע לא, המשתמש נמחק בהצלחה.
            // אפשר להוסיף לוגים למערכת ניטור במקרה כזה.
        }


        // שלח תשובת הצלחה (No Content)
        res.sendStatus(204);

    } catch (error) {
        console.error("Error deleting user:", error);
        next(error);
    }
};


// --- חיבור הפונקציות לנתיבים המתאימים ---
router.get('/', authMiddleware, adminMiddleware, getAllUsersHandler);
router.put('/:id/toggle-admin', authMiddleware, adminMiddleware, toggleAdminHandler);
// 3. חיבור הנתיב החדש לפונקציית המחיקה
router.delete('/:id', authMiddleware, adminMiddleware, deleteUserHandler);


// ייצוא הראוטר
export default router;
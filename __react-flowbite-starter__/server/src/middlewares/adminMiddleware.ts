// src/middlewares/adminMiddleware.ts
import { Request, Response, NextFunction } from "express";

export const adminMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // המידע על המשתמש אמור להיות זמין מ-authMiddleware הקודם
    const user = res.locals.user;

    // בדיקה אם המשתמש קיים והוא אדמין
    if (user && user.isAdmin === true) {
        // המשתמש הוא אדמין, אפשר להמשיך לבקשה המקורית
        next();
    } else {
        // המשתמש אינו אדמין או שאין מידע עליו
        // מחזירים שגיאת 403 Forbidden (לא מורשה לבצע פעולת אדמין)
        res.status(403).json({ message: "Forbidden: Admin access required" });
        // לא קוראים ל-next() כדי לעצור את המשך הטיפול בבקשה
    }
};
import mongoose from "mongoose";

// 1. הוספת השדות לממשק ה-TypeScript
export interface IUser extends mongoose.Document {
    firstName: string; // הוספנו שם פרטי
    lastName: string;  // הוספנו שם משפחה
    email: string;
    password: string;
    isAdmin: boolean;
}

const userSchema = new mongoose.Schema<IUser>({
    // 2. הוספת השדות לסכמת Mongoose
    firstName: {
        type: String,
        required: true, // הגדרנו כשדה חובה
        trim: true      // מומלץ: מוחק רווחים לבנים מההתחלה והסוף
    },
    lastName: {
        type: String,
        required: true, // הגדרנו כשדה חובה
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true // מומלץ: לשמור אימיילים באותיות קטנות
    },
    password: {
        type: String,
        required: true
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
}, {
    timestamps: true // (אופציונלי אך מומלץ) מוסיף createdAt ו-updatedAt אוטומטית
});

export const User = mongoose.model<IUser>("User", userSchema);
export default User; // בדרך כלל מייצאים רק את המודל, לא את הסכמה כ-default
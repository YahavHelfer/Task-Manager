// src/models/Task.ts
import mongoose from "mongoose";

// 1. עדכון הממשק ITask כך שיכלול את הסטטוס 'pending'
export interface ITask extends mongoose.Document {
  title: string;
  description?: string;
  status: "pending" | "todo" | "in-progress" | "done"; // <--- עדכון כאן
  createdAt: Date;
  userId: mongoose.Schema.Types.ObjectId | string; // ID של המשתמש המשויך
  isFavorite: boolean;
  dueDate?: Date | null;
}

const taskSchema = new mongoose.Schema<ITask>({
  title: { type: String, required: true, trim: true }, // מומלץ להוסיף trim
  description: { type: String, trim: true }, // מומלץ להוסיף trim
  status: {
    type: String,
    // 2. עדכון מערך ה-enum וה-default
    enum: ["pending", "todo", "in-progress", "done"], // <--- עדכון כאן
    default: "pending", // <--- עדכון כאן
    required: true // ודא שזה נשאר required אם זה המצב הרצוי
  },
  createdAt: { type: Date, default: Date.now },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // ודא ששם המודל 'User' נכון
    required: true,
    index: true // אינדקס חשוב לביצועים בשליפת משימות למשתמש
  },
  isFavorite: { type: Boolean, default: false },
  dueDate: { type: Date, required: false }, // נשאר ללא שינוי, תקין
}, {
  // הוספת timestamps אוטומטית (createdAt ו-updatedAt)
  timestamps: true
});

// הוספת אינדקסים נוספים יכולה לעזור לביצועי סינון (אופציונלי)
// אם אתה מסנן הרבה לפי סטטוס, תאריך יעד או מועדפים
taskSchema.index({ status: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ isFavorite: 1 });

// ייצוא המודל
export const Task = mongoose.model<ITask>("Task", taskSchema);
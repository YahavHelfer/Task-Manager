import express from "express";
import cors from "cors"; // ודא ש-cors מיובא
import dotenv from "dotenv";
import mongoose from "mongoose";
import taskRoutes from "./routes/tasks";
import authRoutes from "./auth/authRoutes"; // הקובץ שמכיל את POST /signin וכו'
import userRoutes from './routes/users'; // <-- 1. ייבוא קובץ הנתיבים של המשתמשים
import { authMiddleware } from "./middlewares/authMiddleware";
// אין צורך לייבא כאן את adminMiddleware, הוא בשימוש פנימי ב-userRoutes

dotenv.config();

const app = express();

// --- הגדרת CORS מפורשת ---
const corsOptions = {
  origin: '*', // עדיין מאפשר הכל לצורך בדיקה, שנה ל-origin הספציפי שלך מאוחר יותר
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: '*', // עדיין מאפשר הכל לצורך בדיקה
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
// app.options('*', cors(corsOptions)); // השארנו בהערה כי גרם לקריסה

// Middleware אחרים באים אחרי CORS
app.use(express.json());

// Middleware לרישום בקשות נכנסות
app.use((req, res, next) => {
  console.log(">>> INCOMING:", req.method, req.path);
  next();
});

// חיבור ל-MongoDB
mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("Mongo error", err));

// --- נתיבים ציבוריים (ללא authMiddleware) ---
app.use('/api/auth', authRoutes); // נתיבי אימות (signin, register)

// --- נתיבים מוגנים (למשתמש רגיל עם authMiddleware) ---
app.use("/api/tasks", authMiddleware, taskRoutes); // נתיבי משימות

// --- נתיבים מוגנים לאדמין בלבד ---
// הנתיבים בתוך userRoutes אמורים להשתמש ב-authMiddleware וב-adminMiddleware
app.use('/api/users', userRoutes); // <-- 2. חיבור נתיבי המשתמשים לאפליקציה

// דוגמה לנתיב מוגן נוסף
// app.get('/api/profile', authMiddleware, (req, res) => { ... });

// טיפול ב-404 בסוף (אופציונלי)
app.use((req, res, next) => { // הוספתי next כדי למנוע תקיעות פוטנציאליות אם יש מידלוור שגיאות אחר כך
  res.status(404).json({ message: "Not Found" });
});

// --- מידלוור לטיפול בשגיאות (מומלץ להוסיף) ---
// אם תשתמש ב-next(err) בתוך הנתיבים שלך, המידלוור הזה יתפוס את השגיאות
// app.use((err, req, res, next) => {
//   console.error("Unhandled error:", err);
//   res.status(500).json({ message: "Something went wrong!" });
// });


export default app;
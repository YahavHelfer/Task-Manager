import express, { Request, Response, NextFunction, Router } from 'express';
import mongoose from 'mongoose';
import { Task } from '../models/Task'; // ודא נתיב נכון
// 1. ייבוא המידלוור שלך
import { authMiddleware } from '../middlewares/authMiddleware';

// 2. הגדרת ממשק מסודר ל-payload של המשתמש (מומלץ)
// התאם את הממשק למבנה המדויק של הנתונים שאתה שם ב-JWT בעת ההתחברות
interface UserPayload {
  id: string;
  email: string;
  isAdmin: boolean;
  firstName?: string; // ודא שאלה השמות המדויקים מה-token
  lastName?: string;
  // הוסף שדות נוספים לפי הצורך
}

const router: Router = express.Router();

// 3. הפעלת המידלוור פעם אחת לכל הנתיבים ב-router זה
// אם אתה מפעיל אותו גלובלית ב-app.ts/server.ts עבור /api/tasks, תוכל להסיר את השורה הזו.
router.use(authMiddleware);

// --- Handler for GET /api/tasks (עם סינון ו-populate מתוקן) ---
const getTasksHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // המידלוור כבר אמור היה להגדיר את res.locals.user
    const user = res.locals.user as UserPayload; // שימוש בממשק שהוגדר

    // בדיקה נוספת למקרה שהמידלוור לא הצליח מסיבה כלשהי
    if (!user) {
      res.status(401).json({ message: 'Unauthorized: No user data found after middleware.' });
      return;
    }

    let query: any = {};

    // סינון ראשוני
    if (!user.isAdmin) {
      query.userId = user.id;
    }

    // החלת פילטרים נוספים
    const { status, priority, dueDateBefore, dueDateAfter, assignee, searchTerm, isFavorite } = req.query;
    // ...(לוגיקת הפילטרים כמו בקוד הקודם)...
    if (status && typeof status === 'string' && status !== 'all') { query.status = status; }
    if (priority && typeof priority === 'string' && priority !== 'all') { query.priority = priority; }
    let dateFilter: any = {};
    if (dueDateBefore && typeof dueDateBefore === 'string') { try { const d=new Date(dueDateBefore); d.setHours(23,59,59,999); dateFilter.$lte=d; } catch(e){} }
    if (dueDateAfter && typeof dueDateAfter === 'string') { try { const d=new Date(dueDateAfter); d.setHours(0,0,0,0); dateFilter.$gte=d; } catch(e){} }
    if (Object.keys(dateFilter).length > 0) { query.dueDate = dateFilter; }
    if (user.isAdmin && assignee && typeof assignee === 'string') { if (mongoose.Types.ObjectId.isValid(assignee)) { query.userId = assignee; } else { res.json([]); return; } }
    if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim() !== '') { const r = { $regex: searchTerm.trim(), $options: 'i' }; query.$or = [{ title: r }, { description: r }]; }
    if (isFavorite && typeof isFavorite === 'string' && isFavorite !== 'all') { query.isFavorite = isFavorite === 'true'; }


    // הגדרת השדות שרוצים מהמשתמש המשויך
    const userFieldsToPopulate = 'firstName lastName email username'; // *** התיקון החשוב ***

    // בצע שאילתה עם populate נכון
    const tasksQuery = Task.find(query)
                          .populate('userId', userFieldsToPopulate) // *** התיקון החשוב ***
                          .sort({ createdAt: -1 });

    const tasks = await tasksQuery.exec();

    res.json(tasks);

  } catch (err) {
    console.error("Error in getTasksHandler:", err);
    next(err);
  }
};

// --- Handler for POST /api/tasks ---
const addTaskHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const loggedInUser = res.locals.user as UserPayload;
     if (!loggedInUser) { throw new Error("User data missing after auth."); } // זרוק שגיאה אם המידלוור נכשל

    const { title, description, dueDate, targetUserId, status, priority } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      res.status(400).json({ message: "Title is required and cannot be empty" });
      return;
    }

    let userIdToAssign = loggedInUser.id;
    if (loggedInUser.isAdmin && targetUserId) {
      if (mongoose.Types.ObjectId.isValid(targetUserId)) {
        userIdToAssign = targetUserId;
      } else {
        res.status(400).json({ message: "Invalid target user ID format" });
        return;
      }
    }

    const newTaskData: any = {
      title: title.trim(), userId: userIdToAssign, description: description || '',
      status: status || 'pending', priority: priority || 'medium', isFavorite: false,
    };
    if (dueDate) { try { const d=new Date(dueDate); if(isNaN(d.getTime())) throw new Error(); newTaskData.dueDate = d.toISOString(); } catch(e){ res.status(400).json({message:"Invalid date format"}); return;} }

    const newTask = new Task(newTaskData);
    const savedTask = await newTask.save();
    res.status(201).json(savedTask);

  } catch (err) {
     console.error("Error in addTaskHandler:", err);
     if (err instanceof mongoose.Error.ValidationError) { res.status(400).json({ message: "Validation Error", errors: err.errors }); return; }
     next(err);
  }
};

// --- Handler for PUT /api/tasks/:id ---
const updateTaskHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = res.locals.user as UserPayload;
     if (!user) { throw new Error("User data missing after auth."); }

    const taskId = req.params.id;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(taskId)) { res.status(400).json({ message: "Invalid task ID format" }); return; }

    delete updateData.userId; delete updateData.isFavorite; delete updateData.createdAt; // מניעת עדכון שדות לא רצויים

     if ('dueDate' in updateData) { // בדוק אם השדה קיים בבקשה
       if (updateData.dueDate === null || updateData.dueDate === '') {
          updateData.dueDate = null; // אפשר למחוק תאריך
       } else {
          try { const d=new Date(updateData.dueDate); if(isNaN(d.getTime())) throw new Error(); updateData.dueDate = d.toISOString(); }
          catch(e){ res.status(400).json({ message: "Invalid due date format provided for update" }); return;}
       }
     }

    let findQuery: any = { _id: taskId };
    if (!user.isAdmin) { findQuery.userId = user.id; }

    const updatedTask = await Task.findOneAndUpdate( findQuery, updateData, { new: true, runValidators: true });

    if (!updatedTask) { res.status(404).json({ message: "Task not found or user not authorized to update" }); return; }
    res.json(updatedTask);

  } catch (err) {
    console.error("Error in updateTaskHandler:", err);
    if (err instanceof mongoose.Error.ValidationError) { res.status(400).json({ message: "Validation Error", errors: err.errors }); return; }
    next(err);
  }
};

// --- Handler for DELETE /api/tasks/:id ---
const deleteTaskHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = res.locals.user as UserPayload;
     if (!user) { throw new Error("User data missing after auth."); }

    const taskId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(taskId)) { res.status(400).json({ message: "Invalid task ID format" }); return; }

    let deleteQuery: any = { _id: taskId };
    if (!user.isAdmin) { deleteQuery.userId = user.id; }

    const deletedTask = await Task.findOneAndDelete(deleteQuery);
    if (!deletedTask) { res.status(404).json({ message: "Task not found or user not authorized to delete" }); return; }
    res.sendStatus(204);

  } catch (err) {
    console.error("Error in deleteTaskHandler:", err);
    next(err);
  }
};

// --- Handler for PATCH /api/tasks/:id/toggleFavorite ---
const toggleFavoriteHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = res.locals.user as UserPayload;
     if (!user) { throw new Error("User data missing after auth."); }

    const taskId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(taskId)) { res.status(400).json({ message: "Invalid task ID format" }); return; }

    let findQuery: any = { _id: taskId };
    if (!user.isAdmin) { findQuery.userId = user.id; }

    const task = await Task.findOne(findQuery);
    if (!task) { res.status(404).json({ message: "Task not found or user not authorized" }); return; }

    task.isFavorite = !task.isFavorite;
    const updatedTask = await task.save();
    res.json(updatedTask);

  } catch (err) {
    console.error("Error in toggleFavoriteHandler:", err);
    next(err);
  }
};

// --- Mount Routes ---
// המידלוור כבר הופעל למעלה באמצעות router.use(authMiddleware);
router.get("/", getTasksHandler);
router.post("/", addTaskHandler);
router.put("/:id", updateTaskHandler);
router.delete("/:id", deleteTaskHandler);
router.patch("/:id/toggleFavorite", toggleFavoriteHandler);

export default router;
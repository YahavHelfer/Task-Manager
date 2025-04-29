// src/pages/Favorites.tsx
import { useEffect, useState } from "react";
import httpClient from "../utils/httpClient"; // ודא נתיב נכון
import { Card } from "flowbite-react"; // ייבוא רכיבים נחוצים
import { FaStar } from "react-icons/fa"; // אייקון כוכב
// נייבא את הממשק Task - אפשר גם מקובץ נפרד אם יצרת
interface Task {
    _id: string;
    title: string;
    description?: string;
    status: string;
    createdAt: string;
    isFavorite: boolean;
}

export default function Favorites() {
    const [favoriteTasks, setFavoriteTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true); // מצב טעינה

    // פונקציה לקריאת *כל* המשימות וסינון מקומי
    const fetchAndFilterFavorites = async () => {
        setIsLoading(true); // התחל טעינה
        try {
            const res = await httpClient.get("http://localhost:5000/api/tasks");
            // סנן את המשימות כדי להציג רק את המועדפות
            const favs = res.data.filter((task: Task) => task.isFavorite === true);
            setFavoriteTasks(favs);
        } catch (err) {
            console.error("Error fetching tasks for favorites:", err);
            // TODO: הצג הודעת שגיאה למשתמש
        } finally {
            setIsLoading(false); // סיים טעינה
        }
    };

    // פונקציה לשינוי סטטוס מועדף (זהה לזו שב-TaskManager)
    // שינוי סטטוס יגרום לרענון הרשימה וסינון מחדש
    const handleToggleFavorite = async (taskId: string) => {
        try {
            await httpClient.patch(`http://localhost:5000/api/tasks/${taskId}/toggleFavorite`);
            // קרא מחדש למשימות וסנן כדי לעדכן את התצוגה
            fetchAndFilterFavorites();
        } catch (err) {
            console.error("Error toggling favorite status:", err);
        }
    };

    // טעינת המשימות בטעינה ראשונית של הקומפוננטה
    useEffect(() => {
        fetchAndFilterFavorites();
    }, []); // המערך הריק מבטיח הרצה פעם אחת

    return (
        <div className="max-w-3xl p-4 mx-auto">
            <h2 className="mb-6 text-3xl font-bold text-center text-gray-900 dark:text-white">
                Favorite Tasks
            </h2>

            {isLoading ? (
                <p className="text-center text-gray-500 dark:text-gray-400">Loading favorites...</p>
            ) : favoriteTasks.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400">You haven't marked any tasks as favorite yet.</p>
            ) : (
                <div className="space-y-4">
                    {favoriteTasks.map((task) => (
                        // שימוש חוזר באותו עיצוב כרטיס כמו ב-TaskManager
                        <Card key={task._id} className="relative shadow">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-grow min-w-0">
                                    <h4 className="text-lg font-bold text-gray-900 truncate dark:text-white">{task.title}</h4>
                                    {task.description && (
                                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{task.description}</p>
                                    )}
                                    <span
                                        className={`mt-2 inline-block text-xs font-semibold px-2 py-0.5 rounded ${task.status === "done"
                                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                                : task.status === "in-progress"
                                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                            }`}
                                    >
                                        {task.status.replace('-', ' ')}
                                    </span>
                                </div>
                                <div className="flex items-center flex-shrink-0 gap-2">
                                    {/* כפתור מועדפים (כדי לבטל מפה) */}
                                    <button
                                        onClick={() => handleToggleFavorite(task._id)}
                                        title="Remove from Favorites" // כאן זה תמיד להסרה
                                        className="p-1.5 rounded-full text-yellow-400 dark:text-yellow-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
                                    >
                                        <FaStar size={18} />
                                    </button>
                                    {/* אין צורך בכפתורי עריכה/מחיקה כאן, אלא אם רוצים */}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
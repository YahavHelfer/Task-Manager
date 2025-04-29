import React from 'react';
// ייבוא רכיבים נחוצים מ-react-router-dom
import { Navigate, Outlet, useLocation } from 'react-router-dom';
// ייבוא ה-hook שלנו מהקונטקסט
import { useAuth } from '../context/UserContext'; // ודא שהנתיב לקובץ הקונטקסט נכון!

const ProtectedRoute: React.FC = () => {
    // קבלת מצב המשתמש ומצב הטעינה מהקונטקסט
    const { user, isLoading } = useAuth();
    // קבלת המיקום הנוכחי - שימושי כדי לחזור לכאן אחרי התחברות (אופציונלי)
    const location = useLocation();

    // (אופציונלי) הדפסה לקונסול לצורך בדיקה
    console.log("ProtectedRoute Check: isLoading=", isLoading, "user=", !!user);

    // 1. בדיקה אם הקונטקסט עדיין בטעינה / בדיקת טוקן ראשונית
    if (isLoading) {
        // אם אנחנו עדיין בודקים, הצג הודעת טעינה או ספינר
        // זה מונע הפנייה מוקדמת מדי ל-signin לפני שווידאנו אם יש טוקן
        console.log("ProtectedRoute: Still loading auth state...");
        return <div>Loading...</div>; // או קומפוננטת ספינר יפה
    }

    // 2. אם סיימנו לטעון ואין משתמש מחובר (user הוא null)
    if (!user) {
        // הפנה את המשתמש לדף ההתחברות
        console.log("ProtectedRoute: User is null, redirecting to /signin");
        // state={{ from: location }} - שומר את הדף שממנו הגענו
        // replace - מחליף את הערך בהיסטוריה במקום להוסיף, מונע לחיצה על "אחורה" וחזרה לכאן
        return <Navigate to="/signin" state={{ from: location }} replace />;
    }

    // 3. אם סיימנו לטעון והמשתמש מחובר (user אינו null)
    console.log("ProtectedRoute: User is authenticated, rendering Outlet.");
    // רנדר את הקומפוננטה המקוננת שהוגדרה ב-App.tsx (במקרה שלנו TaskManager)
    return <Outlet />;
};

export default ProtectedRoute;
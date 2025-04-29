// src/components/AdminProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/UserContext'; // התאם נתיב אם צריך


const AdminProtectedRoute: React.FC = () => {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    console.log("AdminProtectedRoute: isLoading=", isLoading, "user=", user);

    // אם עדיין בטעינה, הצג הודעת טעינה
    if (isLoading) {
        console.log("AdminProtectedRoute: Loading state...");
        return <div>Loading authentication...</div>;
    }

    // אם הטעינה הסתיימה ואין משתמש, או שהמשתמש אינו אדמין, הפנה לדף הבית
    // (או לדף שגיאת "אין הרשאה" אם תרצה ליצור כזה)
    if (!user || !user.isAdmin) {
        console.log("AdminProtectedRoute: User is null or not admin, redirecting to /");
        // אפשר להפנות ל-signin או לדף הבית, תלוי בהעדפה
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // אם המשתמש הוא אדמין, רנדר את הנתיב המקונן
    console.log("AdminProtectedRoute: User is admin, rendering Outlet.");
    return <Outlet />; // ירנדר את AdminUserList או נתיב אדמין אחר
};

export default AdminProtectedRoute;
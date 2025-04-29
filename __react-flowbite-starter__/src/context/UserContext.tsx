import { createContext, useContext, useEffect, useState, ReactNode } from "react";
// ודא שהספרייה מותקנת: npm install jwt-decode
import { jwtDecode } from "jwt-decode";

// ממשק המשתמש (אפשר להוסיף עוד שדות מהטוקן אם צריך)
interface User {
    id: string;
    isAdmin?: boolean;
    email?: string; // לדוגמה, אם email נמצא בטוקן
}

// הטיפוס של הקונטקסט
interface UserContextType {
    user: User | null;
    isLoading: boolean; // <-- המצב החדש שהוספנו
    login: (token: string) => void;
    logout: () => void;
}

// יצירת הקונטקסט
const UserContext = createContext<UserContextType | undefined>(undefined);

// קומפוננטת ה-Provider
export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    // הוספת מצב הטעינה, מתחיל כ-true
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // בדיקת טוקן בטעינה ראשונית
    useEffect(() => {
        console.log("UserProvider useEffect: Checking token on initial load...");
        // הפעלת מצב הטעינה מחדש למקרה שזה רץ שוב (נדיר עם [])
        // setIsLoading(true); // בדרך כלל לא נחוץ עם [] אבל לא מזיק
        try {
            const token = localStorage.getItem("token");
            if (token) {
                console.log("UserProvider useEffect: Token found, decoding...");
                // TODO: כדאי להוסיף בדיקה אם הטוקן פג תוקף לפני הפענוח
                const decoded = jwtDecode<User>(token);
                console.log("UserProvider useEffect: Decoded user:", decoded);
                setUser(decoded);
            } else {
                console.log("UserProvider useEffect: No token found.");
                setUser(null);
            }
        } catch (error) {
            console.error("UserProvider useEffect: Error decoding token:", error);
            localStorage.removeItem("token"); // נקה טוקן לא תקין
            setUser(null);
        } finally {
            // בכל מקרה (הצלחה או כישלון), סיימנו את בדיקת הטעינה
            console.log("UserProvider useEffect: Finished check, setting loading to false.");
            setIsLoading(false);
        }
    }, []); // הרצה פעם אחת בלבד כשהקומפוננטה נטענת

    // פונקציית התחברות
    const login = (token: string) => {
        console.log("UserContext: login function called.");
        try {
            localStorage.setItem("token", token);
            const decoded = jwtDecode<User>(token);
            setUser(decoded);
            setIsLoading(false); // סיימנו לטעון/להתחבר
            console.log("UserContext: User state updated after login:", decoded);
        } catch (error) {
            console.error("UserContext: Error decoding token during login:", error);
            // אם יש שגיאה בפענוח טוקן שהתקבל, עדיף להתנתק
            logout();
        }
    };

    // פונקציית התנתקות
    const logout = () => {
        console.log("UserContext: logout function called.");
        localStorage.removeItem("token");
        setUser(null);
        setIsLoading(false); // סיימנו לטעון/להתנתק
    };

    // החזרת ה-Provider עם הערכים המעודכנים (כולל isLoading)
    return (
        <UserContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </UserContext.Provider>
    );
};

// Hook לצריכת הקונטקסט
export const useAuth = (): UserContextType => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useAuth must be used within a UserProvider");
    }
    return context;
};

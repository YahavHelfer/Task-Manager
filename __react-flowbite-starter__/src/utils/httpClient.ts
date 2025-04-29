// src/utils/httpClient.ts (או שם הקובץ שלך)
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// === יצירת מופע ייעודי של axios ===
const httpClient = axios.create({
    // !!! שנה לכתובת המלאה והנכונה של ה-API שלך !!!
    baseURL: 'http://localhost:5000/api', // <--- שנה בהתאם לפורט ולנתיב שלך!
    // timeout: 5000,
});
// ===================================

// --- Request Interceptor ---
httpClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token'); // *** ודא ש'token' הוא המפתח הנכון ***
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // console.log('Starting Request:', config);
        return config;
    },
    (error: AxiosError) => {
        console.error('Request Interceptor Error:', error);
        return Promise.reject(error);
    }
);

// --- Response Interceptor - עם הטיפול ב-401 ---
httpClient.interceptors.response.use(
    (response) => {
        // תגובה תקינה
        return response;
    },
    async (error: AxiosError) => {
        console.error('Response Interceptor Error:', error.response?.status, error.message);

        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // --- בדיקה ותגובה לשגיאת 401 ---
        if (error.response && error.response.status === 401 && !originalRequest?._retry) {
            console.warn('>>> Interceptor: 401 Unauthorized detected. Logging out and redirecting.');

            if(originalRequest) {
                 originalRequest._retry = true;
            }

            if (window.location.pathname !== '/signin') {
                console.log('>>> Interceptor: Path is not /signin. Attempting to remove token and redirect...');
                try {
                    const tokenKey = 'token'; // *** ודא ש'token' הוא המפתח הנכון ***
                    localStorage.removeItem(tokenKey);
                    console.log(`>>> Interceptor: Token removed from localStorage (key: ${tokenKey})`);
                    window.location.href = '/signin'; // הפניה
                    console.log('>>> Interceptor: Redirect initiated.');
                } catch (e) {
                    console.error(">>> Interceptor: Error during token removal or redirect:", e);
                }
                return Promise.reject(new Error('Session expired or invalid. Redirecting...'));
            } else {
                console.warn('>>> Interceptor: Already on /signin page. Not redirecting.');
            }
        }
        // --- סוף הבדיקה ל-401 ---

        // עבור כל שגיאה אחרת, העבר אותה הלאה
        return Promise.reject(error);
    }
);
// ==========================================================

// ייצא את המופע הייעודי שיצרנו
export default httpClient;
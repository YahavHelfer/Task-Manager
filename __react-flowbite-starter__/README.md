Task Manager
מערכת ניהול משימות Full-Stack מתקדמת המאפשרת למשתמשים לנהל את המשימות שלהם ביעילות, עם יכולות ניהול משתמשים ומשימות למנהלי מערכת. הפרויקט נבנה באמצעות React (עם Vite) בצד הלקוח, Node.js/Express בצד השרת, MongoDB לאחסון נתונים, ו-Tailwind CSS לעיצוב.

## ✨ פיצ'רים מרכזיים

* **ניהול משימות מקיף (CRUD):**
    * יצירת משימות חדשות עם כותרת, תיאור ותאריך יעד.
    * עריכת פרטי משימות קיימות.
    * מחיקת משימות.
* **מעקב וארגון משימות:**
    * סימון סטטוס התקדמות למשימות (למשל: 'Pending', 'In Progress', 'Done').
    * סימון משימות כמועדפות (⭐) לגישה מהירה והדגשה.
    * הוספת תאריך יעד לכל משימה.
* **מיון וסינון גמישים:**
    * מיון רשימת המשימות לפי תאריך יצירה, תאריך יעד או סטטוס.
    * סינון דינמי של משימות לפי סטטוס, משימות מועדפות, ומשתמש משויך (זמין למנהלי מערכת).
* **ניהול משתמשים והרשאות:**
    * מערכת הרשמה והתחברות מאובטחת למשתמשים.
    * תפקידי משתמשים: משתמש רגיל ומנהל מערכת (Admin).
* **יכולות אדמין ייחודיות:**
    * יכולת לשייך/להקצות משימות קיימות או חדשות למשתמשים ספציפיים במערכת.
    * יכולת להעניק או לשלול הרשאות מנהל ממשתמשים אחרים.

## 🚀 טכנולוגיות

* **Frontend:** React, Vite, Tailwind CSS, **Axios**, [React Router? Zustand/Redux/Context API?]
* **Backend:** Node.js, Express.js, **Mongoose**, JWT
* **Database:** MongoDB
* 
* **כלים נוספים:** ESLint, Prettier (לפי קבצי ההגדרות בפרויקט)

## 🛠️ התקנה והרצה

**דרישות קדם:**

* Node.js (גרסה מומלצת: [ציין גרסה, לדוגמה: 18.x ומעלה])
* npm או yarn
* MongoDB מותקן ורץ (מקומי או ב-Atlas)

**שלבי התקנה:**

1.  **שכפול ה-Repository:**
    ```bash
    git clone (https://github.com/YahavHelfer/Task-Manager.git)
    cd _react-flowbite-starter__
    ```

2.  **התקנת תלויות Backend:**
    ```bash
    cd server
    npm install # או yarn install
    ```

3.  **התקנת תלויות Frontend (מתיקיית השורש):**
    ```bash
    cd .. # אם נכנסת לתיקיית server קודם
    npm install # או yarn install
    ```

4.  **הגדרות סביבה (Backend):**
    * 
      ```dotenv
      # server/.env.example
      MONGO_URI=mongodb+srv://yahavhelfer7:MyNewPass123@cluster0.wuu6f.mongodb.net/tasksmanager?retryWrites=true&w=majority&appName=Cluster0
PORT=5000
JWT_SECRET=MySecretKey 
      ```


6.  **הרצת הפרויקט:**
    * **הפעלת השרת (Backend) - מתוך תיקיית `server`:**
        ```bash
        cd server
        npm run dev 
        ```
    * **הפעלת הלקוח (Frontend) - מתוך תיקיית השורש:**
        * פתח טרמינל חדש.
        * ודא שאתה נמצא בתיקיית **השורש** של הפרויקט.
        ```bash
        npm run dev

7.  פתח את הדפדפן ועבור לכתובת שמוצגת בטרמינל של ה-Frontend (לרוב `http://localhost:5173` עבור Vite).

## 🏗️ מבנה הפרויקט (תיקיות עיקריות)

/
├── public/            # קבצים סטטיים ל-Frontend
├── server/            # קוד ה-Backend (Node.js/Express)
│   ├── config/        # [אם קיים] קבצי הגדרות (DB, וכו')
│   ├── controllers/   # לוגיקה עסקית וטיפול בבקשות
│   ├── middleware/    # [אם קיים] פונקציות Middleware (אימות, לוגים וכו')
│   ├── models/        # סכמות MongoDB (Mongoose)
│   ├── routes/        # הגדרות נתיבי API
│   └── server.js      # (או index.js) קובץ הכניסה הראשי של השרת
├── src/               # קוד ה-Frontend (React)
│   ├── assets/        # [אם קיים] תמונות, פונטים וכו'
│   ├── components/    # רכיבי React לשימוש חוזר
│   ├── context/       # [אם משתמשים ב-Context API]
│   ├── hooks/         # [אם משתמשים ב-Custom Hooks]
│   ├── pages/         # רכיבי עמודים מלאים
│   ├── services/      # [אם קיים] פונקציות לתקשורת עם ה-API (כנראה משתמש ב-Axios)
│   ├── App.jsx        # הרכיב הראשי של האפליקציה
│   └── main.jsx       # קובץ הכניסה הראשי של ה-Frontend (Vite)
├── .env.example       # [מומלץ מאוד להוסיף] דוגמה לקובץ הגדרות סביבה ל-Backend
├── .eslintrc.cjs      # הגדרות ESLint
├── .gitignore         # קבצים ותיקיות להתעלמות ע"י Git
├── LICENSE            # קובץ הרישיון (MIT)
├── package.json       # הגדרות ותלויות Frontend + סקריפטים
├── postcss.config.js  # הגדרות PostCSS (משמש את Tailwind)
├── prettier.config.js # הגדרות Prettier
├── tailwind.config.js # הגדרות Tailwind CSS
├── tsconfig.json      # הגדרות TypeScript (אם כי נראה שהפרויקט ב-JS/JSX לפי השמות)
├── tsconfig.node.json # הגדרות TypeScript ל-Node (אולי קשור ל-Vite)
└── vite.config.ts     # הגדרות Vite


## 📜 רישיון

פרויקט זה מופץ תחת רישיון MIT. ראה את קובץ ה-[LICENSE](LICENSE) המצורף לפרטים נוספים.

## 🤝 תרומה לפרויקט (Contributing)

כרגע, הפרויקט אינו פתוח באופן רשמי לתרומות חיצוניות, אך ניתן לפתוח Issues לדיווח על באגים או הצעות לשיפורים.

## 📞 יצירת קשר

[שם מלא / כינוי] - [כתובת אימייל או קישור לפרופיל GitHub/LinkedIn] - [קישור לאתר אישי, אם יש]

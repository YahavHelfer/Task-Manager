// src/App.tsx

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Footer } from "flowbite-react";

// ייבוא הקומפוננטות והדפים
import TaskManager from "./components/TaskManager";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import About from "./pages/About";
import Favorites from "./pages/Favorites";
import AdminUserList from "./pages/AdminUserList";
// הסרנו את הייבוא של AdminTaskList

import { UserProvider } from "./context/UserContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import AppNavbar from "./components/Navbar"; // ודא שהנתיב נכון

function App() {
  const currentYear = new Date().getFullYear();

  return (
    <UserProvider>
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
        <Router>
          <AppNavbar />
          <main className="flex-grow p-4">
            <Routes>
              {/* נתיב מוגן למשתמש רגיל */}
              <Route path="/" element={<ProtectedRoute />}>
                <Route index element={<TaskManager />} />
                <Route path="favorites" element={<Favorites />} />
              </Route>

              {/* נתיב מוגן לאדמין */}
              <Route path="/admin" element={<AdminProtectedRoute />}>
                <Route path="users" element={<AdminUserList />} />
                {/* הנתיב לניהול משימות הוסר */}
              </Route>

              {/* נתיבים ציבוריים */}
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/about" element={<About />} />

              {/* 404 */}
              <Route path="*" element={<div>404 Not Found</div>} />
            </Routes>
          </main>
        </Router>

        {/* Footer - עם השינויים המבוקשים */}
        <Footer container className="border-t border-gray-200 rounded-none shadow-none dark:bg-gray-900 dark:border-gray-700">
          <div className="w-full text-center">
            {/* 1. שינוי שם בעל זכויות היוצרים */}
            <Footer.Copyright href="#" by="Task Manager by Yahav Helfer" year={currentYear} />
            <Footer.LinkGroup className="flex justify-center mt-3 space-x-4">
              {/* 2. שינוי קישור צור קשר ל-mailto וטקסט לאנגלית */}
              <Footer.Link href="mailto:yahavhelfer7@gmail.com">Contact Me</Footer.Link>
              {/* 3. שינוי טקסט אודות לאנגלית */}
              <Footer.Link href="/about">About</Footer.Link>
            </Footer.LinkGroup>
          </div>
        </Footer>
        {/* --- סוף Footer --- */}

      </div>
    </UserProvider>
  );
}

export default App;
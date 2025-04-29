import { useState } from "react";
import axios from "axios";
import { Button, Label, TextInput, Alert } from "flowbite-react";
// 1. הוספת ייבוא עבור Link
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/UserContext"; // ודא שהנתיב נכון

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    // הלוגים שהוספנו קודם נשארים בינתיים, אפשר להסיר אותם אם תרצה
    console.log("handleLogin started...");
    try {
      console.log("Sending login request...");
      const res = await axios.post("http://localhost:5000/api/auth/signin", {
        email,
        password,
      });
      console.log("Received response:", res);

      const token = res.data.token;
      console.log("Token received:", token);

      if (token) {
        login(token); // שימוש בפונקציית הקונטקסט
        console.log("Called context login function");
        console.log("Attempting to navigate to '/'...");
        navigate("/");
        console.log("Navigation call complete.");

      } else {
        console.error("Token was not found in response data!");
        setError("Login succeeded but token was not received.");
      }

    } catch (err: unknown) {
      console.error("!!! ERROR CAUGHT IN CATCH BLOCK !!!", err);
      const error = err as { response?: { data?: { message?: string } } };
      console.error("Login failed (processed error):", error.response || err);
      setError(error.response?.data?.message || "Login failed");
    }
    console.log("handleLogin finished.");
  };


  return (
    // עוטפים ב-Fragment או ב-div חיצוני אם צריך
    <>
      {/* --- הכותרת הראשית החדשה --- */}
      <h1 className="my-8 text-4xl font-extrabold tracking-tight text-center text-gray-900 dark:text-white md:text-5xl">
        Task Manager
      </h1>
      {/* --- סוף הכותרת --- */}


      {/* התיבה של טופס ההתחברות הקיימת */}
      {/* (אופציונלי) הוספתי עיצוב קל לתיבה עצמה עם רקע וצל */}
      <div className="max-w-md p-6 mx-auto bg-white rounded-lg shadow-md dark:bg-gray-800">
        {/* ממקמים את הכותרת "Sign In" במרכז */}
        <h2 className="mb-4 text-2xl font-bold text-center text-gray-900 dark:text-white">
          Sign In
        </h2>
        {error && <Alert color="failure" className="mb-4">{error}</Alert>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email" value="Email" />
            <TextInput
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="password" value="Password" />
            <TextInput
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {/* (אופציונלי) כפתור ברוחב מלא */}
          <Button type="submit" className="w-full">Login</Button>
        </form>

        {/* קישור להרשמה */}
        <div className="mt-4 text-sm text-center text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-cyan-600 hover:underline dark:text-cyan-500">
            Sign Up
          </Link>

          
          <span className="mx-2">|</span>

          {/* קישור לאודות */}
          <Link to="/about" className="font-medium text-cyan-600 hover:underline dark:text-cyan-500">
            About
          </Link>
        </div>
        {/* --- סוף הקישורים --- */}

      </div>
    </>
  );
}
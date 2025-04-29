import { useState } from "react";
import axios from "axios";
import { Button, Label, TextInput, Alert } from "flowbite-react";
import { useNavigate, Link } from "react-router-dom";

export default function SignUp() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  // Password regex (using the original English error message context)
  const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$&*])(?=.{8,})/;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation for first and last name
    if (!firstName || !lastName) {
      // English error message
      setError("First name and last name are required.");
      return;
    }

    // Password validation
    if (!passwordRegex.test(password)) {
      // English error message (consistent with original intention)
      setError("Password must be at least 8 characters and include an uppercase letter and symbol.");
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/auth/register", {
        firstName,
        lastName,
        email,
        password,
      });

      // English success message
      setSuccess("Registered successfully! Redirecting to Sign In...");
      setTimeout(() => navigate("/signin"), 1500);

    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      console.error("Registration API error:", error.response || err);
      // Use server message if available, otherwise a generic English error
      setError(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <>
      <h1 className="my-8 text-4xl font-extrabold tracking-tight text-center text-gray-900 dark:text-white md:text-5xl">
        Task Manager
      </h1>
      <div className="max-w-md p-6 mx-auto bg-white rounded-lg shadow-md dark:bg-gray-800">
        <h2 className="mb-4 text-2xl font-bold text-center text-gray-900 dark:text-white">
          Sign Up
        </h2>
        {error && <Alert color="failure" className="mb-4">{error}</Alert>}
        {success && <Alert color="success" className="mb-4">{success}</Alert>}
        <form onSubmit={handleRegister} className="space-y-4">
          {/* First Name Input */}
          <div>
            {/* English Label */}
            <Label htmlFor="firstName" value="First Name" />
            <TextInput
              id="firstName"
              type="text"
              // English Placeholder
              placeholder="Enter first name"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>

          {/* Last Name Input */}
          <div>
            {/* English Label */}
            <Label htmlFor="lastName" value="Last Name" />
            <TextInput
              id="lastName"
              type="text"
              // English Placeholder
              placeholder="Enter last name"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          {/* Email Input */}
          <div>
            {/* English Label */}
            <Label htmlFor="email" value="Email" />
            <TextInput
              id="email"
              type="email"
              placeholder="name@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password Input */}
          <div>
            {/* English Label */}
            <Label htmlFor="password" value="Password" />
            <TextInput
              id="password"
              type="password"
              placeholder="********"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full">Register</Button>
        </form>
        <div className="mt-4 text-sm text-center text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/signin" className="font-medium text-cyan-600 hover:underline dark:text-cyan-500">
            Sign In
          </Link>
        </div>
      </div>
    </>
  );
}
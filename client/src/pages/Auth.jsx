import React, { useContext, useState } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [formState, setFromState] = useState(0); // 0 for Sign Up, 1 for Sign In
  const [message, setMessage] = useState(""); // Keeping for consistency, though 'toast' handles most messages
  const [error, setError] = useState(""); // Keeping for consistency, though 'toast' handles most errors
  const { handleRegister, handleLogin } = useContext(AuthContext);
  const navigate = useNavigate();

  let handleAuth = async (e) => {
    e.preventDefault(); // Stop default form submission

    try {
      if (formState === 0) { // Sign Up logic
        let res = await handleRegister(name, username, password);
        toast.success("Registered successfully!");
        toast("Please log in"); // Prompt user to log in after registration
        setUsername(""); // Clear username for potential login
        setName("");
        setPassword("");
        setMessage(res); // Set message from registration response
        setFromState(1); // Switch to login form after successful registration
      } else if (formState === 1) { // Sign In logic
        await handleLogin(username, password);
        setUsername(""); // Clear username after successful login
        setPassword(""); // Clear password after successful login
        toast.success("User logged in successfully");
        // navigate("/home"); // Uncomment this if you want to navigate after successful login
      }
    } catch (error) {
      console.log(error);
      let msg = error.response?.data?.message || "Something went wrong!";
      toast.error(msg);
      // setError(msg); // Set error message
    }
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 font-sans flex-col">
      {/* Main Content */}
      <div className="flex flex-1">
        {/* Left Side Image Container with Branding */}
        <div className="hidden md:block md:w-1/2 relative"> {/* Added relative positioning */}
          {/* Branding on top-left corner of the image */}
          <div className="absolute top-6 left-6 z-10"> {/* Adjusted positioning for branding */}
            <h1
              className="text-3xl font-extrabold text-orange-500 cursor-pointer tracking-wide"
              onClick={() => navigate("/")}
            >
              Viora
            </h1>
          </div>
          <img
            src="/mountain.avif" // Replace with your actual image path
            alt="Abstract background"
            className="h-full w-full object-cover"
          />
        </div>

        {/* Right Side Form */}
        <div className="flex flex-col justify-center items-center w-full md:w-1/2 px-8 sm:px-16 lg:px-24 bg-gradient-to-b from-black via-gray-900 to-gray-800 shadow-2xl">
          <div className="text-center mb-8">
            {/* Logo/Icon */}
            <div className="w-16 h-16 mx-auto bg-orange-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <svg
                className="h-8 w-8 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M12 11c1.656 0 3-1.343 3-3S13.656 5 12 5 9 6.343 9 8s1.344 3 3 3z" />
                <path d="M12 14c-2.67 0-8 1.337-8 4v2h16v-2c0-2.663-5.33-4-8-4z" />
              </svg>
            </div>

            {/* Tab-like navigation for Sign Up / Sign In */}
            <div className="flex gap-4 p-1 rounded-lg bg-gray-800 border border-gray-700 mx-auto w-fit">
              <h2
                className={`text-xl font-semibold px-6 py-2 rounded-md cursor-pointer transition-all duration-300 ${
                  formState === 0 ? "bg-orange-600 text-white shadow-md" : "text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                }`}
                onClick={() => setFromState(0)}
              >
                Sign Up
              </h2>
              <h2
                className={`text-xl font-semibold px-6 py-2 rounded-md cursor-pointer transition-all duration-300 ${
                  formState === 1 ? "bg-orange-600 text-white shadow-md" : "text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                }`}
                onClick={() => setFromState(1)}
              >
                Sign In
              </h2>
            </div>
          </div>

          <form className="w-full max-w-sm" onSubmit={handleAuth}>
            {formState === 0 && ( // Conditionally render Full Name for Sign Up
              <div className="mb-5">
                <label htmlFor="fullName" className="block text-sm font-medium mb-2 text-gray-300">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  className="w-full px-5 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent transition-colors duration-200"
                  placeholder="John Doe"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            <div className="mb-5">
              <label htmlFor="username" className="block text-sm font-medium mb-2 text-gray-300">
                User Name
              </label>
              <input
                id="username"
                type="text"
                required
                className="w-full px-5 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent transition-colors duration-200"
                placeholder="@john_doe"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium mb-2 text-gray-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                className="w-full px-5 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent transition-colors duration-200"
                placeholder="••••••••"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-600 rounded bg-gray-700 cursor-pointer"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-300 cursor-pointer">
                  Remember me
                </label>
              </div>
              {/* You could add a "Forgot Password?" link here if needed */}
              {/* <a href="#" className="text-sm text-orange-500 hover:text-orange-400 transition-colors duration-200">Forgot Password?</a> */}
            </div>

            <button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              {formState === 0 ? "SIGN UP" : "SIGN IN"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
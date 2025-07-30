import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function Landing() {
  // const token = localStorage.getItem("token");
  const [token, setToken] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, []); // Remove token from dependency array
  const handleLogInClick = () => {
    navigate("/auth");
  };
  const handleLogoutClick = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("username")
    toast.success("User logged out successfully");
    setToken(""); // Update the state immediately
  };
  const handleCLick = ()=>{
     navigate("/home")
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-gray-800 text-white font-sans">
      {/* Top Navbar */}
      <div className="flex justify-between items-center px-6 py-4">
        <h1 className="text-2xl font-bold">Viora</h1>
        <div className="space-x-4">
          {/* <button className="text-sm hover:underline">Join as Guest</button> */}
          {token ? (
            <button
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1 rounded text-sm font-semibold"
              onClick={handleLogoutClick}
            >
              logout
            </button>
          ) : (
            <>
              <button
                className="text-sm hover:underline"
                onClick={handleLogInClick}
              >
                Register
              </button>
              <button
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1 rounded text-sm font-semibold"
                onClick={handleLogInClick}
              >
                login
              </button>
            </>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <div className="flex flex-col-reverse lg:flex-row items-center justify-between px-6 lg:px-16 py-12 gap-8  md:mt-[5rem]">
        {/* Left Text Content */}
        <div className="lg:w-1/2 space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold leading-tight">
            <span className="text-orange-500">Connect</span> with your <br />{" "}
            Loved Ones
          </h2>
          <p className="text-lg text-gray-300">Cover a distance by Viora</p>
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium"onClick={handleCLick}>
            Get Started
          </button>
        </div>

        {/* Right Image Content */}
        <div className="lg:w-1/2 flex justify-center relative">
          <img src="/mobile.png" alt="Person 1" className="md:h-[30rem]" />
        </div>
      </div>
    </div>
  );
}

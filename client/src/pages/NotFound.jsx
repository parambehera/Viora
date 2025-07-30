// src/pages/NotFound.jsx

import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] flex items-center justify-center px-4">
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)] rounded-2xl p-10 w-full max-w-md text-center">
        <h1 className="text-7xl font-extrabold text-orange-500 mb-4">404</h1>
        <p className="text-white text-xl font-semibold mb-2">Page Not Found</p>
        <p className="text-gray-300 mb-6">
          The page you’re looking for doesn’t exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-orange-500 hover:bg-orange-600 transition rounded-full text-white font-semibold shadow-[0_0_10px_rgba(255,165,0,0.4)] hover:shadow-[0_0_20px_rgba(255,165,0,0.7)]"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

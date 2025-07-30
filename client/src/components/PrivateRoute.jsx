// components/PrivateRoute.jsx
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { validateToken } from "../utils/auth";
import toast from "react-hot-toast";
const PrivateRoute = ({ children }) => {
  const [authorized, setAuthorized] = useState(null);

  useEffect(() => {
    (async () => {
      const isValid = await validateToken();
      setAuthorized(isValid);
      if (!isValid) {
        toast.error("please logged in first");
        localStorage.removeItem("token");
      }
    })();
  }, []);

  if (authorized === null) return <div>Loading...</div>;

  return authorized ? children : <Navigate to="/auth" replace />;
};

export default PrivateRoute;

// utils/auth.js
export const validateToken = async () => {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.ok;
  } catch (err) {
    return false;
  }
};

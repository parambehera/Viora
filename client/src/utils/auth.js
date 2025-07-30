// utils/auth.js
export const validateToken = async () => {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const res = await fetch("http://localhost:3000/api/v1/users/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.ok;
  } catch (err) {
    return false;
  }
};

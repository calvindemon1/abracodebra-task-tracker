// src/utils/auth.js

export const getToken = () => localStorage.getItem("token");

export const authHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const isLoggedIn = () => !!getToken();

// Modif dikit biar sekalian nyimpen permission & user pas login
export const login = (token, user = null, permissions = []) => {
  localStorage.setItem("token", token);
  if (user) localStorage.setItem("user", JSON.stringify(user));
  if (permissions)
    localStorage.setItem("permissions", JSON.stringify(permissions));
};

// Modif dikit biar sekalian ngehapus semuanya pas logout
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("permissions");
};

// src/context/AuthContext.jsx
import { createContext, useContext, createSignal } from "solid-js";
// Import utility yang tadi lu bikin
import {
  login as authLogin,
  logout as authLogout,
  getToken,
} from "../utils/auth";

const AuthContext = createContext();

export function AuthProvider(props) {
  // Bikin state reaktif dari localStorage
  const [token, setToken] = createSignal(getToken());
  const [user, setUser] = createSignal(
    JSON.parse(localStorage.getItem("user")) || null,
  );
  const [permissions, setPermissions] = createSignal(
    JSON.parse(localStorage.getItem("permissions")) || [],
  );

  // Fungsi Login untuk UI (Dipanggil pas beres fetch API login)
  const login = (userData, userToken, rawPermissions) => {
    // Ubah JSON array object jadi array string biar gampang (contoh: ["create_user", "read_user"])
    const permissionList = rawPermissions.map((p) => p.permission_name);

    // 1. Update State UI
    setToken(userToken);
    setUser(userData);
    setPermissions(permissionList);

    // 2. Simpan ke LocalStorage pake utility lu
    authLogin(userToken, userData, permissionList);
  };

  // Fungsi Logout untuk UI
  const logout = () => {
    // 1. Bersihin State UI
    setToken(null);
    setUser(null);
    setPermissions([]);

    // 2. Bersihin LocalStorage pake utility lu
    authLogout();
  };

  // Helper sakti buat cek akses tombol Create/Update/Delete
  const hasPermission = (permissionName) => {
    return permissions().includes(permissionName);
  };

  return (
    <AuthContext.Provider
      value={{ token, user, permissions, login, logout, hasPermission }}
    >
      {props.children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth harus dipakai di dalam AuthProvider bro!");
  }
  return context;
}

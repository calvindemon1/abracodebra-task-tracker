import { api } from "./api";

export const AuthService = {
  getUser() {
    return api.get("/auth/user");
  },
  login(data) {
    return api.post("/auth/login", data);
  },
  register(data) {
    return api.post("/auth/register", data);
  },
  updateProfile(data) {
    return api.put("/auth/profile", data);
  },
  changePassword(data) {
    return api.put("/auth/changepassword", data);
  },
};

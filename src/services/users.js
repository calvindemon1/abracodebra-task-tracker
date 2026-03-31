import { api } from "./api";

export const UsersService = {
  list() {
    return api.get("/users");
  },
  getById(id) {
    return api.get(`/users/${id}`);
  },
  register(data) {
    return api.post("/users", data);
  },
  login(data) {
    return api.post("/login", data);
  },
  update(id, data) {
    return api.put(`/users/${id}`, data);
  },
  updatePassword(id, data) {
    return api.put(`/change-password/${id}`, data);
  },
  delete(id) {
    return api.delete(`/users/${id}`);
  },
  refreshToken() {
    return api.post("/refresh-token");
  },
  sessionStatus() {
    return api.post("/session-status");
  },
};

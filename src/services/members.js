import { api } from "./api";

export const MembersService = {
  list() {
    return api.get("/members");
  },
  getById(id) {
    return api.get(`/members/${id}`);
  },
  create(data) {
    return api.post("/members", data);
  },
  update(id, data) {
    return api.put(`/members/${id}`, data);
  },
  delete(id) {
    return api.delete(`/members/${id}`);
  },
};

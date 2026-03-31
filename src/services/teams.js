import { api } from "./api";

export const TeamsService = {
  list() {
    return api.get("/teams");
  },
  getById(id) {
    return api.get(`/teams/${id}`);
  },
  create(data) {
    return api.post("/teams", data);
  },
  update(id, data) {
    return api.put(`/teams/${id}`, data);
  },
  delete(id) {
    return api.delete(`/teams/${id}`);
  },
};

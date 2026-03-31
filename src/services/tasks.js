import { api } from "./api";

export const TasksService = {
  list() {
    return api.get("/tasks");
  },
  getById(id) {
    return api.get(`/tasks/${id}`);
  },
  create(data) {
    return api.post("/tasks", data);
  },
  update(id, data) {
    return api.put(`/tasks/${id}`, data);
  },
  delete(id) {
    return api.delete(`/tasks/${id}`);
  },
};

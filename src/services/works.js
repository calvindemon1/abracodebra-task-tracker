import { api } from "./api";

export const WorksService = {
  list() {
    return api.get("/work");
  },
  getByTask(id) {
    return api.get(`/work/task/${id}`);
  },
  create(data) {
    return api.post("/work", data);
  },
  update(id, data) {
    return api.put(`/work/${id}`, data);
  },
  delete(id) {
    return api.delete(`/work/${id}`);
  },
};

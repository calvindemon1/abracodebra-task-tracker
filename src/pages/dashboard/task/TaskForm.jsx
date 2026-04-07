import { createSignal, onMount, Show, For, createEffect, on } from "solid-js";
import { createStore } from "solid-js/store";
import { useNavigate, useParams } from "@solidjs/router";
import {
  Loader2,
  Trash2,
  CheckCircle2,
  Layers,
  Plus,
  ChevronDown,
  GripVertical,
  XCircle,
} from "lucide-solid";
import Swal from "sweetalert2";
import { TasksService } from "../../../services/tasks";
import { UsersService } from "../../../services/users";
import { ProjectsService } from "../../../services/projects";
import { WorksService } from "../../../services/works";

const CATEGORIES = [
  "Graphic Design",
  "Animation",
  "Set & Stage",
  "Music/Audio",
  "Development",
];

const toast = (title, icon = "success") => {
  Swal.fire({
    title,
    icon,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
    background: "#0a0a0a",
    color: "#fff",
  });
};

export default function TaskForm() {
  const navigate = useNavigate();
  const params = useParams();
  const [isLoading, setIsLoading] = createSignal(false);
  const [users, setUsers] = createSignal([]);
  const [projects, setProjects] = createSignal([]);
  const [projectId, setProjectId] = createSignal("");
  const [store, setStore] = createStore({ assignments: [] });

  // STATE UNTUK COLLAPSE (Simpan ID task yang sedang terbuka)
  const [expandedTasks, setExpandedTasks] = createSignal(new Set());

  const toggleExpand = (taskId) => {
    const newSet = new Set(expandedTasks());
    if (newSet.has(taskId)) newSet.delete(taskId);
    else newSet.add(taskId);
    setExpandedTasks(newSet);
  };

  const calculateStatus = (task) => {
    // Jika status manual diset CANCEL, biarkan CANCEL
    if (task.status === "CANCEL") return "CANCEL";

    if (!task.logs || task.logs.length === 0) return "TODO";
    const doneCount = task.logs.filter((l) => l.is_done).length;
    if (doneCount === 0) return "ON_HOLD";
    if (doneCount === task.logs.length) return "DONE";
    return "IN_PROGRESS";
  };

  onMount(async () => {
    try {
      const [resUsers, resProjects] = await Promise.all([
        UsersService.list(),
        ProjectsService.list(),
      ]);
      setUsers(resUsers.data || resUsers || []);
      setProjects(resProjects.data || resProjects || []);
    } catch (err) {
      console.error("Master Data Error:", err);
    }
  });

  createEffect(
    on(
      () => params.id,
      async (currentId) => {
        if (!currentId) {
          setStore("assignments", []);
          return;
        }
        setIsLoading(true);
        try {
          const res = await ProjectsService.getById(currentId);
          const resTask = await TasksService.list();
          const projectData = res.data || res;
          const allTasks = resTask.data || resTask || [];

          if (!projectData) throw new Error("Project Not Found");
          setProjectId(projectData.id.toString());

          const filteredTasks = allTasks.filter(
            (t) => t.project_id === parseInt(currentId),
          );

          if (filteredTasks.length > 0) {
            const mappedTasks = await Promise.all(
              filteredTasks.map(async (t) => {
                const resWorks = await WorksService.getByTask(t.id);
                const worksData = resWorks.data || [];
                let logs = worksData.map((w) => ({
                  id: w.id,
                  category: w.division_pic || CATEGORIES[0],
                  activity: w.activity_name || "",
                  notes: w.notes || "",
                  is_done: w.status?.toLowerCase() === "done",
                }));
                logs.sort((a, b) =>
                  a.is_done === b.is_done ? 0 : a.is_done ? 1 : -1,
                );

                return {
                  id: t.id,
                  title: t.title || "",
                  assignee_id: t.assignee_id ? t.assignee_id.toString() : "",
                  priority: t.priority || "NORMAL",
                  status: t.status || "TODO",
                  logs: logs,
                };
              }),
            );
            setStore("assignments", mappedTasks);
          }
        } catch (err) {
          console.error("Fetch Detail Error:", err);
        } finally {
          setIsLoading(false);
        }
      },
    ),
  );

  const syncTask = async (task) => {
    if (!projectId() || !task.title || !task.assignee_id) return;
    const payload = {
      project_id: parseInt(projectId()),
      title: task.title,
      priority: task.priority,
      assignee_id: parseInt(task.assignee_id),
      status: calculateStatus(task),
    };

    try {
      if (typeof task.id === "number") {
        await TasksService.update(task.id, payload);
      } else {
        const res = await TasksService.create(payload);
        const newId = res.data?.id || res.id;
        const idx = store.assignments.findIndex((a) => a.id === task.id);
        if (idx !== -1) setStore("assignments", idx, "id", newId);
        toast("Task created");
      }
    } catch (err) {
      toast("Sync task failed", "error");
    }
  };

  const handleCancelTask = async (assignmentIdx) => {
    const task = store.assignments[assignmentIdx];
    const isCanceled = task.status === "CANCEL";

    const confirm = await Swal.fire({
      title: isCanceled ? "Reactivate Task?" : "Cancel Task?",
      text: isCanceled
        ? "Kembalikan status task ini?"
        : "Task ini akan ditandai sebagai CANCEL.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: isCanceled ? "#3b82f6" : "#ef4444",
      background: "#0a0a0a",
      color: "#fff",
    });

    if (confirm.isConfirmed) {
      const nextStatus = isCanceled ? "TODO" : "CANCEL";
      setStore("assignments", assignmentIdx, "status", nextStatus);
      await syncTask(store.assignments[assignmentIdx]);
      toast(isCanceled ? "Task Reactivated" : "Task Canceled");
    }
  };

  const syncWork = async (task, log) => {
    if (typeof task.id !== "number") return;
    const payload = {
      task_id: task.id,
      activity_name: log.activity || "-",
      notes: log.notes || "",
      division_pic: log.category || CATEGORIES[0],
      status: log.is_done ? "Done" : "In Progress",
    };
    try {
      if (typeof log.id === "number") {
        await WorksService.update(log.id, payload);
      } else {
        const res = await WorksService.create(payload);
        const newWorkId = res.data?.id || res.id;
        const taskIdx = store.assignments.findIndex((a) => a.id === task.id);
        const logIdx = store.assignments[taskIdx].logs.findIndex(
          (l) => l.id === log.id,
        );
        setStore("assignments", taskIdx, "logs", logIdx, "id", newWorkId);
      }
      await syncTask(task);
    } catch (err) {
      console.error(err);
    }
  };

  const addAssignment = () => {
    const tempId = `temp-task-${Date.now()}`;
    setStore("assignments", (prev) => [
      ...prev,
      {
        id: tempId,
        title: "",
        assignee_id: "",
        priority: "NORMAL",
        status: "TODO",
        logs: [],
      },
    ]);
    toggleExpand(tempId); // Langsung buka form pas nambah baru
  };

  const addLog = (assignmentIdx) => {
    setStore("assignments", assignmentIdx, "logs", (prev) => [
      {
        id: `temp-log-${Date.now()}`,
        category: CATEGORIES[0],
        activity: "",
        notes: "",
        is_done: false,
      },
      ...prev,
    ]);
  };

  const removeAssignment = async (id, idx) => {
    const confirm = await Swal.fire({
      title: "Hapus Task?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      background: "#0a0a0a",
      color: "#fff",
    });
    if (!confirm.isConfirmed) return;
    if (typeof id === "number") await TasksService.delete(id);
    setStore("assignments", (prev) => prev.filter((_, i) => i !== idx));
  };

  const removeLog = async (assignmentIdx, logId) => {
    if (typeof logId === "number") {
      await WorksService.delete(logId);
      const task = store.assignments[assignmentIdx];
      const resWorks = await WorksService.getByTask(task.id);
      setStore(
        "assignments",
        assignmentIdx,
        "logs",
        resWorks.data.map((w) => ({
          id: w.id,
          category: w.division_pic,
          activity: w.activity_name,
          notes: w.notes,
          is_done: w.status?.toLowerCase() === "done",
        })),
      );
      await syncTask(task);
    } else {
      setStore("assignments", assignmentIdx, "logs", (prev) =>
        prev.filter((l) => l.id !== logId),
      );
    }
  };

  return (
    <div class="p-6 max-w-5xl mx-auto mb-20 text-white italic">
      <Show
        when={!isLoading()}
        fallback={
          <div class="py-40 text-center">
            <Loader2 size={48} class="animate-spin mx-auto opacity-20" />
          </div>
        }
      >
        <div class="space-y-10">
          {/* PROJECT SELECTOR */}
          <div class="bg-blue-600/10 rounded-[32px] border border-blue-500/20 p-8 shadow-2xl">
            <div class="flex items-center gap-4 mb-6">
              <Layers size={24} class="text-blue-500" />
              <h3 class="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">
                Master Project
              </h3>
            </div>
            <select
              class="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-xl font-black outline-none appearance-none cursor-pointer"
              value={projectId()}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="" class="bg-black text-gray-500 italic">
                -- SELECT PROJECT --
              </option>
              <For each={projects()}>
                {(p) => (
                  <option value={p.id} class="bg-black text-white">
                    {p.name}
                  </option>
                )}
              </For>
            </select>
          </div>

          <div class="flex justify-between items-center px-4">
            <h3 class="text-xs font-black text-gray-500 uppercase tracking-[0.4em]">
              Live Assignments
            </h3>
            <button
              onClick={addAssignment}
              class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl text-[10px] font-black flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus size={16} /> ADD NEW ASSIGNEE
            </button>
          </div>

          {/* LIST ASSIGNMENTS */}
          <For each={store.assignments}>
            {(assignment, assignmentIdx) => {
              const isExpanded = () => expandedTasks().has(assignment.id);
              const status = () => calculateStatus(assignment);
              const isCanceled = () => status() === "CANCEL";

              return (
                <div
                  class={`assignment-card transition-all duration-500 border rounded-[40px] relative shadow-xl mb-6 overflow-hidden
                ${isCanceled() ? "bg-red-950/20 border-red-500 shadow-red-500/20" : "bg-gray-900/40 border-white/10"}
              `}
                >
                  {/* Color Side Bar */}
                  <div
                    class={`absolute top-0 left-0 w-1.5 h-full transition-colors duration-500 ${
                      isCanceled()
                        ? "bg-red-600"
                        : status() === "DONE"
                          ? "bg-green-600"
                          : "bg-blue-600"
                    }`}
                  ></div>

                  {/* HEADER (Always Visible) */}
                  <div
                    class="flex items-center justify-between p-6 cursor-pointer group select-none"
                    onClick={() => toggleExpand(assignment.id)}
                  >
                    <div class="flex items-center gap-6 flex-1">
                      <div class="flex flex-col min-w-[200px]">
                        <span class="text-[8px] font-black text-gray-600 uppercase tracking-widest">
                          Task Title
                        </span>
                        <h4
                          class={`text-sm font-black uppercase tracking-tight truncate ${isCanceled() ? "text-red-500" : "text-white"}`}
                        >
                          {assignment.title || "UNTITLED TASK"}
                        </h4>
                      </div>
                      <div class="hidden md:flex flex-col border-l border-white/5 pl-6">
                        <span class="text-[8px] font-black text-gray-600 uppercase tracking-widest">
                          Assignee
                        </span>
                        <span class="text-[10px] font-bold text-gray-400">
                          {users().find(
                            (u) =>
                              u.id.toString() ===
                              assignment.assignee_id.toString(),
                          )?.name || "Unassigned"}
                        </span>
                      </div>
                      <div class="hidden md:flex flex-col border-l border-white/5 pl-6">
                        <span class="text-[8px] font-black text-gray-600 uppercase tracking-widest">
                          Priority
                        </span>
                        <span
                          class={`text-[10px] font-black ${assignment.priority === "URGENT" ? "text-red-500" : "text-blue-400"}`}
                        >
                          {assignment.priority}
                        </span>
                      </div>
                    </div>

                    <div class="flex items-center gap-4">
                      <span
                        class={`text-[8px] font-black px-2 py-1 rounded border transition-all ${
                          isCanceled()
                            ? "border-red-500 text-red-500 bg-red-500/10"
                            : status() === "DONE"
                              ? "border-green-500 text-green-500 bg-green-500/10"
                              : "border-blue-500 text-blue-500 bg-blue-500/10"
                        }`}
                      >
                        {status()}
                      </span>
                      <div
                        class={`transition-transform duration-300 ${isExpanded() ? "rotate-180" : ""}`}
                      >
                        <ChevronDown size={18} class="text-gray-600" />
                      </div>
                    </div>
                  </div>

                  {/* COLLAPSIBLE CONTENT */}
                  <Show when={isExpanded()}>
                    <div class="p-8 pt-2 border-t border-white/5 animate-in slide-in-from-top-2 duration-300">
                      <div class="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
                        <div class="md:col-span-5 space-y-2">
                          <label class="text-[10px] font-black text-gray-600 uppercase">
                            Edit Title
                          </label>
                          <input
                            type="text"
                            class="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:border-blue-500"
                            value={assignment.title}
                            onInput={(e) =>
                              setStore(
                                "assignments",
                                assignmentIdx(),
                                "title",
                                e.target.value,
                              )
                            }
                            onBlur={() => syncTask(assignment)}
                          />
                        </div>
                        <div class="md:col-span-3 space-y-2">
                          <label class="text-[10px] font-black text-gray-600 uppercase">
                            Assignee
                          </label>
                          <select
                            class="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm font-bold outline-none"
                            value={assignment.assignee_id}
                            onChange={(e) => {
                              setStore(
                                "assignments",
                                assignmentIdx(),
                                "assignee_id",
                                e.target.value,
                              );
                              syncTask(assignment);
                            }}
                          >
                            <option value="" class="bg-black">
                              Select User
                            </option>
                            <For each={users()}>
                              {(u) => (
                                <option value={u.id} class="bg-black">
                                  {u.name}
                                </option>
                              )}
                            </For>
                          </select>
                        </div>
                        <div class="md:col-span-2 space-y-2">
                          <label class="text-[10px] font-black text-gray-600 uppercase">
                            Priority
                          </label>
                          <select
                            class="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm font-bold outline-none"
                            value={assignment.priority}
                            onChange={(e) => {
                              setStore(
                                "assignments",
                                assignmentIdx(),
                                "priority",
                                e.target.value,
                              );
                              syncTask(assignment);
                            }}
                          >
                            <option value="NORMAL" class="bg-black">
                              NORMAL
                            </option>
                            <option value="HIGH" class="bg-black">
                              HIGH
                            </option>
                            <option value="URGENT" class="bg-black">
                              URGENT
                            </option>
                          </select>
                        </div>
                        <div class="md:col-span-2 flex items-end justify-end gap-2">
                          <button
                            onClick={() => handleCancelTask(assignmentIdx())}
                            class={`p-3 rounded-xl transition-all active:scale-90 ${isCanceled() ? "bg-red-600 text-white shadow-lg shadow-red-600/30" : "bg-white/5 text-gray-600 hover:text-red-500 border border-white/5"}`}
                          >
                            <XCircle size={20} />
                          </button>
                          <button
                            onClick={() =>
                              removeAssignment(assignment.id, assignmentIdx())
                            }
                            class="p-3 bg-white/5 border border-white/5 text-gray-600 hover:text-red-500 rounded-xl transition-all active:scale-90"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>

                      <div class="bg-black/20 rounded-[28px] p-6 border border-white/5">
                        <div class="flex justify-between items-center mb-6">
                          <h4 class="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">
                            Activities
                            <span class="ml-2 text-blue-500">
                              ({assignment.logs.filter((l) => l.is_done).length}{" "}
                              / {assignment.logs.length})
                            </span>
                          </h4>
                          <button
                            onClick={() => addLog(assignmentIdx())}
                            class="text-[10px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-tighter"
                          >
                            + ADD ITEM
                          </button>
                        </div>

                        <div class="space-y-4">
                          <For each={assignment.logs}>
                            {(log, logIdx) => (
                              <div class="flex items-start gap-4 group/item p-2 rounded-2xl transition-all hover:bg-white/5 border border-transparent">
                                <div class="mt-2.5 text-gray-700 opacity-30 group-hover/item:opacity-100">
                                  <GripVertical size={16} />
                                </div>
                                <button
                                  onClick={async () => {
                                    const newStatus = !log.is_done;
                                    setStore(
                                      "assignments",
                                      assignmentIdx(),
                                      "logs",
                                      logIdx(),
                                      "is_done",
                                      newStatus,
                                    );
                                    await syncWork(assignment, {
                                      ...log,
                                      is_done: newStatus,
                                    });
                                  }}
                                  class={`p-2.5 mt-1 rounded-xl transition-all ${log.is_done ? "bg-green-600 text-black shadow-lg shadow-green-600/30" : "bg-white/5 text-gray-600 hover:bg-white/10"}`}
                                >
                                  <CheckCircle2 size={16} />
                                </button>
                                <div class="flex flex-col flex-1 gap-2">
                                  <input
                                    type="text"
                                    placeholder="Activity name..."
                                    class={`bg-transparent text-sm font-bold outline-none border-b border-white/5 focus:border-blue-500 transition-all ${log.is_done ? "text-green-500/50 line-through" : "text-white"}`}
                                    value={log.activity}
                                    onInput={(e) =>
                                      setStore(
                                        "assignments",
                                        assignmentIdx(),
                                        "logs",
                                        logIdx(),
                                        "activity",
                                        e.target.value,
                                      )
                                    }
                                    onBlur={() => syncWork(assignment, log)}
                                  />
                                  <input
                                    type="text"
                                    placeholder="Live Notes..."
                                    class="bg-transparent text-[10px] text-gray-500 outline-none"
                                    value={log.notes || ""}
                                    onInput={(e) =>
                                      setStore(
                                        "assignments",
                                        assignmentIdx(),
                                        "logs",
                                        logIdx(),
                                        "notes",
                                        e.target.value,
                                      )
                                    }
                                    onBlur={() => syncWork(assignment, log)}
                                  />
                                </div>
                                <button
                                  onClick={() =>
                                    removeLog(assignmentIdx(), log.id)
                                  }
                                  class="p-2 mt-1 text-gray-700 hover:text-red-500 transition-all opacity-0 group-hover/item:opacity-100 active:scale-75"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            )}
                          </For>
                        </div>
                      </div>
                    </div>
                  </Show>
                </div>
              );
            }}
          </For>
        </div>
      </Show>
    </div>
  );
}

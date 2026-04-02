import { createSignal, For, Show, onMount, onCleanup } from "solid-js";
import { useNavigate, A } from "@solidjs/router";
import {
  MoreVertical,
  Pencil,
  Trash2,
  Plus,
  Loader2,
  Layers,
  ChevronDown,
  ChevronUp,
  User,
  CheckCircle,
} from "lucide-solid";
import Swal from "sweetalert2";
import { Portal } from "solid-js/web";
import { ProjectsService } from "../../../services/projects";
import { TasksService } from "../../../services/tasks"; // IMPORT INI BRO

export default function TaskList() {
  const navigate = useNavigate();
  const [isMounted, setIsMounted] = createSignal(false);
  const [projects, setProjects] = createSignal([]);
  const [isLoading, setIsLoading] = createSignal(true);
  const [openActionId, setOpenActionId] = createSignal(null);
  const [expandedId, setExpandedId] = createSignal(null);
  const [dropdownPos, setDropdownPos] = createSignal({ x: 0, y: 0 });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Tarik kedua data sekaligus
      const [resProj, resTasks] = await Promise.all([
        ProjectsService.list(),
        TasksService.list(),
      ]);

      const rawProjects = resProj.data || resProj || [];
      const allTasks = resTasks.data || resTasks || [];

      // 2. Gabungkan data: Masukkan tasks ke dalam project masing-masing
      const mergedData = rawProjects.map((proj) => {
        return {
          ...proj,
          tasks: allTasks.filter((t) => t.project_id === proj.id),
        };
      });

      // 3. REVISI DISINI: Filter hanya project yang memiliki minimal 1 task
      const activeProjects = mergedData.filter((proj) => proj.tasks.length > 0);

      setProjects(activeProjects);
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "CONNECTION ERROR",
        background: "#0a0a0a",
        color: "#fff",
      });
    } finally {
      setIsLoading(false);
    }
  };

  onMount(() => {
    fetchData();
    setTimeout(() => setIsMounted(true), 100);
    const handleGlobalClick = (e) => {
      if (
        !e.target.closest("[data-action-trigger]") &&
        !e.target.closest("[data-dropdown-content]")
      ) {
        setOpenActionId(null);
      }
    };
    window.addEventListener("mousedown", handleGlobalClick);
    onCleanup(() => window.removeEventListener("mousedown", handleGlobalClick));
  });

  // LOGIC PROGRESS PER TASK (Sub-tasks)
  const calculateTaskProgress = (logs = []) => {
    if (!logs || logs.length === 0) return 0;
    const done = logs.filter((l) => l.is_done).length;
    return Math.round((done / logs.length) * 100);
  };

  // LOGIC PROGRESS TOTAL PROJECT
  const calculateTotalProgress = (tasks = []) => {
    if (!tasks || tasks.length === 0) return 0;
    // Jika backend ga ngasih logs di list task,
    // kita asumsikan progress berdasarkan status task
    const doneTasks = tasks.filter((t) => t.status === "DONE").length;
    return Math.round((doneTasks / tasks.length) * 100);
  };

  const getUniqueAssignees = (tasks = []) => {
    // Ambil nama dari assignee_name atau assignee.name
    const names = tasks
      .map((t) => t.assignee_name || t.assignee?.name)
      .filter(Boolean);
    return [...new Set(names)];
  };

  const handleDeleteProject = async (id) => {
    const confirm = await Swal.fire({
      title: "DELETE PROJECT?",
      text: "Data permanen akan hilang!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      background: "#0a0a0a",
      color: "#fff",
    });
    if (confirm.isConfirmed) {
      try {
        await ProjectsService.delete(id);
        setProjects((prev) => prev.filter((p) => p.id !== id));
        setOpenActionId(null);
      } catch (err) {
        Swal.fire("Error", "Gagal hapus", "error");
      }
    }
  };

  return (
    <div class="p-6 min-h-screen text-white font-sans">
      <style>{`
        .page-enter { animation: pageIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes pageIn { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        .expand-enter { animation: expandIn 0.4s ease-out forwards; }
        @keyframes expandIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div
        class={`max-w-[1600px] mx-auto ${isMounted() ? "page-enter" : "opacity-0"}`}
      >
        <div class="flex justify-between items-end mb-12">
          <div>
            <h1 class="text-5xl font-black tracking-tighter uppercase italic text-white">
              Project Hub
            </h1>
            <p class="text-gray-600 text-[10px] font-black uppercase tracking-[0.4em] mt-2">
              Active Monitoring System
            </p>
          </div>
          <A
            href="/main/task/create"
            class="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-blue-500 active:scale-95 transition-all shadow-2xl flex items-center gap-2 text-xs uppercase tracking-widest"
          >
            <Plus size={18} /> New Assignment
          </A>
        </div>

        <Show
          when={!isLoading()}
          fallback={
            <div class="py-20 text-center flex flex-col items-center gap-4">
              <Loader2
                class="animate-spin text-blue-500 opacity-50"
                size={48}
              />
              <span class="text-[10px] font-black uppercase tracking-widest text-gray-500">
                Loading Assignments...
              </span>
            </div>
          }
        >
          <div class="bg-gray-900/40 backdrop-blur-3xl rounded-[40px] border border-white/10 overflow-hidden shadow-2xl">
            <table class="w-full text-left">
              <thead class="bg-white/5 text-[9px] uppercase font-black tracking-[0.3em] text-gray-500 border-b border-white/5">
                <tr>
                  <th class="p-8 w-12"></th>
                  <th class="p-8">Project Details</th>
                  <th class="p-8">Team</th>
                  <th class="p-8 text-center">Stats</th>
                  <th class="p-8 text-center">Progress</th>
                  <th class="p-8 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                <For each={projects()}>
                  {(project) => (
                    <>
                      <tr
                        class={`group hover:bg-white/[0.02] transition-all cursor-pointer ${expandedId() === project.id ? "bg-white/[0.03]" : ""}`}
                        onClick={() =>
                          setExpandedId(
                            expandedId() === project.id ? null : project.id,
                          )
                        }
                      >
                        <td class="p-8 text-center">
                          {expandedId() === project.id ? (
                            <ChevronUp size={18} class="text-blue-500" />
                          ) : (
                            <ChevronDown size={18} class="text-gray-600" />
                          )}
                        </td>
                        <td class="p-8">
                          <div class="flex items-center gap-4">
                            <div class="p-4 bg-blue-600/10 rounded-2xl text-blue-500 border border-blue-500/10">
                              <Layers size={24} />
                            </div>
                            <div>
                              <div class="font-black text-xl tracking-tighter uppercase group-hover:text-blue-400 transition-colors italic">
                                {project.name}
                              </div>
                              <div class="flex items-center gap-2 mt-1">
                                <span class="text-[9px] font-black text-gray-500 bg-white/5 px-2 py-0.5 rounded uppercase tracking-widest border border-white/5">
                                  {project.project_identity}
                                </span>
                                <span
                                  class={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${project.status === "DONE" ? "border-green-500/30 text-green-500" : "border-blue-500/30 text-blue-500"}`}
                                >
                                  {project.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td class="p-8">
                          <div class="flex items-center">
                            <Show
                              when={project.tasks && project.tasks.length > 0}
                              fallback={
                                <span class="text-[10px] font-black text-gray-700 italic opacity-50">
                                  No Workforce
                                </span>
                              }
                            >
                              <For
                                each={getUniqueAssignees(project.tasks).slice(
                                  0,
                                  3,
                                )}
                              >
                                {(name) => (
                                  <div
                                    title={name}
                                    class="w-9 h-9 rounded-full border-2 border-gray-900 bg-blue-600 flex items-center justify-center text-[10px] font-black -ml-3 first:ml-0 text-white uppercase shadow-lg transition-transform hover:-translate-y-1"
                                  >
                                    {name.substring(0, 2)}
                                  </div>
                                )}
                              </For>
                              <Show
                                when={
                                  getUniqueAssignees(project.tasks).length > 3
                                }
                              >
                                <div class="text-[10px] font-black text-gray-600 ml-2">
                                  +
                                  {getUniqueAssignees(project.tasks).length - 3}
                                </div>
                              </Show>
                            </Show>
                          </div>
                        </td>
                        <td class="p-8 text-center">
                          <div class="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <span class="text-white text-lg italic">
                              {project.tasks?.length || 0}
                            </span>{" "}
                            Tasks
                          </div>
                        </td>
                        <td class="p-8">
                          <div class="flex flex-col items-center gap-2">
                            <div class="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                              <div
                                class="h-full bg-blue-500 transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                style={{
                                  width: `${calculateTotalProgress(project.tasks)}%`,
                                }}
                              ></div>
                            </div>
                            <span class="text-[10px] font-black text-blue-400">
                              {calculateTotalProgress(project.tasks)}% Complete
                            </span>
                          </div>
                        </td>
                        <td class="p-8 text-right">
                          <button
                            data-action-trigger
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect =
                                e.currentTarget.getBoundingClientRect();
                              setDropdownPos({
                                x: rect.left - 180,
                                y: rect.bottom + 10,
                              });
                              setOpenActionId(project.id);
                            }}
                            class="p-3 hover:bg-white/10 rounded-xl text-gray-500 transition-all active:scale-75"
                          >
                            <MoreVertical size={18} />
                          </button>
                        </td>
                      </tr>

                      <Show when={expandedId() === project.id}>
                        <tr class="bg-black/40 expand-enter border-b border-white/5">
                          <td colspan="6" class="p-12">
                            <Show
                              when={project.tasks && project.tasks.length > 0}
                              fallback={
                                <div class="text-center py-10 opacity-20 italic uppercase font-black tracking-widest">
                                  No detailed assignments found
                                </div>
                              }
                            >
                              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <For each={project.tasks}>
                                  {(task) => (
                                    <div class="bg-white/5 border border-white/5 rounded-[32px] p-8 flex flex-col gap-6 hover:border-blue-500/30 transition-all relative overflow-hidden group/card">
                                      <div class="flex justify-between items-start relative z-10">
                                        <div class="flex items-center gap-4">
                                          <div class="w-12 h-12 rounded-2xl bg-gray-800 flex items-center justify-center text-blue-400 border border-white/5 group-hover/card:bg-blue-600 group-hover/card:text-white transition-all">
                                            <User size={20} />
                                          </div>
                                          <div>
                                            <div class="text-[11px] font-black uppercase text-white tracking-tight">
                                              {task.assignee_name ||
                                                "Unassigned"}
                                            </div>
                                            <div class="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mt-0.5 italic">
                                              {task.title}
                                            </div>
                                          </div>
                                        </div>
                                        <div
                                          class={`text-[8px] font-black px-2 py-1 rounded-md border ${task.status === "DONE" ? "border-green-500/30 text-green-500 bg-green-500/5" : "border-blue-500/30 text-blue-500 bg-blue-500/5"}`}
                                        >
                                          {task.status}
                                        </div>
                                      </div>

                                      <div class="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-500 pt-4 border-t border-white/5">
                                        <span>Priority</span>
                                        <span
                                          class={
                                            task.priority === "URGENT"
                                              ? "text-red-500"
                                              : "text-blue-400"
                                          }
                                        >
                                          {task.priority}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </For>
                              </div>
                            </Show>
                          </td>
                        </tr>
                      </Show>
                    </>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Show>

        {/* DROPDOWN PORTAL */}
        <Show when={openActionId()}>
          <Portal>
            <div
              data-dropdown-content
              class="fixed w-56 bg-[#0a0a0a] border border-white/10 rounded-[28px] shadow-2xl z-[9999] p-2 animate-in fade-in zoom-in duration-200 backdrop-blur-xl"
              style={{
                top: `${dropdownPos().y}px`,
                left: `${dropdownPos().x}px`,
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/main/task/edit/${openActionId()}`);
                  setOpenActionId(null);
                }}
                class="w-full flex items-center gap-3 px-4 py-4 text-[10px] font-black text-gray-400 hover:bg-blue-600 hover:text-white rounded-2xl transition-all uppercase tracking-widest"
              >
                <Pencil size={14} /> Edit Assignment
              </button>
              <div class="h-px bg-white/5 my-1 mx-2"></div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteProject(openActionId());
                }}
                class="w-full flex items-center gap-3 px-4 py-4 text-[10px] font-black text-red-500 hover:bg-red-500/10 rounded-2xl transition-all uppercase tracking-widest"
              >
                <Trash2 size={14} /> Delete Project
              </button>
            </div>
          </Portal>
        </Show>
      </div>
    </div>
  );
}

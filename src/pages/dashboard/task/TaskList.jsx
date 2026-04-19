import {
  createSignal,
  For,
  Show,
  onMount,
  onCleanup,
  Switch,
  Match,
  createMemo,
} from "solid-js";
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
  XCircle,
  CheckCircle2,
  Search as SearchIcon,
  ArrowUpDown,
} from "lucide-solid";
import Swal from "sweetalert2";
import { Portal } from "solid-js/web";
import { ProjectsService } from "../../../services/projects";
import { TasksService } from "../../../services/tasks";

export default function TaskList() {
  const navigate = useNavigate();
  const [isMounted, setIsMounted] = createSignal(false);
  const [projects, setProjects] = createSignal([]);
  const [isLoading, setIsLoading] = createSignal(true);
  const [openActionId, setOpenActionId] = createSignal(null);
  const [expandedId, setExpandedId] = createSignal(null);
  const [dropdownPos, setDropdownPos] = createSignal({ x: 0, y: 0 });

  // Fitur States
  const [searchTerm, setSearchTerm] = createSignal("");
  const [filterStatus, setFilterStatus] = createSignal("ALL");
  const [sortOrder, setSortOrder] = createSignal("DEFAULT"); // DEFAULT, ASC (0-100), DESC (100-0)

  // Helper hitung progres (dipakai di logic sortir juga)
  const getProgressVal = (tasks = []) => {
    const activeTasks = tasks.filter((t) => t.status !== "CANCELLED");
    if (activeTasks.length === 0) return 0;
    return Math.round(
      (activeTasks.filter((t) => t.status === "DONE").length /
        activeTasks.length) *
        100,
    );
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resProj, resTasks] = await Promise.all([
        ProjectsService.list(),
        TasksService.list(),
      ]);

      const rawProjects = resProj.data || resProj || [];
      const allTasks = resTasks.data || resTasks || [];

      const mergedData = rawProjects.map((proj) => {
        const projectTasks = allTasks.filter((t) => t.project_id === proj.id);
        const activeTasks = projectTasks.filter(
          (t) => t.status !== "CANCELLED",
        );
        const cancelledTasks = projectTasks.filter(
          (t) => t.status === "CANCELLED",
        );

        let finalStatus = proj.status;
        const progress = getProgressVal(projectTasks);

        if (
          projectTasks.length > 0 &&
          cancelledTasks.length === projectTasks.length
        ) {
          finalStatus = "CANCELLED";
        } else if (
          activeTasks.length > 0 &&
          activeTasks.every((t) => t.status === "DONE")
        ) {
          finalStatus = "DONE";
        } else if (progress >= 80) {
          finalStatus = "ALMOST DONE";
        }

        return {
          ...proj,
          status: finalStatus,
          tasks: projectTasks,
          progressVal: progress,
        };
      });

      setProjects(mergedData.filter((proj) => proj.tasks.length > 0));
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

  // --- LOGIC SEARCH, FILTER, SORT ---
  const filteredAndSortedProjects = createMemo(() => {
    let list = [...projects()];

    // 1. Search
    if (searchTerm()) {
      list = list.filter((p) =>
        p.name.toLowerCase().includes(searchTerm().toLowerCase()),
      );
    }

    // 2. Filter Status
    if (filterStatus() !== "ALL") {
      list = list.filter((p) => p.status === filterStatus());
    }

    // 3. Sort berdasarkan Persentase Progres
    const statusWeight = {
      TODO: 1,
      IN_PROGRESS: 2,
      "ALMOST DONE": 3,
      DONE: 4,
      CANCELLED: 5,
    };

    list.sort((a, b) => {
      // Sort Manual (Header Click)
      if (sortOrder() === "ASC") return a.progressVal - b.progressVal; // 0% ke 100%
      if (sortOrder() === "DESC") return b.progressVal - a.progressVal; // 100% ke 0%

      // Default Sort: TODO Paling Atas
      return (statusWeight[a.status] || 99) - (statusWeight[b.status] || 99);
    });

    return list;
  });

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

  const getUniqueAssignees = (tasks = []) => {
    return [
      ...new Set(
        tasks.map((t) => t.assignee_name || t.assignee?.name).filter(Boolean),
      ),
    ];
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
    <div class="p-6 min-h-screen text-white font-sans italic">
      <style>{`
        .page-enter { animation: pageIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes pageIn { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        .expand-enter { animation: expandIn 0.4s ease-out forwards; }
        @keyframes expandIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        tr { transition: background-color 0.4s ease; }
        
        .row-cancelled td { background-color: rgba(239, 68, 68, 0.04) !important; }
        .row-done td { background-color: rgba(34, 197, 94, 0.04) !important; }
        .row-almost-done td { background-color: rgba(234, 179, 8, 0.04) !important; }

        .custom-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(59, 130, 246, 0.5); }
      `}</style>

      <div
        class={`max-w-[1600px] mx-auto ${isMounted() ? "page-enter" : "opacity-0"}`}
      >
        <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 px-4">
          <div>
            <h1 class="text-6xl font-black tracking-tighter uppercase text-white leading-none">
              Project <span class="text-blue-500 font-light italic">Hub</span>
            </h1>
            <div class="flex items-center gap-4 mt-6">
              <div class="relative group">
                <SearchIcon
                  size={18}
                  class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors"
                />
                <input
                  type="text"
                  placeholder="Find project..."
                  class="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-3 text-sm font-bold outline-none focus:border-blue-500/50 w-64 transition-all shadow-inner"
                  value={searchTerm()}
                  onInput={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div class="flex items-center bg-white/5 border border-white/10 rounded-2xl p-1">
                <For each={["ALL", "DONE", "TODO", "CANCELLED"]}>
                  {(status) => (
                    <button
                      onClick={() => setFilterStatus(status)}
                      class={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${filterStatus() === status ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-gray-500 hover:text-white"}`}
                    >
                      {status}
                    </button>
                  )}
                </For>
              </div>
            </div>
          </div>
          <A
            href="/main/task/create"
            class="bg-blue-600 text-white px-8 py-5 rounded-2xl font-black hover:bg-blue-500 active:scale-95 transition-all shadow-2xl flex items-center gap-3 text-xs uppercase tracking-widest"
          >
            <Plus size={20} /> New Assignment
          </A>
        </div>

        <Show
          when={!isLoading()}
          fallback={
            <div class="py-40 text-center flex flex-col items-center gap-6">
              <Loader2
                class="animate-spin text-blue-500 opacity-20"
                size={64}
              />
              <span class="text-[10px] font-black uppercase tracking-widest text-gray-500 italic">
                Processing Assignments...
              </span>
            </div>
          }
        >
          <div class="bg-gray-900/40 backdrop-blur-3xl rounded-[40px] border border-white/10 shadow-2xl overflow-x-auto custom-scrollbar">
            <table class="w-full text-left border-collapse min-w-[1000px]">
              <thead class="bg-white/5 text-[9px] uppercase font-black tracking-[0.3em] text-gray-500 border-b border-white/5">
                <tr>
                  <th class="p-8 w-12 text-center">#</th>
                  <th class="p-8">Project Details</th>
                  <th class="p-8">Workforce</th>
                  <th class="p-8 text-center">Volume</th>
                  <th
                    class="p-8 text-center cursor-pointer hover:text-blue-500 transition-colors"
                    onClick={() =>
                      setSortOrder((prev) => (prev === "DESC" ? "ASC" : "DESC"))
                    }
                  >
                    <div class="flex items-center justify-center gap-2">
                      Status / Progress <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th class="p-8 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                <For each={filteredAndSortedProjects()}>
                  {(project) => {
                    const isCancelled = project.status === "CANCELLED";
                    const isDone = project.status === "DONE";
                    const isAlmostDone = project.status === "ALMOST DONE";
                    const rowBgClass = isCancelled
                      ? "row-cancelled"
                      : isDone
                        ? "row-done"
                        : isAlmostDone
                          ? "row-almost-done"
                          : "row-active";
                    const themeColor = isCancelled
                      ? "text-red-500"
                      : isDone
                        ? "text-green-500"
                        : isAlmostDone
                          ? "text-yellow-500"
                          : "text-blue-500";

                    return (
                      <>
                        <tr
                          class={`group transition-all cursor-pointer hover:bg-white/[0.02] ${rowBgClass} ${expandedId() === project.id ? "bg-white/[0.05]" : ""}`}
                          onClick={() =>
                            setExpandedId(
                              expandedId() === project.id ? null : project.id,
                            )
                          }
                        >
                          <td class="p-8 text-center">
                            {expandedId() === project.id ? (
                              <ChevronUp size={18} class={themeColor} />
                            ) : (
                              <ChevronDown size={18} class="text-gray-600" />
                            )}
                          </td>
                          <td class="p-8">
                            <div class="flex items-center gap-5">
                              <div
                                class={`p-4 rounded-2xl border transition-colors ${isCancelled ? "bg-red-500/10 border-red-500/20 text-red-500" : isDone ? "bg-green-500/10 border-green-500/20 text-green-500" : isAlmostDone ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500" : "bg-blue-600/10 border-blue-500/10 text-blue-500"}`}
                              >
                                <Layers size={24} />
                              </div>
                              <div>
                                <div
                                  class={`font-black text-2xl tracking-tighter uppercase transition-colors italic ${isCancelled ? "text-red-500/80" : isDone ? "text-green-500/80" : isAlmostDone ? "text-yellow-500/80" : "group-hover:text-blue-400"}`}
                                >
                                  {project.name}
                                </div>
                                <div class="flex items-center gap-2 mt-2">
                                  <span class="text-[9px] font-black text-gray-500 bg-white/5 px-2 py-0.5 rounded uppercase border border-white/5 tracking-widest">
                                    {project.project_identity}
                                  </span>
                                  <span
                                    class={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${isCancelled ? "border-red-500/30 text-red-500 bg-red-500/5" : isDone ? "border-green-500/30 text-green-500 bg-green-500/5" : isAlmostDone ? "border-yellow-500/30 text-yellow-500 bg-yellow-500/5" : "border-blue-500/30 text-blue-500"}`}
                                  >
                                    {project.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td class="p-8">
                            <div class="flex items-center">
                              <For
                                each={getUniqueAssignees(project.tasks).slice(
                                  0,
                                  3,
                                )}
                              >
                                {(name) => (
                                  <div
                                    title={name}
                                    class={`w-10 h-10 rounded-full border-2 border-gray-900 flex items-center justify-center text-[10px] font-black -ml-3 first:ml-0 text-white uppercase shadow-lg transition-transform hover:-translate-y-1 ${isCancelled ? "bg-red-900" : isDone ? "bg-green-700" : "bg-blue-600"}`}
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
                                <div
                                  class={`text-[10px] font-black ml-3 ${themeColor}`}
                                >
                                  +
                                  {getUniqueAssignees(project.tasks).length - 3}
                                </div>
                              </Show>
                            </div>
                          </td>
                          <td class="p-8 text-center">
                            <div class="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                              <span
                                class={`text-2xl italic font-black ${themeColor}`}
                              >
                                {project.tasks?.length || 0}
                              </span>{" "}
                              <br /> Tasks
                            </div>
                          </td>
                          <td class="p-8 text-center">
                            <Switch>
                              <Match when={isCancelled}>
                                <div class="flex flex-col items-center gap-1 opacity-70">
                                  <XCircle size={20} class="text-red-500" />
                                  <span class="text-[8px] font-black uppercase text-red-500 tracking-widest italic">
                                    Terminated
                                  </span>
                                </div>
                              </Match>
                              <Match when={isDone}>
                                <div class="flex flex-col items-center gap-1">
                                  <CheckCircle2
                                    size={24}
                                    class="text-green-500"
                                  />
                                  <span class="text-[8px] font-black uppercase text-green-500 tracking-widest leading-none italic">
                                    Complete
                                  </span>
                                </div>
                              </Match>
                              <Match when={isAlmostDone}>
                                <div class="flex flex-col items-center gap-2">
                                  <div class="flex items-center gap-2">
                                    <Loader2
                                      size={16}
                                      class="text-yellow-500 animate-[spin_3s_linear_infinite]"
                                    />
                                    <span class="text-[8px] font-black uppercase text-yellow-500 tracking-widest leading-none italic">
                                      Almost Done
                                    </span>
                                  </div>
                                  <div class="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <div
                                      class="h-full bg-yellow-500 transition-all duration-1000 shadow-[0_0_10px_rgba(234,179,8,0.3)]"
                                      style={{
                                        width: `${project.progressVal}%`,
                                      }}
                                    ></div>
                                  </div>
                                  <span class="text-[10px] font-black text-yellow-500 italic">
                                    {project.progressVal}%
                                  </span>
                                </div>
                              </Match>
                              <Match when={true}>
                                <div class="flex flex-col items-center gap-2">
                                  <div class="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <div
                                      class="h-full bg-blue-500 transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                                      style={{
                                        width: `${project.progressVal}%`,
                                      }}
                                    ></div>
                                  </div>
                                  <span class="text-[10px] font-black text-blue-400 italic">
                                    {project.progressVal}%
                                  </span>
                                </div>
                              </Match>
                            </Switch>
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
                              class="p-4 hover:bg-white/10 rounded-2xl text-gray-500 transition-all active:scale-75"
                            >
                              <MoreVertical size={20} />
                            </button>
                          </td>
                        </tr>
                        {/* Task Expansion Row */}
                        <Show when={expandedId() === project.id}>
                          <tr
                            class={`expand-enter border-b border-white/5 ${isCancelled ? "bg-red-600/[0.02]" : isDone ? "bg-green-600/[0.02]" : isAlmostDone ? "bg-yellow-600/[0.02]" : "bg-black/40"}`}
                          >
                            <td colspan="6" class="p-12">
                              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <For each={project.tasks}>
                                  {(task) => (
                                    <div
                                      class={`rounded-[32px] p-8 flex flex-col gap-6 border relative overflow-hidden ${task.status === "CANCELLED" ? "bg-red-500/5 border-red-500/20 grayscale" : task.status === "DONE" ? "bg-green-500/5 border-green-500/30" : "bg-white/5 border-white/5"}`}
                                    >
                                      <div class="flex justify-between items-start relative z-10">
                                        <div class="flex items-center gap-4">
                                          <div
                                            class={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${task.status === "CANCELLED" ? "bg-zinc-900 text-red-500 border-red-500/10" : task.status === "DONE" ? "bg-zinc-900 text-green-500 border-green-500/20" : "bg-gray-800 text-blue-400 border-white/5"}`}
                                          >
                                            {task.status === "CANCELLED" ? (
                                              <XCircle size={20} />
                                            ) : task.status === "DONE" ? (
                                              <CheckCircle2 size={20} />
                                            ) : (
                                              <User size={20} />
                                            )}
                                          </div>
                                          <div>
                                            <div
                                              class={`text-[11px] font-black uppercase tracking-tight ${task.status === "CANCELLED" ? "text-red-500" : task.status === "DONE" ? "text-green-500" : "text-white"}`}
                                            >
                                              {task.assignee_name ||
                                                "Unassigned"}
                                            </div>
                                            <div
                                              class={`text-[9px] font-black uppercase tracking-[0.2em] mt-0.5 italic ${task.status === "CANCELLED" ? "text-red-900" : "text-gray-600"}`}
                                            >
                                              {task.title}
                                            </div>
                                          </div>
                                        </div>
                                        <div
                                          class={`text-[8px] font-black px-2 py-1 rounded-md border ${task.status === "CANCELLED" ? "border-red-500/30 text-red-500" : task.status === "DONE" ? "border-green-500/30 text-green-500" : "border-blue-500/30 text-blue-500"}`}
                                        >
                                          {task.status}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </For>
                              </div>
                            </td>
                          </tr>
                        </Show>
                      </>
                    );
                  }}
                </For>
              </tbody>
            </table>
          </div>
        </Show>

        <Show when={openActionId()}>
          <Portal>
            <div
              data-dropdown-content
              class="fixed w-60 bg-[#0a0a0a] border border-white/10 rounded-[28px] shadow-2xl z-[9999] p-2 animate-in fade-in zoom-in duration-200 backdrop-blur-xl"
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
                class="w-full flex items-center gap-4 px-5 py-4 text-[10px] font-black text-gray-400 hover:bg-blue-600 hover:text-white rounded-2xl transition-all uppercase tracking-widest italic"
              >
                <Pencil size={16} /> Edit Assignment
              </button>
              <div class="h-px bg-white/5 my-2 mx-3"></div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteProject(openActionId());
                }}
                class="w-full flex items-center gap-4 px-5 py-4 text-[10px] font-black text-red-500 hover:bg-red-500/10 rounded-2xl transition-all uppercase tracking-widest italic"
              >
                <Trash2 size={16} /> Delete Project
              </button>
            </div>
          </Portal>
        </Show>
      </div>
    </div>
  );
}

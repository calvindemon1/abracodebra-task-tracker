import { createSignal, For, Show, onMount, onCleanup } from "solid-js";
import { useNavigate, A } from "@solidjs/router";
import {
  MoreVertical,
  Pencil,
  Trash2,
  Plus,
  Loader2,
  CheckCircle2,
  Clock,
  PlayCircle,
  AlertCircle,
  LayoutList,
  CalendarDays,
} from "lucide-solid";
import Swal from "sweetalert2";
import { Portal } from "solid-js/web";
import { TasksService } from "../../../services/tasks";
import { UsersService } from "../../../services/users";

export default function TaskList() {
  const navigate = useNavigate();
  const [isMounted, setIsMounted] = createSignal(false);
  const [tasks, setTasks] = createSignal([]);
  const [users, setUsers] = createSignal([]);
  const [isLoading, setIsLoading] = createSignal(true);
  const [openActionId, setOpenActionId] = createSignal(null);
  const [dropdownPos, setDropdownPos] = createSignal({ x: 0, y: 0 });
  const [viewMode, setViewMode] = createSignal("table");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resUsers, resTasks] = await Promise.all([
        UsersService.list(),
        TasksService.list(),
      ]);
      setUsers(resUsers.data || []);
      setTasks(resTasks.data || []);
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "CONNECTION ERROR",
        text: "Gagal ambil data dari server.",
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

    const handleScroll = () => {
      if (openActionId()) setOpenActionId(null);
    };

    window.addEventListener("mousedown", handleGlobalClick);
    window.addEventListener("scroll", handleScroll);
    onCleanup(() => {
      window.removeEventListener("mousedown", handleGlobalClick);
      window.removeEventListener("scroll", handleScroll);
    });
  });

  const getAssigneeName = (id) => {
    const user = users().find((u) => Number(u.id) === Number(id));
    return user ? user.name : "Unassigned";
  };

  const calculateProgress = (logs = []) => {
    if (!logs || logs.length === 0) return 0;
    const done = logs.filter((l) => l.is_done == true || l.is_done == 1).length;
    return Math.round((done / logs.length) * 100);
  };

  const handleDelete = async (id) => {
    const targetId = Number(id); // Pastikan Number
    const confirm = await Swal.fire({
      title: "HAPUS PROJECT?",
      text: "Data ini bakal hilang permanen!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      background: "#0a0a0a",
      color: "#fff",
    });

    if (confirm.isConfirmed) {
      try {
        await TasksService.delete(targetId);
        // Sync UI: filter dengan paksa tipe data yang sama
        setTasks((prev) => prev.filter((t) => Number(t.id) !== targetId));
        setOpenActionId(null);
        Swal.fire({
          title: "DELETED",
          icon: "success",
          background: "#0a0a0a",
          color: "#fff",
          timer: 1000,
          showConfirmButton: false,
        });
      } catch (err) {
        Swal.fire("Error", "Gagal hapus data", "error");
      }
    }
  };

  return (
    <div class="p-6 min-h-screen text-white">
      <style>{`
        .page-enter { animation: pageIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes pageIn { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        .shimmer { background: linear-gradient(90deg, #0a0a0a 25%, #1a1a1a 50%, #0a0a0a 75%); background-size: 200% 100%; animation: shimmer-ani 1.5s infinite linear; }
        @keyframes shimmer-ani { from { background-position: -200% 0; } to { background-position: 200% 0; } }
        .row-item { opacity: 0; animation: rowIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes rowIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div
        class={`max-w-[1600px] mx-auto ${isMounted() ? "page-enter" : "opacity-0"}`}
      >
        {/* HEADER */}
        <div class="flex justify-between items-end mb-10">
          <div>
            <h1 class="text-5xl font-black tracking-tighter uppercase italic text-white">
              Project Hub
            </h1>
            <p class="text-gray-600 text-xs font-black uppercase tracking-[0.4em] mt-2">
              Monitoring System — Live
            </p>
          </div>
          <div class="flex gap-4 items-center">
            <A
              href="/main/task/create"
              class="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center gap-2"
            >
              <Plus size={18} /> NEW PROJECT
            </A>
          </div>
        </div>

        {/* TABLE CONTENT */}
        <Show
          when={!isLoading()}
          fallback={
            <div class="py-20 text-center">
              <Loader2 class="animate-spin mx-auto opacity-20" size={40} />
            </div>
          }
        >
          <div class="bg-gray-900/40 backdrop-blur-3xl rounded-[40px] border border-white/10 overflow-hidden shadow-2xl">
            <table class="w-full text-left">
              <thead class="bg-white/5 text-[9px] uppercase font-black tracking-[0.3em] text-gray-500 border-b border-white/5">
                <tr>
                  <th class="p-8">Project Name</th>
                  <th class="p-8">Assignee</th>
                  <th class="p-8 text-center">Status</th>
                  <th class="p-8">Progress</th>
                  <th class="p-8 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                <For each={tasks()}>
                  {(task, index) => (
                    <tr
                      class="row-item group hover:bg-white/[0.02] transition-all duration-300"
                      style={{ "animation-delay": `${index() * 0.05}s` }}
                    >
                      <td class="p-8">
                        <div class="font-black text-xl tracking-tighter uppercase group-hover:text-blue-400 transition-colors">
                          {task.title}
                        </div>
                        <div class="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1 italic">
                          Priority: {task.priority}
                        </div>
                      </td>
                      <td class="p-8">
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center text-[10px] font-black uppercase">
                            {getAssigneeName(task.assignee_id).substring(0, 2)}
                          </div>
                          <span class="text-xs font-black uppercase text-gray-400 tracking-wider">
                            {getAssigneeName(task.assignee_id)}
                          </span>
                        </div>
                      </td>
                      <td class="p-8 text-center">
                        <span class="px-4 py-1.5 rounded-full text-[9px] font-black bg-white/5 border border-white/10 text-gray-500 uppercase tracking-widest">
                          {task.status}
                        </span>
                      </td>
                      <td class="p-8">
                        <div class="flex items-center gap-4">
                          <div class="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div
                              class="h-full bg-blue-500 transition-all duration-1000"
                              style={{
                                width: `${calculateProgress(task.logs)}%`,
                              }}
                            ></div>
                          </div>
                          <span class="text-[10px] font-black text-blue-400">
                            {calculateProgress(task.logs)}%
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
                            setOpenActionId(
                              openActionId() === task.id ? null : task.id,
                            );
                          }}
                          class="p-3 hover:bg-white/10 rounded-xl text-gray-500 transition-all active:scale-75"
                        >
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </tr>
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
              class="fixed w-56 bg-black border border-white/10 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-[9999] p-2 animate-in fade-in zoom-in duration-200"
              style={{
                top: `${dropdownPos().y}px`,
                left: `${dropdownPos().x}px`,
              }}
              onMouseDown={(e) => e.stopPropagation()} // Supaya gak nutup pas diklik dalemnya
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const id = openActionId();
                  navigate(`/main/task/edit/${id}`);
                  setOpenActionId(null);
                }}
                class="w-full flex items-center gap-3 px-4 py-4 text-[10px] font-black text-gray-400 hover:bg-blue-600 hover:text-white rounded-2xl transition-all uppercase tracking-widest"
              >
                <Pencil size={14} /> Edit Project
              </button>
              <div class="h-px bg-white/5 my-1 mx-2"></div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(openActionId());
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

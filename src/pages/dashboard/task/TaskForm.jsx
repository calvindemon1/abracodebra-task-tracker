import { createSignal, onMount, Show, For, createMemo, batch } from "solid-js";
import { useNavigate, useParams } from "@solidjs/router";
import { Loader2, ChevronLeft, Save, Trash2, CheckCircle2 } from "lucide-solid";
import Swal from "sweetalert2";
import { TasksService } from "../../../services/tasks";
import { UsersService } from "../../../services/users";

const CATEGORIES = [
  "Graphic Design",
  "Animation",
  "Set & Stage",
  "Music/Audio",
  "Development",
];

export default function TaskForm() {
  const navigate = useNavigate();
  const params = useParams();
  const isEdit = () => !!params.id;
  const logRefs = {};

  const [isLoading, setIsLoading] = createSignal(false);
  const [isSaving, setIsSaving] = createSignal(false);
  const [users, setUsers] = createSignal([]);

  const [form, setForm] = createSignal({
    title: "",
    assignee_id: "",
    status: "TODO",
    priority: "NORMAL",
    start_date: new Date().toISOString().slice(0, 10),
    due_date: new Date().toISOString().slice(0, 10),
  });

  // ID pakai temp- agar tidak dianggap integer oleh backend
  const [dailyLogs, setDailyLogs] = createSignal([
    {
      id: `temp-${Math.random()}`,
      category: CATEGORIES[0],
      activity: "",
      notes: "",
      is_done: false,
    },
  ]);

  const totalProgress = createMemo(() => {
    const logs = dailyLogs();
    if (!logs || logs.length === 0) return 0;
    const doneCount = logs.filter(
      (l) => l.is_done == true || l.is_done == 1 || l.is_done == "true",
    ).length;
    return Math.round((doneCount / logs.length) * 100);
  });

  onMount(async () => {
    setIsLoading(true);
    try {
      const resUsers = await UsersService.list();
      setUsers(resUsers.data || []);

      if (isEdit()) {
        const resTask = await TasksService.getById(params.id);
        const data = resTask.data || resTask;

        setForm({
          title: data.title,
          assignee_id: data.assignee_id,
          status: data.status,
          priority: data.priority,
          start_date: data.start_date?.slice(0, 10) || "",
          due_date: data.due_date?.slice(0, 10) || "",
        });

        if (data.logs && data.logs.length > 0) {
          setDailyLogs(
            data.logs.map((log) => ({
              id: log.id, // ID asli Number dari DB
              category: log.category,
              activity: log.activity,
              notes: log.notes || "",
              is_done: log.is_done == true || log.is_done == 1,
            })),
          );
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  });

  const updateLog = (id, field, val) => {
    batch(() => {
      setDailyLogs((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            if (field === "is_done") {
              const current = Boolean(
                item.is_done == true || item.is_done == 1,
              );
              return { ...item, is_done: !current };
            }
            return { ...item, [field]: val };
          }
          return item;
        }),
      );
    });
  };

  const addLog = () =>
    setDailyLogs([
      ...dailyLogs(),
      {
        id: `temp-${Math.random()}`,
        category: CATEGORIES[0],
        activity: "",
        notes: "",
        is_done: false,
      },
    ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const finalLogs = dailyLogs().map((log) => {
      const inputEl = logRefs[log.id];

      // Susun objek log tanpa ID dulu
      const logData = {
        category: log.category,
        activity: inputEl ? inputEl.value : log.activity,
        notes: log.notes || "",
        is_done: Boolean(log.is_done == true || log.is_done == 1),
      };

      // KUNCI: Hanya masukkan ID ke payload jika tipenya NUMBER (ID Database)
      // ID string 'temp-xxx' akan dibuang sehingga backend membuat ID baru
      if (typeof log.id === "number") {
        logData.id = log.id;
      }

      return logData;
    });

    const currentForm = form();
    const payload = {
      title: currentForm.title,
      assignee_id: parseInt(currentForm.assignee_id),
      status: currentForm.status,
      priority: currentForm.priority,
      start_date: currentForm.start_date,
      due_date: currentForm.due_date,
      logs: finalLogs,
    };

    try {
      if (isEdit()) await TasksService.update(params.id, payload);
      else await TasksService.create(payload);

      Swal.fire({
        icon: "success",
        title: "SYNCED",
        background: "#0a0a0a",
        color: "#fff",
        timer: 1500,
        showConfirmButton: false,
      });
      navigate("/main/task-list");
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Gagal Sync",
        text: "Pastikan database sudah di-reset ke INT",
        background: "#0a0a0a",
        color: "#fff",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div class="p-6 max-w-5xl mx-auto mb-20 text-white">
      <style>{`
        .section-in { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        select option { background: #1a1a1a; color: white; }
      `}</style>

      {/* HEADER */}
      <div class="flex justify-between items-center mb-12 section-in">
        <button
          onClick={() => navigate(-1)}
          class="flex items-center gap-3 text-gray-500 hover:text-white font-black transition-all"
        >
          <div class="p-2 bg-white/5 rounded-full">
            <ChevronLeft size={20} />
          </div>{" "}
          BACK
        </button>
        <div class="text-right space-y-2">
          <h2 class="text-3xl font-black tracking-tighter uppercase">
            {isEdit() ? "Update Project" : "New Project"}
          </h2>
          <div class="flex items-center gap-4 justify-end">
            <div class="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                class="h-full bg-blue-600 transition-all duration-1000"
                style={{ width: `${totalProgress()}%` }}
              ></div>
            </div>
            <span class="text-xs font-mono font-bold text-blue-400">
              {totalProgress()}%
            </span>
          </div>
        </div>
      </div>

      <Show
        when={!isLoading()}
        fallback={
          <div class="py-40 text-center">
            <Loader2 size={48} class="animate-spin mx-auto opacity-20" />
          </div>
        }
      >
        <form onSubmit={handleSubmit} class="space-y-8">
          {/* BASIC INFO */}
          <div class="bg-gray-900/40 backdrop-blur-3xl rounded-[32px] border border-white/10 p-8 section-in">
            <h3 class="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-8">
              Basic Info
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="md:col-span-2 space-y-2">
                <label class="text-[10px] font-black text-gray-500 uppercase ml-2">
                  Title
                </label>
                <input
                  required
                  type="text"
                  class="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-xl font-bold outline-none focus:border-blue-600 transition-all"
                  value={form().title}
                  onInput={(e) => setForm({ ...form(), title: e.target.value })}
                />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-gray-500 uppercase ml-2">
                  Assignee
                </label>
                <select
                  required
                  class="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 outline-none font-bold"
                  value={form().assignee_id}
                  onChange={(e) =>
                    setForm({ ...form(), assignee_id: e.target.value })
                  }
                >
                  <option value="">Pilih User</option>
                  <For each={users()}>
                    {(u) => <option value={u.id}>{u.name}</option>}
                  </For>
                </select>
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-gray-500 uppercase ml-2">
                  Priority
                </label>
                <select
                  class="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 outline-none font-bold"
                  value={form().priority}
                  onChange={(e) =>
                    setForm({ ...form(), priority: e.target.value })
                  }
                >
                  <option value="NORMAL">NORMAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </div>
            </div>
          </div>

          {/* WORK BREAKDOWN */}
          <div
            class="bg-gray-900/40 backdrop-blur-3xl rounded-[32px] border border-white/10 p-8 section-in"
            style="animation-delay: 0.1s"
          >
            <div class="flex justify-between items-center mb-10">
              <h3 class="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">
                Work Breakdown
              </h3>
              <button
                type="button"
                onClick={addLog}
                class="bg-white text-black px-6 py-2 rounded-xl text-[10px] font-black hover:scale-105 active:scale-95 transition-all"
              >
                + ADD TASK
              </button>
            </div>
            <div class="space-y-4">
              <For each={dailyLogs()}>
                {(log) => (
                  <TaskItem
                    log={log}
                    setRef={(el) => (logRefs[log.id] = el)}
                    updateLog={updateLog}
                    onDelete={(id) =>
                      setDailyLogs((prev) => prev.filter((l) => l.id !== id))
                    }
                  />
                )}
              </For>
            </div>
          </div>

          <div
            class="flex justify-end gap-6 section-in"
            style="animation-delay: 0.2s"
          >
            <button
              type="submit"
              disabled={isSaving()}
              class="bg-blue-600 px-12 py-5 rounded-[24px] font-black text-white shadow-2xl hover:scale-105 transition-all flex items-center gap-3"
            >
              <Show when={isSaving()} fallback={<Save size={20} />}>
                <Loader2 size={20} class="animate-spin" />
              </Show>
              SYNC PROJECT
            </button>
          </div>
        </form>
      </Show>
    </div>
  );
}

function TaskItem(props) {
  const isDone = () => props.log.is_done == true || props.log.is_done == 1;

  return (
    <div
      class={`flex items-center gap-6 p-6 rounded-[28px] border transition-all duration-500 ${isDone() ? "bg-green-500/10 border-green-500/20" : "bg-white/5 border-white/5 grayscale-[0.8]"}`}
    >
      <button
        type="button"
        onClick={() => props.updateLog(props.log.id, "is_done")}
        class={`p-4 rounded-2xl transition-all active:scale-90 ${isDone() ? "bg-green-600 text-black scale-110 shadow-lg" : "bg-white/5 text-gray-500 hover:text-white"}`}
      >
        <CheckCircle2 size={24} stroke-width={3} />
      </button>

      <div class="flex-1 space-y-1">
        <select
          class="bg-transparent text-[10px] font-black text-blue-500 uppercase outline-none"
          value={props.log.category}
          onChange={(e) =>
            props.updateLog(props.log.id, "category", e.target.value)
          }
        >
          {CATEGORIES.map((c) => (
            <option value={c}>{c}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Activity name..."
          class="w-full bg-transparent text-lg font-bold outline-none text-white placeholder:text-gray-700"
          ref={props.setRef}
          value={props.log.activity || ""}
          onBlur={(e) =>
            props.updateLog(props.log.id, "activity", e.currentTarget.value)
          }
        />
      </div>

      <button
        type="button"
        onClick={() => props.onDelete(props.log.id)}
        class="p-2 text-gray-700 hover:text-red-500 transition-all hover:scale-110"
      >
        <Trash2 size={20} />
      </button>
    </div>
  );
}

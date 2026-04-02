import {
  createSignal,
  onMount,
  For,
  createMemo,
  Show,
  createResource,
  createEffect,
  batch,
} from "solid-js";
import {
  Activity,
  Loader2,
  Trophy,
  Target,
  Flame,
  LayoutDashboard,
  TrendingUp,
  CheckCircle2,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-solid";
import {
  Chart,
  Title,
  Tooltip,
  Legend,
  Colors,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  PieController,
} from "chart.js";
import { Bar, Pie } from "solid-chartjs";

// Services
import { TasksService } from "../services/tasks";
import { UsersService } from "../services/users";
import { TeamsService } from "../services/teams";
import { WorksService } from "../services/works";

const STRESS_THRESHOLD = 20;

const CountUp = (props) => {
  const [displayValue, setDisplayValue] = createSignal(0);
  createEffect(() => {
    const target = props.value || 0;
    let startTimestamp = null;
    const duration = 1000;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setDisplayValue(Math.floor(progress * target));
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  });
  return <span>{displayValue()}</span>;
};

export default function DashboardHome() {
  const [isMounted, setIsMounted] = createSignal(false);
  const [renderKey, setRenderKey] = createSignal(0);
  const [selectedTeamId, setSelectedTeamId] = createSignal("All");
  const [selectedMemberId, setSelectedMemberId] = createSignal("All");
  const [stressTimeframe, setStressTimeframe] = createSignal("week");

  // ===== TABLE STATE =====
  const [searchQuery, setSearchQuery] = createSignal("");
  const [sortConfig, setSortConfig] = createSignal({
    key: "ongoingTasks",
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = createSignal(1);
  const itemsPerPage = 10;

  // ===== FETCH RESOURCES =====
  const [tasks] = createResource(async () => {
    const res = await TasksService.list();
    return res.data || [];
  });
  const [users] = createResource(async () => {
    const res = await UsersService.list();
    return res || [];
  });
  const [teams] = createResource(async () => {
    const res = await TeamsService.list();
    return res || [];
  });
  const [works] = createResource(async () => {
    const res = await WorksService.list();
    return res.data || [];
  });

  onMount(() => {
    Chart.register(
      Title,
      Tooltip,
      Legend,
      Colors,
      ArcElement,
      CategoryScale,
      LinearScale,
      BarElement,
      BarController,
      PieController,
    );
    setTimeout(() => setIsMounted(true), 100);
  });

  const updateFilter = (type, val) => {
    batch(() => {
      if (type === "timeframe") setStressTimeframe(val);
      if (type === "team") {
        setSelectedTeamId(val);
        setSelectedMemberId("All");
      }
      if (type === "member") setSelectedMemberId(val);
      setRenderKey((prev) => prev + 1);
      setCurrentPage(1);
    });
  };

  // ===== DATA PROCESSOR (SINKRON SEMUA KOMPONEN) =====
  const analyticsData = createMemo(() => {
    const allTasks = tasks() || [];
    const allUsers = users() || [];
    const allWorksData = works() || [];
    const mergedMap = new Map();

    allUsers.forEach((user) => {
      // Filter berdasarkan Team & Member dropdown
      if (
        selectedTeamId() !== "All" &&
        Number(user.team_id) !== Number(selectedTeamId())
      )
        return;
      if (
        selectedMemberId() !== "All" &&
        Number(user.id) !== Number(selectedMemberId())
      )
        return;

      const cleanName = user.name.split(" (")[0].trim();
      const userTasks = allTasks.filter(
        (t) => Number(t.assignee_id) === Number(user.id),
      );

      let doneTasks = 0;
      let ongoingTasks = 0;
      let doneActivities = 0;
      let pendingActivities = 0;

      userTasks.forEach((task) => {
        if (task.status?.toUpperCase() === "DONE") doneTasks++;
        else ongoingTasks++;

        const workObj = allWorksData.find((w) => w.task_id === task.id);
        if (workObj && workObj.works) {
          workObj.works.forEach((w) => {
            if (w.status?.toLowerCase() === "done") doneActivities++;
            else pendingActivities++;
          });
        }
      });

      if (mergedMap.has(cleanName)) {
        const existing = mergedMap.get(cleanName);
        existing.doneTasks += doneTasks;
        existing.ongoingTasks += ongoingTasks;
        existing.doneActivities += doneActivities;
        existing.pendingActivities += pendingActivities;
      } else {
        mergedMap.set(cleanName, {
          name: cleanName,
          team_id: user.team_id,
          doneTasks,
          ongoingTasks,
          doneActivities,
          pendingActivities,
          totalActivities: doneActivities + pendingActivities,
        });
      }
    });

    return Array.from(mergedMap.values())
      .map((item) => ({
        ...item,
        percentage: (item.ongoingTasks / STRESS_THRESHOLD) * 100,
        color:
          item.ongoingTasks > 10
            ? "#ef4444"
            : item.ongoingTasks > 5
              ? "#f59e0b"
              : "#6366f1",
        level:
          item.ongoingTasks > 10
            ? "CRITICAL 🔥"
            : item.ongoingTasks > 5
              ? "BUSY ⚡"
              : "STABLE",
      }))
      .sort((a, b) => b.ongoingTasks - a.ongoingTasks);
  });

  // ===== TABLE LOGIC (SEARCH + SORT + PAGINATION) =====
  const processedTableData = createMemo(() => {
    let data = [...analyticsData()];
    if (searchQuery())
      data = data.filter((u) =>
        u.name.toLowerCase().includes(searchQuery().toLowerCase()),
      );
    const { key, direction } = sortConfig();
    data.sort((a, b) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });
    return data;
  });

  const paginatedData = createMemo(() => {
    const start = (currentPage() - 1) * itemsPerPage;
    return processedTableData().slice(start, start + itemsPerPage);
  });

  const totalPages = () =>
    Math.ceil(processedTableData().length / itemsPerPage);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  // ===== CHART DATA CONFIG (SINKRON DENGAN DROPDOWN) =====
  const barData = () => ({
    labels: analyticsData().map((d) => d.name),
    datasets: [
      {
        label: "Done Tasks",
        data: analyticsData().map((d) => d.doneTasks),
        backgroundColor: "#10b981",
        borderRadius: 6,
      },
      {
        label: "On Going Tasks",
        data: analyticsData().map((d) => d.ongoingTasks),
        backgroundColor: "#3b82f6",
        borderRadius: 6,
      },
    ],
  });

  const pieData = createMemo(() => {
    // Pie chart juga harus mengikuti filter data yang tersaring
    const currentData = analyticsData();
    const totals = { TODO: 0, IN_PROGRESS: 0, DONE: 0, ON_HOLD: 0 };

    // Kita ambil ratio status dari personil yang lagi di-filter
    currentData.forEach((person) => {
      totals.DONE += person.doneTasks;
      totals.IN_PROGRESS += person.ongoingTasks; // Sesuai mapping dashboard lu
    });

    return {
      labels: ["Done", "Ongoing"],
      datasets: [
        {
          data: [totals.DONE, totals.IN_PROGRESS],
          backgroundColor: ["#10b981", "#3b82f6"],
          borderWidth: 0,
        },
      ],
    };
  });

  return (
    <div class="p-6 space-y-10 min-h-screen text-white pb-20 italic bg-[#050505] no-scrollbar">
      <style>{`
        .glass-card { background: rgba(15, 15, 15, 0.6); backdrop-filter: blur(40px); border: 1px solid rgba(255, 255, 255, 0.03); border-radius: 40px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes slideUpIn { 0% { opacity: 0; transform: translateY(50px); filter: blur(10px); } 100% { opacity: 1; transform: translateY(0); filter: blur(0); } }
        .animate-pop { animation: slideUpIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .stagger { animation-delay: calc(var(--index) * 0.1s); }
      `}</style>

      {/* HEADER & FILTERS */}
      <div
        class={`glass-card p-10 flex flex-col xl:flex-row justify-between items-center gap-8 animate-pop ${isMounted() ? "" : "opacity-0"}`}
      >
        <div class="flex items-center gap-6">
          <div class="p-5 bg-indigo-600 rounded-[28px] shadow-[0_0_40px_rgba(99,102,241,0.3)]">
            <LayoutDashboard size={32} />
          </div>
          <div class="space-y-1">
            <h1 class="text-5xl font-black tracking-tighter uppercase italic leading-none">
              Work Load Activity
            </h1>
            <p class="text-indigo-400 text-[10px] font-black uppercase tracking-[0.5em]">
              Personnel Intelligence Hub
            </p>
          </div>
        </div>

        <div class="flex flex-wrap justify-center gap-4">
          <div class="flex bg-white/5 p-1.5 rounded-[20px] border border-white/5">
            <For each={["day", "week", "month"]}>
              {(t) => (
                <button
                  onClick={() => updateFilter("timeframe", t)}
                  class={`px-8 py-2.5 rounded-[16px] text-[10px] font-black uppercase transition-all duration-500 ${stressTimeframe() === t ? "bg-white text-black shadow-[0_0_50px_rgba(255,255,255,0.4)]" : "text-gray-500 hover:text-white"}`}
                >
                  {t}
                </button>
              )}
            </For>
          </div>
          <select
            class="bg-white/5 border border-white/5 rounded-[20px] px-6 py-2.5 text-[10px] font-black uppercase outline-none text-gray-400 focus:text-white transition-all min-w-[150px]"
            value={selectedTeamId()}
            onChange={(e) => updateFilter("team", e.target.value)}
          >
            <option value="All">All Teams</option>
            <For each={teams()}>
              {(t) => <option value={t.id}>{t.name}</option>}
            </For>
          </select>
          <select
            class={`bg-white/5 border border-white/5 rounded-[20px] px-6 py-2.5 text-[10px] font-black uppercase outline-none transition-all min-w-[150px] ${selectedTeamId() === "All" ? "opacity-30 cursor-not-allowed" : "text-gray-400 focus:text-white"}`}
            disabled={selectedTeamId() === "All"}
            value={selectedMemberId()}
            onChange={(e) => updateFilter("member", e.target.value)}
          >
            <option value="All">All Members</option>
            <For
              each={users()?.filter(
                (u) => Number(u.team_id) === Number(selectedTeamId()),
              )}
            >
              {(u) => <option value={u.id}>{u.name}</option>}
            </For>
          </select>
        </div>
      </div>

      <Show
        when={!tasks.loading && !works.loading}
        fallback={
          <div class="py-40 text-center">
            <Loader2
              class="animate-spin mx-auto opacity-20 text-indigo-500"
              size={60}
            />
          </div>
        }
      >
        {/* RADAR SECTION */}
        <div class="space-y-6" key={renderKey()}>
          <div class="flex items-center gap-3 px-4">
            <TrendingUp size={16} class="text-indigo-500" />
            <h2 class="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">
              Live Stress Radar (Ongoing)
            </h2>
          </div>
          <div class="flex overflow-x-auto gap-8 pb-4 snap-x no-scrollbar">
            <For each={analyticsData()}>
              {(user, i) => (
                <div
                  class="glass-card p-8 min-w-[320px] relative overflow-hidden snap-center animate-pop stagger"
                  style={{ "--index": i() }}
                >
                  <div class="flex justify-between items-start mb-8">
                    <div
                      class="p-3 rounded-2xl"
                      style={{
                        background: user.color + "15",
                        color: user.color,
                      }}
                    >
                      {user.ongoingTasks > 10 ? (
                        <Flame size={24} class="animate-pulse" />
                      ) : (
                        <Activity size={24} />
                      )}
                    </div>
                    <span
                      class="text-[9px] font-black px-3 py-1 rounded-full border uppercase"
                      style={{
                        "border-color": user.color + "30",
                        color: user.color,
                      }}
                    >
                      {user.level}
                    </span>
                  </div>
                  <h3 class="text-2xl font-black uppercase tracking-tighter mb-1 truncate">
                    {user.name}
                  </h3>
                  <div class="text-5xl font-black italic mb-4">
                    <CountUp value={user.ongoingTasks} />
                    <span class="text-[8px] text-gray-600 ml-2 not-italic uppercase tracking-widest text-indigo-400">
                      Ongoing
                    </span>
                  </div>
                  <div class="flex items-center gap-4 mb-6 text-[9px] font-black uppercase tracking-widest text-gray-500">
                    <span class="flex items-center gap-1.5 text-indigo-400">
                      <Clock size={12} /> {user.pendingActivities} Pending
                    </span>
                    <span class="flex items-center gap-1.5 text-green-500">
                      <CheckCircle2 size={12} /> {user.doneActivities} Done
                    </span>
                  </div>
                  <div class="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      class="h-full transition-all duration-[1.5s]"
                      style={{
                        width: `${Math.min(100, user.percentage)}%`,
                        background: user.color,
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>

        {/* ANALYTICS SECTION */}
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div class="lg:col-span-2 glass-card p-10 animate-pop">
            <div class="flex items-center gap-4 mb-10">
              <div class="p-3 bg-white/5 rounded-2xl">
                <Trophy size={24} class="text-green-500" />
              </div>
              <h3 class="text-[10px] font-black uppercase tracking-[0.5em] text-gray-500">
                Filtered Task Volume
              </h3>
            </div>
            <div class="h-[400px]">
              <Bar
                data={barData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      grid: { color: "rgba(255,255,255,0.02)" },
                      ticks: { color: "#9ca3af", font: { weight: "900" } },
                    },
                    x: {
                      grid: { display: false },
                      ticks: {
                        color: "#9ca3af",
                        font: { weight: "900", size: 10 },
                      },
                    },
                  },
                  plugins: {
                    legend: {
                      labels: { color: "#fff", font: { weight: "bold" } },
                    },
                  },
                }}
              />
            </div>
          </div>
          <div
            class="lg:col-span-1 glass-card p-10 flex flex-col animate-pop"
            style="animation-delay: 0.2s"
          >
            <div class="flex items-center gap-4 mb-10">
              <div class="p-3 bg-white/5 rounded-2xl">
                <Target size={24} class="text-blue-500" />
              </div>
              <h3 class="text-[10px] font-black uppercase tracking-[0.5em] text-gray-500">
                Selection Ratio
              </h3>
            </div>
            <div class="flex-1 flex items-center justify-center">
              <Pie
                data={pieData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: {
                        color: "#fff",
                        font: { size: 10, weight: "bold" },
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* MATRIX TABLE SECTION */}
        <div
          class="glass-card overflow-hidden animate-pop"
          style="animation-delay: 0.4s"
        >
          <div class="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/[0.01]">
            <h3 class="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
              Personnel Deployment Matrix
            </h3>
            <div class="relative group">
              <Search
                size={14}
                class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400"
              />
              <input
                type="text"
                placeholder="Search Personnel..."
                class="bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2 text-[10px] font-black uppercase outline-none focus:border-indigo-500 transition-all w-full md:w-64"
                onInput={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead class="text-[8px] uppercase tracking-[0.4em] font-black text-gray-600 border-b border-white/5 bg-white/[0.02]">
                <tr>
                  <th
                    class="px-10 py-6 cursor-pointer hover:text-white"
                    onClick={() => handleSort("name")}
                  >
                    Identity <ArrowUpDown size={10} class="inline ml-1" />
                  </th>
                  <th
                    class="px-10 py-6 text-center text-green-500 cursor-pointer hover:text-green-300"
                    onClick={() => handleSort("doneTasks")}
                  >
                    Done Tasks <ArrowUpDown size={10} class="inline ml-1" />
                  </th>
                  <th
                    class="px-10 py-6 text-center text-blue-400 cursor-pointer hover:text-blue-300"
                    onClick={() => handleSort("ongoingTasks")}
                  >
                    Ongoing <ArrowUpDown size={10} class="inline ml-1" />
                  </th>
                  <th class="px-10 py-6 text-center">Acts Done</th>
                  <th class="px-10 py-6 text-center">Acts Pending</th>
                  <th class="px-10 py-6 text-right">Stress</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5 text-[10px]">
                <For each={paginatedData()}>
                  {(item) => (
                    <tr class="hover:bg-white/[0.02] transition-all group">
                      <td class="px-10 py-6 flex items-center gap-4">
                        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-800 flex items-center justify-center font-black shadow-lg uppercase">
                          {item.name.substring(0, 2)}
                        </div>
                        <div class="font-black text-white group-hover:text-indigo-400 transition-colors uppercase">
                          {item.name}
                        </div>
                      </td>
                      <td class="px-10 py-6 text-center font-black text-green-500/80">
                        {item.doneTasks}
                      </td>
                      <td class="px-10 py-8 text-center font-black text-blue-400/80">
                        {item.ongoingTasks}
                      </td>
                      <td class="px-10 py-8 text-center font-black opacity-50">
                        {item.doneActivities}
                      </td>
                      <td class="px-10 py-8 text-center font-black opacity-50">
                        {item.pendingActivities}
                      </td>
                      <td class="px-10 py-8 text-right">
                        <span
                          class="px-3 py-1 rounded-md border text-[8px] font-black"
                          style={{
                            "border-color": item.color + "40",
                            color: item.color,
                          }}
                        >
                          {item.level}
                        </span>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
          <div class="p-8 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
            <span class="text-[9px] font-black text-gray-600 uppercase">
              Page {currentPage()} of {totalPages() || 1}
            </span>
            <div class="flex gap-2">
              <button
                disabled={currentPage() === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                class="p-2 glass-card rounded-xl disabled:opacity-20 hover:bg-white/5"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={currentPage() >= totalPages()}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                class="p-2 glass-card rounded-xl disabled:opacity-20 hover:bg-white/5"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}

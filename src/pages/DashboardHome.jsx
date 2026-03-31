import {
  createSignal,
  onMount,
  For,
  createMemo,
  Show,
  createResource,
  batch,
} from "solid-js";
import {
  Users,
  Activity,
  SortAsc,
  SortDesc,
  Loader2,
  Trophy,
  Target,
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

export default function DashboardHome() {
  const [isMounted, setIsMounted] = createSignal(false);

  // ===== STATE FILTER =====
  const [selectedTeamId, setSelectedTeamId] = createSignal("All");
  const [selectedMemberId, setSelectedMemberId] = createSignal("All");
  const [sortOrder, setSortOrder] = createSignal("desc");

  // ===== FETCH DATA DARI API =====
  const [tasks] = createResource(async () => {
    const res = await TasksService.list();
    return res.data || [];
  });

  const [users] = createResource(async () => {
    const res = await UsersService.list();
    return res.data || [];
  });

  const [teams] = createResource(async () => {
    const res = await TeamsService.list();
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

  // ===== LOGIC TRANSFORMASI DATA =====
  const visualData = createMemo(() => {
    const allTasks = tasks() || [];
    const allUsers = users() || [];
    const allTeams = teams() || [];

    let result = [];

    // Helper hitung progress per task (Checklist %)
    const getTaskProgress = (t) => {
      if (!t.logs || t.logs.length === 0) return 0;
      const done = t.logs.filter(
        (l) => l.is_done == true || l.is_done == 1,
      ).length;
      return Math.round((done / t.logs.length) * 100);
    };

    if (selectedTeamId() === "All") {
      // MODE: Perbandingan antar TEAM
      result = allTeams.map((team) => {
        const teamMemberIds = allUsers
          .filter((u) => u.team_id === team.id)
          .map((u) => u.id);
        const teamTasks = allTasks.filter((task) =>
          teamMemberIds.includes(task.assignee_id),
        );

        const totalProgressSum = teamTasks.reduce(
          (acc, curr) => acc + getTaskProgress(curr),
          0,
        );

        return {
          label: team.team_name,
          value:
            teamTasks.length > 0
              ? Math.round(totalProgressSum / teamTasks.length)
              : 0,
          count: teamTasks.length,
        };
      });
    } else {
      // MODE: Perbandingan antar MEMBER dalam satu Team
      const teamId = parseInt(selectedTeamId());
      const membersInTeam = allUsers.filter((u) => u.team_id === teamId);

      result = membersInTeam
        .map((member) => {
          const userTasks = allTasks.filter(
            (task) => task.assignee_id === member.id,
          );

          // Filter lagi kalau user pilih spesifik satu member
          if (
            selectedMemberId() !== "All" &&
            member.id !== parseInt(selectedMemberId())
          ) {
            return null;
          }

          const totalProgressSum = userTasks.reduce(
            (acc, curr) => acc + getTaskProgress(curr),
            0,
          );

          return {
            label: member.name,
            value:
              userTasks.length > 0
                ? Math.round(totalProgressSum / userTasks.length)
                : 0,
            count: userTasks.length,
          };
        })
        .filter(Boolean);
    }

    // Sort Logic
    result.sort((a, b) =>
      sortOrder() === "desc" ? b.value - a.value : a.value - b.value,
    );
    return result;
  });

  const pieData = createMemo(() => {
    const allTasks = tasks() || [];
    const counts = { TODO: 0, DOING: 0, DONE: 0, ONHOLD: 0 };

    allTasks.forEach((t) => {
      const s = t.status?.toUpperCase().replace(" ", "") || "TODO";
      if (counts.hasOwnProperty(s)) counts[s]++;
      else counts["TODO"]++;
    });

    return {
      labels: ["To Do", "Doing", "Done", "On Hold"],
      datasets: [
        {
          data: [counts.TODO, counts.DOING, counts.DONE, counts.ONHOLD],
          backgroundColor: ["#4b5563", "#3b82f6", "#10b981", "#f59e0b"],
          borderWidth: 0,
        },
      ],
    };
  });

  const barData = () => ({
    labels: visualData().map((d) => d.label),
    datasets: [
      {
        label: "Productivity Index (%)",
        data: visualData().map((d) => d.value),
        backgroundColor: "rgba(99, 102, 241, 0.8)",
        borderRadius: 12,
      },
    ],
  });

  return (
    <div class="p-6 space-y-8 min-h-screen text-white pb-20">
      <style>{`
        .control-input { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 12px 16px; font-size: 13px; outline: none; transition: all 0.3s; width: 100%; color: #fff; font-weight: 700; }
        .control-input:focus { border-color: #6366f1; background: rgba(255,255,255,0.1); }
        .control-input:disabled { opacity: 0.2; cursor: not-allowed; }
        .section-fade { opacity: 0; transform: translateY(20px); animation: slideUp 0.8s ease-out forwards; }
        @keyframes slideUp { to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* FILTERS */}
      <div
        class={`bg-gray-900/40 backdrop-blur-3xl border border-white/10 p-8 rounded-[40px] shadow-2xl transition-all duration-1000 ${isMounted() ? "opacity-100" : "opacity-0"}`}
      >
        <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
          <div>
            <h1 class="text-4xl font-black tracking-tighter uppercase">
              Analytics Hub
            </h1>
            <p class="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2 italic">
              Productivity Monitoring System
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 max-w-3xl">
            <div class="space-y-2">
              <label class="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">
                Select Team
              </label>
              <select
                class="control-input"
                value={selectedTeamId()}
                onChange={(e) => {
                  setSelectedTeamId(e.target.value);
                  setSelectedMemberId("All");
                }}
              >
                <option value="All">All Teams</option>
                <For each={teams()}>
                  {(t) => <option value={t.id}>{t.team_name}</option>}
                </For>
              </select>
            </div>

            <div class="space-y-2">
              <label class="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">
                Select Member
              </label>
              <select
                class="control-input"
                disabled={selectedTeamId() === "All"}
                value={selectedMemberId()}
                onChange={(e) => setSelectedMemberId(e.target.value)}
              >
                <option value="All">All Members</option>
                <For
                  each={users()?.filter(
                    (u) => u.team_id === parseInt(selectedTeamId()),
                  )}
                >
                  {(m) => <option value={m.id}>{m.name}</option>}
                </For>
              </select>
            </div>

            <div class="space-y-2">
              <label class="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">
                Sort Order
              </label>
              <button
                onClick={() =>
                  setSortOrder(sortOrder() === "desc" ? "asc" : "desc")
                }
                class="control-input flex items-center justify-between hover:bg-white/10 group"
              >
                <span class="font-black uppercase text-[11px] tracking-tighter">
                  {sortOrder() === "desc" ? "Highest First" : "Lowest First"}
                </span>
                {sortOrder() === "desc" ? (
                  <SortDesc size={18} class="text-indigo-400" />
                ) : (
                  <SortAsc size={18} class="text-indigo-400" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Show
        when={!tasks.loading && !users.loading && !teams.loading}
        fallback={
          <div class="py-40 text-center">
            <Loader2 class="animate-spin mx-auto text-indigo-500" size={40} />
          </div>
        }
      >
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* BAR CHART */}
          <div class="lg:col-span-2 bg-gray-900/40 backdrop-blur-3xl border border-white/10 p-10 rounded-[40px] shadow-2xl section-fade">
            <div class="flex items-center gap-4 mb-10">
              <div class="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
                <Trophy size={24} />
              </div>
              <div>
                <h3 class="text-xs font-black uppercase tracking-[0.3em] text-gray-500">
                  Performance Index
                </h3>
                <p class="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">
                  Calculated by task completion avg
                </p>
              </div>
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
                      ticks: { color: "#4b5563", font: { weight: "bold" } },
                    },
                    x: {
                      grid: { display: false },
                      ticks: {
                        color: "#9ca3af",
                        font: { size: 10, weight: "bold" },
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* PIE CHART */}
          <div
            class="lg:col-span-1 bg-gray-900/40 backdrop-blur-3xl border border-white/10 p-10 rounded-[40px] shadow-2xl section-fade"
            style="animation-delay: 0.2s"
          >
            <div class="flex items-center gap-4 mb-10">
              <div class="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
                <Target size={24} />
              </div>
              <h3 class="text-xs font-black uppercase tracking-[0.3em] text-gray-500">
                Task Ratio
              </h3>
            </div>
            <div class="h-[300px] flex items-center justify-center">
              <Pie
                data={pieData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: {
                        color: "#9ca3af",
                        font: { size: 10, weight: "bold" },
                        padding: 20,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* LIST TABLE */}
        <div
          class="bg-gray-900/40 backdrop-blur-3xl border border-white/10 rounded-[40px] overflow-hidden shadow-2xl section-fade"
          style="animation-delay: 0.4s"
        >
          <div class="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
            <h3 class="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
              Leaderboard Details
            </h3>
            <span class="text-[9px] font-black bg-indigo-500/10 px-4 py-2 rounded-full text-indigo-400 border border-indigo-500/20 tracking-widest uppercase">
              {visualData().length} Members Tracked
            </span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead class="text-[9px] uppercase tracking-[0.3em] font-black text-gray-600 border-b border-white/5">
                <tr>
                  <th class="px-10 py-6">Member Identity</th>
                  <th class="px-10 py-6 text-center">Tasks</th>
                  <th class="px-10 py-6">Productivity Index</th>
                  <th class="px-10 py-6 text-right">Rank</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                <For each={visualData()}>
                  {(item, i) => (
                    <tr class="hover:bg-white/[0.02] transition-all group">
                      <td class="px-10 py-8 flex items-center gap-4">
                        <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-xs font-black shadow-lg">
                          {item.label.substring(0, 2).toUpperCase()}
                        </div>
                        <div class="font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">
                          {item.label}
                        </div>
                      </td>
                      <td class="px-10 py-8 text-center font-mono font-bold text-xs">
                        {item.count}
                      </td>
                      <td class="px-10 py-8">
                        <div class="flex items-center gap-4">
                          <div class="flex-1 h-2 bg-white/5 rounded-full overflow-hidden min-w-[120px]">
                            <div
                              class="h-full bg-gradient-to-r from-indigo-500 to-blue-400 transition-all duration-1000"
                              style={{ width: `${item.value}%` }}
                            ></div>
                          </div>
                          <span class="text-xs font-black text-indigo-400 font-mono">
                            {item.value}%
                          </span>
                        </div>
                      </td>
                      <td class="px-10 py-8 text-right font-black text-gray-600">
                        #{i() + 1}
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </div>
      </Show>
    </div>
  );
}

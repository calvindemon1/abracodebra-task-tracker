import { createResource, createSignal, For, Show, onMount } from "solid-js";
import { TeamsService } from "../../../services/teams";
import {
  Edit,
  Trash2,
  Users,
  Plus,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Users2,
  Loader2,
  Briefcase,
  UserCheck,
} from "lucide-solid";
import { useNavigate } from "@solidjs/router";
import Swal from "sweetalert2";

export default function Teams() {
  const navigate = useNavigate();
  const [isMounted, setIsMounted] = createSignal(false);

  // PAGINATION STATES (Client-Side)
  const [page, setPage] = createSignal(1);
  const [perPage] = createSignal(5);

  // FETCH DATA
  const [teams, { refetch }] = createResource(async () => {
    try {
      const res = await TeamsService.list();
      // Pastikan return array data (biasanya res.data di axios)
      return res.data || res;
    } catch (err) {
      console.error("Error fetch teams:", err);
      return [];
    }
  });

  // LOGIC PAGINATION (Memotong data yang sudah di-fetch)
  const paginatedTeams = () => {
    const allData = teams() || [];
    const start = (page() - 1) * perPage();
    const end = start + perPage();
    return allData.slice(start, end);
  };

  // Hitung total halaman
  const totalPages = () => Math.ceil((teams()?.length || 0) / perPage());

  const [name, setName] = createSignal("");
  const [editingId, setEditingId] = createSignal(null);
  const [loading, setLoading] = createSignal(false);

  onMount(() => {
    setTimeout(() => setIsMounted(true), 50);
  });

  // Handler Navigasi Halaman
  const nextPage = () => {
    if (page() < totalPages()) setPage((p) => p + 1);
  };
  const prevPage = () => {
    if (page() > 1) setPage((p) => p - 1);
  };

  const submit = async (e) => {
    if (e) e.preventDefault();
    if (!name().trim()) {
      return Swal.fire({
        icon: "warning",
        title: "KOSONG BRO",
        text: "Nama tim jangan dikosongin lah!",
        background: "#0a0a0a",
        color: "#fff",
        confirmButtonColor: "#4f46e5",
      });
    }

    setLoading(true);
    try {
      if (editingId()) {
        await TeamsService.update(editingId(), { team_name: name() });
        Swal.fire({
          icon: "success",
          title: "UPDATED",
          background: "#0a0a0a",
          color: "#fff",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await TeamsService.create({ team_name: name() });
        Swal.fire({
          icon: "success",
          title: "DONE",
          background: "#0a0a0a",
          color: "#fff",
          timer: 1500,
          showConfirmButton: false,
        });
      }
      setName("");
      setEditingId(null);
      refetch();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "FAILED",
        background: "#0a0a0a",
        color: "#fff",
      });
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setName(item.name);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id) => {
    const confirm = await Swal.fire({
      title: "HAPUS?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      background: "#0a0a0a",
      color: "#fff",
    });

    if (!confirm.isConfirmed) return;

    try {
      await TeamsService.delete(id);
      Swal.fire({
        icon: "success",
        title: "BERES",
        background: "#0a0a0a",
        color: "#fff",
        timer: 1500,
        showConfirmButton: false,
      });
      refetch();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "ERROR",
        background: "#0a0a0a",
        color: "#fff",
      });
    }
  };

  return (
    <div class="p-6 min-h-screen text-white overflow-hidden font-sans">
      <style>{`
        .page-enter { animation: pageIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes pageIn {
          from { opacity: 0; transform: translateY(40px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .shimmer {
          background: linear-gradient(90deg, #0a0a0a 25%, #1a1a1a 50%, #0a0a0a 75%);
          background-size: 200% 100%;
          animation: shimmer-ani 1.5s infinite linear;
        }
        @keyframes shimmer-ani {
          from { background-position: -200% 0; }
          to { background-position: 200% 0; }
        }
        .row-item { opacity: 0; animation: rowIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes rowIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        class={`max-w-6xl mx-auto space-y-10 ${isMounted() ? "page-enter" : "opacity-0"}`}
      >
        {/* HEADER */}
        <div class="flex justify-between items-end">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <div class="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
                <Users size={24} />
              </div>
              <span class="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">
                Master Data
              </span>
            </div>
            <h1 class="text-5xl font-black tracking-tighter bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
              TEAMS HUB
            </h1>
          </div>
          <button
            onClick={() => navigate(-1)}
            class="flex items-center gap-2 text-xs font-black text-gray-500 hover:text-white transition-all uppercase tracking-widest"
          >
            <ChevronLeft size={16} /> Kembali
          </button>
        </div>

        {/* INPUT FORM */}
        <div class="bg-gray-900/40 backdrop-blur-3xl rounded-[40px] border border-white/10 p-10 shadow-2xl">
          <label class="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-6 block">
            {editingId() ? "Update Team Detail" : "Create New Team"}
          </label>
          <form onSubmit={submit} class="flex flex-col md:flex-row gap-4">
            <div class="flex-1">
              <input
                type="text"
                class="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-xl font-bold outline-none focus:border-indigo-500 focus:bg-white/10 transition-all placeholder:text-gray-700 text-white"
                placeholder="Misal: Developer Team, Marketing..."
                value={name()}
                onInput={(e) => setName(e.target.value)}
                disabled={loading()}
              />
            </div>
            <div class="flex gap-2">
              <button
                type="submit"
                disabled={loading()}
                class={`px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center gap-3 ${editingId() ? "bg-indigo-600 shadow-indigo-600/20" : "bg-white text-black hover:bg-gray-200"}`}
              >
                <Show
                  when={loading()}
                  fallback={
                    editingId() ? <Save size={18} /> : <Plus size={18} />
                  }
                >
                  <Loader2 size={18} class="animate-spin" />
                </Show>
                {editingId() ? "Simpan" : "Tambah"}
              </button>
              <Show when={editingId() && !loading()}>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setName("");
                  }}
                  class="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
              </Show>
            </div>
          </form>
        </div>

        {/* TABLE LIST AREA */}
        <div class="bg-gray-900/40 backdrop-blur-3xl rounded-[40px] border border-white/10 overflow-hidden shadow-2xl flex flex-col">
          <table class="w-full text-left">
            <thead class="bg-white/5 text-[10px] uppercase font-black tracking-[0.3em] text-gray-500 border-b border-white/5">
              <tr>
                <th class="p-8 w-20 text-center text-gray-600">ID</th>
                <th class="p-8">Team Info</th>
                <th class="p-8 text-center">Division</th>
                <th class="p-8 text-center">Members</th>
                <th class="p-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              <Show
                when={!teams.loading}
                fallback={
                  <For each={[1, 2, 3]}>
                    {() => (
                      <tr>
                        <td colspan="5" class="p-8">
                          <div class="h-12 w-full shimmer rounded-2xl"></div>
                        </td>
                      </tr>
                    )}
                  </For>
                }
              >
                <Show
                  when={paginatedTeams().length > 0}
                  fallback={
                    <tr>
                      <td
                        colspan="5"
                        class="p-20 text-center text-gray-600 uppercase tracking-widest opacity-20"
                      >
                        Belum ada tim terdaftar
                      </td>
                    </tr>
                  }
                >
                  {/* Kita looping data yang sudah dipotong (paginatedTeams) */}
                  <For each={paginatedTeams()}>
                    {(item, i) => (
                      <tr
                        class="row-item group hover:bg-white/[0.03] transition-all duration-500"
                        style={{ "animation-delay": `${i() * 0.05}s` }}
                      >
                        <td class="p-8 text-center text-gray-600 font-mono text-xs">
                          {item.id}
                        </td>
                        <td class="p-8">
                          <div class="flex items-center gap-4">
                            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform border border-white/5">
                              <Users2 size={20} />
                            </div>
                            <div class="flex flex-col">
                              <span class="text-xl font-black tracking-tight group-hover:text-indigo-400 transition-colors uppercase italic">
                                {item.name}
                              </span>
                              <span class="text-[9px] text-gray-600 font-bold uppercase tracking-widest">
                                Created:{" "}
                                {new Date(item.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td class="p-8 text-center">
                          <div class="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                            <Briefcase size={12} class="text-gray-500" />
                            <span class="text-xs font-bold text-gray-400">
                              ID: {item.division_id}
                            </span>
                          </div>
                        </td>
                        <td class="p-8 text-center">
                          <div class="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                            <UserCheck size={12} class="text-indigo-400" />
                            <span class="text-xs font-black text-indigo-400">
                              {item.total_users} Users
                            </span>
                          </div>
                        </td>
                        <td class="p-8 text-right">
                          <div class="flex justify-end gap-2 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                            <button
                              onClick={() => startEdit(item)}
                              class="p-4 bg-white/5 hover:bg-indigo-600 rounded-2xl text-gray-400 hover:text-white transition-all shadow-xl"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => remove(item.id)}
                              class="p-4 bg-white/5 hover:bg-red-600 rounded-2xl text-gray-400 hover:text-white transition-all shadow-xl"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </For>
                </Show>
              </Show>
            </tbody>
          </table>

          {/* PAGINATION CONTROLS (Glassmorphism) */}
          <div class="p-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
            <div class="flex flex-col">
              <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                Page {page()} of {totalPages()}
              </span>
              <span class="text-[9px] text-gray-600 font-bold uppercase mt-1">
                Total Data: {teams()?.length || 0} teams
              </span>
            </div>
            <div class="flex gap-4">
              <button
                onClick={prevPage}
                disabled={page() === 1 || teams.loading}
                class="p-4 rounded-2xl bg-white/5 hover:bg-white/10 disabled:opacity-10 disabled:cursor-not-allowed transition-all text-gray-400 hover:text-white"
                title="Previous Page"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextPage}
                disabled={page() >= totalPages() || teams.loading}
                class="p-4 rounded-2xl bg-white/5 hover:bg-white/10 disabled:opacity-10 disabled:cursor-not-allowed transition-all text-gray-400 hover:text-white"
                title="Next Page"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

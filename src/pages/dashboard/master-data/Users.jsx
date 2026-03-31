import { createResource, createSignal, For, Show, onMount } from "solid-js";
import { UsersService } from "../../../services/users";
import { TeamsService } from "../../../services/teams";
import {
  Edit,
  Trash2,
  UserPlus,
  Save,
  X,
  ChevronLeft,
  User,
  Mail,
  ShieldCheck,
  Loader2,
  Users2,
} from "lucide-solid";
import { useNavigate } from "@solidjs/router";
import Swal from "sweetalert2";

export default function Users() {
  const navigate = useNavigate();
  const [isMounted, setIsMounted] = createSignal(false);

  // FETCH DATA
  const [users, { refetch }] = createResource(async () => {
    const res = await UsersService.list();
    return res.data;
  });

  const [teams] = createResource(async () => {
    const res = await TeamsService.list();
    return res.data;
  });

  // FORM STATE
  const [form, setForm] = createSignal({
    name: "",
    email: "",
    password: "",
    team_id: "",
  });
  const [editingId, setEditingId] = createSignal(null);
  const [loading, setLoading] = createSignal(false);

  onMount(() => setTimeout(() => setIsMounted(true), 50));

  const submit = async (e) => {
    if (e) e.preventDefault();
    if (!form().name || !form().email || (!editingId() && !form().password)) {
      return Swal.fire({
        icon: "warning",
        title: "INPUT KURANG",
        text: "Nama, Email, dan Password wajib diisi!",
        background: "#0a0a0a",
        color: "#fff",
      });
    }

    setLoading(true);
    try {
      const payload = { ...form(), team_id: parseInt(form().team_id) };
      if (editingId()) {
        await UsersService.update(editingId(), payload);
        Swal.fire({
          icon: "success",
          title: "UPDATED",
          background: "#0a0a0a",
          color: "#fff",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await UsersService.register(payload);
        Swal.fire({
          icon: "success",
          title: "CREATED",
          background: "#0a0a0a",
          color: "#fff",
          timer: 1500,
          showConfirmButton: false,
        });
      }
      setForm({ name: "", email: "", password: "", team_id: "" });
      setEditingId(null);
      refetch();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "FAILED",
        text: "Email mungkin sudah terdaftar",
        background: "#0a0a0a",
        color: "#fff",
      });
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (user) => {
    setEditingId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      team_id: user.team_id,
      password: "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id) => {
    const confirm = await Swal.fire({
      title: "HAPUS USER?",
      text: "User ini bakal kehilangan akses login!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      background: "#0a0a0a",
      color: "#fff",
    });

    if (confirm.isConfirmed) {
      try {
        await UsersService.delete(id);
        refetch();
        Swal.fire({
          icon: "success",
          title: "DELETED",
          background: "#0a0a0a",
          color: "#fff",
          timer: 1000,
          showConfirmButton: false,
        });
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "ERROR",
          background: "#0a0a0a",
          color: "#fff",
        });
      }
    }
  };

  return (
    <div class="p-6 min-h-screen text-white overflow-hidden">
      <style>{`
        .page-enter { animation: pageIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes pageIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .row-item { opacity: 0; animation: rowIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes rowIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div
        class={`max-w-6xl mx-auto space-y-10 ${isMounted() ? "page-enter" : "opacity-0"}`}
      >
        {/* HEADER */}
        <div class="flex justify-between items-end">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <div class="p-2 bg-blue-500/20 rounded-xl text-blue-400">
                <User size={24} />
              </div>
              <span class="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">
                Access Management
              </span>
            </div>
            <h1 class="text-5xl font-black tracking-tighter bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
              USER HUB
            </h1>
          </div>
          <button
            onClick={() => navigate(-1)}
            class="text-xs font-black text-gray-500 hover:text-white transition-all uppercase tracking-widest flex items-center gap-2"
          >
            <ChevronLeft size={16} /> Kembali
          </button>
        </div>

        {/* FORM SECTION */}
        <div class="bg-gray-900/40 backdrop-blur-3xl rounded-[40px] border border-white/10 p-10 shadow-2xl">
          <form onSubmit={submit} class="space-y-8">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">
                  Full Name
                </label>
                <input
                  type="text"
                  class="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:border-blue-500 transition-all"
                  value={form().name}
                  onInput={(e) => setForm({ ...form(), name: e.target.value })}
                  placeholder="Calvin..."
                />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">
                  Email Address
                </label>
                <input
                  type="email"
                  class="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:border-blue-500 transition-all"
                  value={form().email}
                  onInput={(e) => setForm({ ...form(), email: e.target.value })}
                  placeholder="calvin@mail.com"
                />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">
                  {editingId() ? "New Password (Optional)" : "Password"}
                </label>
                <input
                  type="password"
                  class="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:border-blue-500 transition-all"
                  value={form().password}
                  onInput={(e) =>
                    setForm({ ...form(), password: e.target.value })
                  }
                  placeholder="******"
                />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">
                  Assign Team
                </label>
                <select
                  class="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:border-blue-500 transition-all cursor-pointer"
                  style="color-scheme: dark"
                  value={form().team_id}
                  onChange={(e) =>
                    setForm({ ...form(), team_id: e.target.value })
                  }
                >
                  <option value="">Select Team</option>
                  <For each={teams()}>
                    {(t) => <option value={t.id}>{t.team_name}</option>}
                  </For>
                </select>
              </div>
            </div>

            <div class="flex justify-end gap-3">
              <Show when={editingId()}>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm({ name: "", email: "", password: "", team_id: "" });
                  }}
                  class="px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-white/5 text-gray-400 hover:text-white transition-all"
                >
                  Cancel
                </button>
              </Show>
              <button
                type="submit"
                disabled={loading()}
                class="px-12 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-blue-600 hover:bg-blue-500 transition-all flex items-center gap-3 shadow-xl shadow-blue-600/20"
              >
                <Show
                  when={loading()}
                  fallback={
                    editingId() ? <Save size={16} /> : <UserPlus size={16} />
                  }
                >
                  <Loader2 size={16} class="animate-spin" />
                </Show>
                {editingId() ? "Update User" : "Add User"}
              </button>
            </div>
          </form>
        </div>

        {/* TABLE SECTION */}
        <div class="bg-gray-900/40 backdrop-blur-3xl rounded-[40px] border border-white/10 overflow-hidden shadow-2xl">
          <table class="w-full text-left">
            <thead class="bg-white/5 text-[10px] uppercase font-black tracking-[0.3em] text-gray-500 border-b border-white/5">
              <tr>
                <th class="p-8">Identity</th>
                <th class="p-8">Team</th>
                <th class="p-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              <Show
                when={!users.loading}
                fallback={
                  <tr>
                    <td
                      colspan="3"
                      class="p-20 text-center opacity-30 font-black tracking-widest"
                    >
                      LOADING USERS...
                    </td>
                  </tr>
                }
              >
                <For each={users()}>
                  {(user, i) => (
                    <tr
                      class="row-item group hover:bg-white/[0.03] transition-all duration-500"
                      style={{ "animation-delay": `${i() * 0.05}s` }}
                    >
                      <td class="p-8">
                        <div class="flex items-center gap-4">
                          <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-800 to-black flex items-center justify-center border border-white/5 group-hover:border-blue-500/50 transition-all">
                            <User
                              size={20}
                              class="text-gray-500 group-hover:text-blue-400"
                            />
                          </div>
                          <div>
                            <div class="text-lg font-black tracking-tight group-hover:text-blue-400 transition-colors uppercase">
                              {user.name}
                            </div>
                            <div class="text-xs text-gray-500 font-mono tracking-tighter">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td class="p-8">
                        <div class="flex items-center gap-2 bg-white/5 w-fit px-4 py-1.5 rounded-full border border-white/5">
                          <Users2 size={12} class="text-indigo-400" />
                          <span class="text-[10px] font-black uppercase tracking-widest text-indigo-300">
                            {teams()?.find((t) => t.id === user.team_id)
                              ?.team_name || "No Team"}
                          </span>
                        </div>
                      </td>
                      <td class="p-8">
                        <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <button
                            onClick={() => startEdit(user)}
                            class="p-4 bg-white/5 hover:bg-blue-600 rounded-2xl text-gray-400 hover:text-white transition-all shadow-xl"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => remove(user.id)}
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { createResource, createSignal, For, Show, onMount } from "solid-js";
import { UsersService } from "../../../services/users";
import { TeamsService } from "../../../services/teams";
import {
  Edit,
  Trash2,
  UserPlus,
  Save,
  ChevronLeft,
  ChevronRight,
  User,
  Loader2,
  Users2,
  Shield,
} from "lucide-solid";
import { useNavigate } from "@solidjs/router";
import Swal from "sweetalert2";

export default function Users() {
  const navigate = useNavigate();
  const [isMounted, setIsMounted] = createSignal(false);

  // PAGINATION STATES
  const [page, setPage] = createSignal(1);
  const [perPage] = createSignal(10);

  // FETCH DATA
  const [users, { refetch }] = createResource(async () => {
    const res = await UsersService.list();
    console.log("Fetched users:", res); // Debug log untuk memastikan data diterima
    return res.data || res;
  });

  const [teams] = createResource(async () => {
    const res = await TeamsService.list();
    return res.data || res;
  });

  // FORM STATE - Tambah username
  const [form, setForm] = createSignal({
    name: "",
    username: "", // <-- TAMBAHAN BARU
    email: "",
    password: "",
    role: "member",
    team_id: "",
  });

  const [editingId, setEditingId] = createSignal(null);
  const [loading, setLoading] = createSignal(false);

  // PAGINATION LOGIC
  const paginatedUsers = () => {
    const data = users() || [];
    const start = (page() - 1) * perPage();
    return data.slice(start, start + perPage());
  };
  const totalPages = () => Math.ceil((users()?.length || 0) / perPage());

  onMount(() => setTimeout(() => setIsMounted(true), 50));

  const submit = async (e) => {
    if (e) e.preventDefault();

    const currentForm = form();
    const id = editingId();

    // 1. VALIDASI INPUT WAJIB
    if (
      !currentForm.name ||
      !currentForm.username ||
      !currentForm.email ||
      (!id && !currentForm.password)
    ) {
      return Swal.fire({
        icon: "warning",
        title: "INPUT KURANG",
        text: "Nama, Username, Email, dan Password wajib diisi!",
        background: "#0a0a0a",
        color: "#fff",
      });
    }

    setLoading(true);
    try {
      // 2. AMBIL DATA ASLI (Untuk Update)
      const originalUser = id ? users()?.find((u) => u.id === id) : null;

      // 3. SUSUN PAYLOAD
      const payload = {
        name: currentForm.name,
        username: currentForm.username,
        email: currentForm.email,
        role: currentForm.role.toLowerCase(),
        team_id: currentForm.team_id ? parseInt(currentForm.team_id) : null,
      };

      if (id) {
        // --- LOGIC UNTUK UPDATE ---

        // Cek apakah password di form diisi (user mau ganti password)
        const isPasswordInputFilled =
          currentForm.password && currentForm.password.trim() !== "";

        if (isPasswordInputFilled) {
          // Jika user ngetik password baru, kirim password baru (Plaintext)
          payload.password = currentForm.password;
        } else {
          // Jika form kosong, KIRIM PASSWORD LAMA (yang udah ter-encrypt dari DB)
          // Ini supaya validasi @prisma/client (Required) terpenuhi
          payload.password = originalUser.password;
        }

        // Cek Perubahan (Biar ga kena "No changes detected")
        const isDataChanged =
          payload.name !== originalUser.name ||
          payload.username !== originalUser.username ||
          payload.email !== originalUser.email ||
          payload.role !== originalUser.role?.toLowerCase() ||
          payload.team_id !== (originalUser.team_id || null) ||
          isPasswordInputFilled; // Dianggap berubah kalau user ngetik password baru

        if (!isDataChanged) {
          setLoading(false);
          return Swal.fire({
            icon: "info",
            title: "NO CHANGES",
            text: "Data masih sama persis bro.",
            background: "#0a0a0a",
            color: "#fff",
          });
        }

        await UsersService.update(id, payload);
      } else {
        // --- LOGIC UNTUK CREATE ---
        payload.password = currentForm.password;
        await UsersService.create(payload);
      }

      // 4. SUCCESS HANDLING
      Swal.fire({
        icon: "success",
        title: id ? "USER UPDATED" : "USER CREATED",
        background: "#0a0a0a",
        color: "#fff",
        timer: 1500,
        showConfirmButton: false,
      });

      setForm({
        name: "",
        username: "",
        email: "",
        password: "",
        role: "member",
        team_id: "",
      });
      setEditingId(null);
      refetch();
    } catch (err) {
      console.error("Error detail:", err.response?.data);
      Swal.fire({
        icon: "error",
        title: "FAILED",
        text: err.response?.data?.message || "Terjadi kesalahan di server",
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
      name: user.name || "",
      username: user.username || "",
      email: user.email || "",
      role: user.role ? user.role.toLowerCase() : "member",
      team_id: user.team_id ? user.team_id.toString() : "", // Ubah ke string untuk value <select>
      password: "", // Kosongkan password agar tidak otomatis ter-update
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id) => {
    const confirm = await Swal.fire({
      title: "HAPUS USER?",
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
    <div class="p-6 min-h-screen text-white overflow-hidden font-sans">
      <style>{`
        .page-enter { animation: pageIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes pageIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .row-item { opacity: 0; animation: rowIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes rowIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div
        class={`max-w-7xl mx-auto space-y-10 ${isMounted() ? "page-enter" : "opacity-0"}`}
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
            {/* GRID DIUBAH JADI xl:grid-cols-3 BIAR RAPI 2 BARIS X 3 KOLOM */}
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">
                  Name
                </label>
                <input
                  type="text"
                  class="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:border-blue-500 transition-all text-white"
                  value={form().name}
                  onInput={(e) => setForm({ ...form(), name: e.target.value })}
                  placeholder="Nama Lengkap..."
                />
              </div>

              {/* INPUT USERNAME BARU */}
              <div class="space-y-2">
                <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">
                  Username
                </label>
                <input
                  type="text"
                  class="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:border-blue-500 transition-all text-white"
                  value={form().username}
                  onInput={(e) =>
                    setForm({ ...form(), username: e.target.value })
                  }
                  placeholder="Username..."
                />
              </div>

              <div class="space-y-2">
                <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">
                  Email
                </label>
                <input
                  type="email"
                  class="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:border-blue-500 transition-all text-white"
                  value={form().email}
                  onInput={(e) => setForm({ ...form(), email: e.target.value })}
                  placeholder="user@email.com"
                />
              </div>

              <div class="space-y-2">
                <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">
                  {editingId() ? "New Pass (Opt)" : "Password"}
                </label>
                <input
                  type="password"
                  class="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:border-blue-500 transition-all text-white"
                  value={form().password}
                  onInput={(e) =>
                    setForm({ ...form(), password: e.target.value })
                  }
                  placeholder="******"
                />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">
                  Role
                </label>
                <select
                  class="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:border-blue-500 transition-all cursor-pointer text-white appearance-none"
                  style="color-scheme: dark"
                  value={form().role}
                  onChange={(e) => setForm({ ...form(), role: e.target.value })}
                >
                  <option value="admin">admin</option>
                  <option value="member">member</option>
                  <option value="user">user</option>
                </select>
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">
                  Team
                </label>
                <select
                  class="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:border-blue-500 transition-all cursor-pointer text-white appearance-none"
                  style="color-scheme: dark"
                  value={form().team_id}
                  onChange={(e) =>
                    setForm({ ...form(), team_id: e.target.value })
                  }
                >
                  <option value="">No Team</option>
                  <For each={teams()}>
                    {(t) => (
                      <option value={t.id}>{t.name || t.team_name}</option>
                    )}
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
                    setForm({
                      name: "",
                      username: "", // RESET USERNAME JUGA
                      email: "",
                      password: "",
                      role: "member",
                      team_id: "",
                    });
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
        <div class="bg-gray-900/40 backdrop-blur-3xl rounded-[40px] border border-white/10 overflow-hidden shadow-2xl flex flex-col">
          <table class="w-full text-left">
            <thead class="bg-white/5 text-[10px] uppercase font-black tracking-[0.3em] text-gray-500 border-b border-white/5">
              <tr>
                <th class="p-8">Identity & Role</th>
                <th class="p-8">Team Assignment</th>
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
                      class="p-20 text-center opacity-30 font-black tracking-widest italic"
                    >
                      LOADING USERS HUB...
                    </td>
                  </tr>
                }
              >
                <For each={paginatedUsers()}>
                  {(user, i) => (
                    <tr
                      class="row-item group hover:bg-white/[0.03] transition-all duration-500"
                      style={{ "animation-delay": `${i() * 0.05}s` }}
                    >
                      <td class="p-8">
                        <div class="flex items-center gap-4">
                          <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-800 to-black flex items-center justify-center border border-white/5 group-hover:border-blue-500/50 transition-all relative">
                            <User
                              size={20}
                              class="text-gray-500 group-hover:text-blue-400"
                            />
                            <Show when={user.role?.toLowerCase() === "admin"}>
                              <div class="absolute -top-2 -right-2 bg-blue-600 rounded-full p-1 border-2 border-black">
                                <Shield size={10} />
                              </div>
                            </Show>
                          </div>
                          <div>
                            <div class="text-lg font-black tracking-tight group-hover:text-blue-400 transition-colors uppercase italic flex items-center gap-3">
                              {user.name}
                              {/* MENAMPILKAN USERNAME DI SEBELAH NAMA */}
                              <Show when={user.username}>
                                <span class="text-[10px] font-mono text-gray-500 lowercase bg-white/5 px-2 py-0.5 rounded-md border border-white/5 not-italic">
                                  @{user.username}
                                </span>
                              </Show>
                            </div>
                            <div class="flex items-center gap-2 mt-1">
                              <span
                                class={`text-[8px] font-black px-2 py-0.5 rounded border ${user.role?.toLowerCase() === "admin" ? "border-blue-500/50 text-blue-400" : "border-gray-500/50 text-gray-500"}`}
                              >
                                {user.role}
                              </span>
                              <span class="text-[10px] text-gray-600 font-mono italic">
                                {user.email}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td class="p-8">
                        <div class="flex items-center gap-2 bg-white/5 w-fit px-4 py-1.5 rounded-full border border-white/5">
                          <Users2 size={12} class="text-indigo-400" />
                          <span class="text-[10px] font-black uppercase tracking-widest text-indigo-300">
                            {teams()?.find((t) => t.id == user.team_id)?.name ||
                              teams()?.find((t) => t.id == user.team_id)
                                ?.team_name ||
                              "Unassigned"}
                          </span>
                        </div>
                      </td>
                      <td class="p-8 text-right">
                        <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
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

          {/* PAGINATION FOOTER */}
          <div class="p-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
            <div class="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              Showing page {page()} of {totalPages() || 1}
            </div>
            <div class="flex gap-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page() === 1}
                class="p-4 rounded-2xl bg-white/5 hover:bg-white/10 disabled:opacity-10 transition-all text-gray-400 hover:text-white"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages(), p + 1))}
                disabled={page() >= totalPages()}
                class="p-4 rounded-2xl bg-white/5 hover:bg-white/10 disabled:opacity-10 transition-all text-gray-400 hover:text-white"
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

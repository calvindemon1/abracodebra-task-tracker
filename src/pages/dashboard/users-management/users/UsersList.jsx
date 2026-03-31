import { createSignal, For, Show, onMount, onCleanup } from "solid-js";
import { useNavigate } from "@solidjs/router";
import {
  MoreVertical,
  Pencil,
  Trash2,
  Plus,
  UserCircle,
  Loader2,
  ShieldCheck,
  PersonStanding,
} from "lucide-solid";
import Swal from "sweetalert2";
import { Portal } from "solid-js/web";

import { UsersService } from "../../../../services/users";

export default function UsersList() {
  const navigate = useNavigate();

  // ===== STATE =====
  const [isMounted, setIsMounted] = createSignal(false);
  const [openActionId, setOpenActionId] = createSignal(null);
  const [dropdownPos, setDropdownPos] = createSignal({ x: 0, y: 0 });

  const [users, setUsers] = createSignal([]);
  const [isLoading, setIsLoading] = createSignal(true);

  // ===== FETCH DATA =====
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await UsersService.list();
      // Sesuaikan '.data' dengan struktur response API backend lu
      const data = response.data?.data || response.data || [];
      setUsers(data);
    } catch (error) {
      console.error("Gagal mengambil data user:", error);
      Swal.fire("Error", "Gagal memuat data users", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGlobalPointer = (e) => {
    if (!openActionId()) return;
    const dropdown = document.querySelector("#user-action-dropdown");
    if (!dropdown) return;
    if (
      !dropdown.contains(e.target) &&
      !e.target.closest("[data-action-trigger]")
    ) {
      setOpenActionId(null);
    }
  };

  onMount(() => {
    fetchUsers();
    setTimeout(() => setIsMounted(true), 50);
    document.addEventListener("pointerdown", handleGlobalPointer);
    window.addEventListener("resize", () => setOpenActionId(null));
    window.addEventListener("scroll", () => setOpenActionId(null));
  });

  onCleanup(() => {
    document.removeEventListener("pointerdown", handleGlobalPointer);
  });

  // ===== DELETE ACTION =====
  const handleDelete = async (user) => {
    setOpenActionId(null);
    const confirm = await Swal.fire({
      title: "Hapus User?",
      html: `
        <div class="text-left text-sm mt-2 text-gray-600">
          <p class="mb-1"><strong>Username:</strong> ${user.username}</p>
          <p><strong>Role:</strong> ${user.role_name}</p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6d6d6d",
      customClass: { cancelButton: "text-gray-800" },
    });

    if (!confirm.isConfirmed) return;

    try {
      Swal.fire({
        title: "Menghapus...",
        text: "Mohon tunggu sebentar",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      await UsersService.delete(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));

      Swal.fire({
        title: "Terhapus!",
        text: `User berhasil dihapus`,
        icon: "success",
        confirmButtonColor: "#10b981",
      });
    } catch (error) {
      console.error("Gagal menghapus user:", error);
      Swal.fire({
        title: "Error!",
        text: "Terjadi kesalahan saat menghapus user.",
        icon: "error",
      });
    }
  };

  // Helper Badge untuk Role
  const getRoleBadge = (role) => {
    const r = String(role || "").toLowerCase();
    if (r.includes("admin")) {
      return "bg-purple-100 text-purple-700 border-purple-200";
    }
    return "bg-blue-100 text-blue-700 border-blue-200";
  };

  return (
    <div class="p-6 bg-gray-50/50 min-h-screen font-sans overflow-x-hidden">
      <style>{`
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scalePop { from { opacity: 0; transform: scale(0.95) translateY(-5px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-row { opacity: 0; animation: fadeSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-dropdown { transform-origin: top right; animation: scalePop 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-spin-slow { animation: spin 1.5s linear infinite; }
      `}</style>

      <div
        class={`max-w-7xl mx-auto transition-all duration-700 ease-out transform ${
          isMounted() ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* HEADER */}
        <div class="flex justify-between items-center mb-8">
          <div>
            <h1 class="text-3xl font-bold text-gray-800 tracking-tight">
              User Management
            </h1>
            <p class="text-sm text-gray-500 mt-1">
              Kelola daftar akses pengguna dan role sistem.
            </p>
          </div>

          <div class="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin/users/create")}
              class="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
            >
              <Plus size={16} />
              Tambah User
            </button>
          </div>
        </div>

        {/* LOADING SPINNER */}
        <Show when={isLoading()}>
          <div class="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 size={40} class="animate-spin-slow mb-4 text-black" />
            <p class="text-sm font-medium">Memuat data users...</p>
          </div>
        </Show>

        <Show when={!isLoading()}>
          <div class="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
            <div class="overflow-x-auto">
              <table class="min-w-full text-sm text-left">
                <thead class="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-widest border-b border-gray-100">
                  <tr>
                    <th class="p-4 font-semibold w-12 text-center">No</th>
                    <th class="p-4 font-semibold">Username</th>
                    <th class="p-4 font-semibold">Role</th>
                    <th class="p-4 font-semibold">Position-Division</th>
                    <th class="p-4 font-semibold text-center w-16">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <Show
                    when={users().length > 0}
                    fallback={
                      <tr>
                        <td colspan="4" class="p-8 text-center text-gray-400">
                          Belum ada data user.
                        </td>
                      </tr>
                    }
                  >
                    <For each={users()}>
                      {(user, index) => (
                        <tr
                          class="animate-row hover:bg-gray-50/80 transition-colors duration-200 group"
                          style={{ "animation-delay": `${index() * 0.05}s` }}
                        >
                          <td class="p-4 text-center text-gray-400 font-medium">
                            {index() + 1}
                          </td>
                          <td class="p-4 font-medium text-gray-800 flex items-center gap-2">
                            <UserCircle size={18} class="text-gray-400" />
                            {user.username || "-"}
                          </td>
                          <td class="p-4">
                            <span
                              class={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase border ${getRoleBadge(user.role_name)}`}
                            >
                              <ShieldCheck size={12} />
                              {user.role_name || "USER"}
                            </span>
                          </td>
                          <td class="p-4 font-medium text-gray-800 flex items-center gap-2">
                            <PersonStanding size={18} class="text-gray-400" />
                            {user.position_name || "-"}-
                            {user.division_name || "-"}
                          </td>
                          <td class="p-4 text-center relative">
                            <button
                              data-action-trigger
                              onClick={(e) => {
                                const rect =
                                  e.currentTarget.getBoundingClientRect();
                                setDropdownPos({
                                  x: rect.right - 144,
                                  y: rect.bottom + 8,
                                });
                                setOpenActionId(
                                  openActionId() === user.id ? null : user.id,
                                );
                              }}
                              class="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <MoreVertical size={18} />
                            </button>

                            {/* DROPDOWN MENU */}
                            <Show when={openActionId() === user.id}>
                              <Portal>
                                <div
                                  id="user-action-dropdown"
                                  class="animate-dropdown fixed w-36 bg-white border border-gray-100 rounded-xl shadow-xl z-[9999] overflow-hidden p-1"
                                  style={{
                                    top: `${dropdownPos().y}px`,
                                    left: `${dropdownPos().x}px`,
                                  }}
                                >
                                  <button
                                    onClick={() =>
                                      navigate(`/admin/users/edit/${user.id}`)
                                    }
                                    class="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black w-full text-left rounded-lg transition-colors"
                                  >
                                    <Pencil size={14} /> Edit
                                  </button>
                                  <div class="h-px bg-gray-100 my-1"></div>
                                  <button
                                    onClick={() => handleDelete(user)}
                                    class="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left rounded-lg transition-colors"
                                  >
                                    <Trash2 size={14} /> Hapus
                                  </button>
                                </div>
                              </Portal>
                            </Show>
                          </td>
                        </tr>
                      )}
                    </For>
                  </Show>
                </tbody>
              </table>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
}

import { createSignal, For, Show, onMount, onCleanup } from "solid-js";
import { useNavigate } from "@solidjs/router";
import {
  MoreVertical,
  Pencil,
  Trash2,
  Plus,
  ShieldAlert,
  Loader2,
  Key,
} from "lucide-solid";
import Swal from "sweetalert2";
import { Portal } from "solid-js/web";

import { RolePermissionsService } from "../../../../services/role-permissions"; // Sesuaikan path

export default function RolePermissionsList() {
  const navigate = useNavigate();

  const [isMounted, setIsMounted] = createSignal(false);
  const [openActionId, setOpenActionId] = createSignal(null);
  const [dropdownPos, setDropdownPos] = createSignal({ x: 0, y: 0 });

  const [roles, setRoles] = createSignal([]);
  const [isLoading, setIsLoading] = createSignal(true);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const response = await RolePermissionsService.list();

      const data = response.data?.data || response.data || [];
      setRoles(data);
    } catch (error) {
      console.error("Gagal mengambil data role:", error);
      Swal.fire("Error", "Gagal memuat data roles & permissions", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGlobalPointer = (e) => {
    if (!openActionId()) return;
    const dropdown = document.querySelector("#role-action-dropdown");
    if (!dropdown) return;
    if (
      !dropdown.contains(e.target) &&
      !e.target.closest("[data-action-trigger]")
    ) {
      setOpenActionId(null);
    }
  };

  onMount(() => {
    fetchRoles();
    setTimeout(() => setIsMounted(true), 50);
    document.addEventListener("pointerdown", handleGlobalPointer);
    window.addEventListener("resize", () => setOpenActionId(null));
    window.addEventListener("scroll", () => setOpenActionId(null));
  });

  onCleanup(() => {
    document.removeEventListener("pointerdown", handleGlobalPointer);
  });

  const handleDelete = async (roleItem) => {
    setOpenActionId(null);
    const confirm = await Swal.fire({
      title: "Hapus Role?",
      html: `
        <div class="text-left text-sm mt-2 text-gray-600">
          <p class="mb-1"><strong>Role Name:</strong> ${roleItem.role_name}</p>
          <p class="text-red-500 mt-2">Peringatan: User dengan role ini mungkin akan kehilangan hak akses!</p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#f3f4f6",
      customClass: { cancelButton: "text-gray-800" },
    });

    if (!confirm.isConfirmed) return;

    try {
      Swal.fire({
        title: "Menghapus...",
        text: "Mohon tunggu sebentar",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      await RolePermissionsService.delete(roleItem.id);
      setRoles((prev) => prev.filter((r) => r.id !== roleItem.id));

      Swal.fire("Terhapus!", `Role berhasil dihapus`, "success");
    } catch (error) {
      console.error(error);
      Swal.fire("Error!", "Terjadi kesalahan saat menghapus role.", "error");
    }
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
        <div class="flex justify-between items-center mb-8">
          <div>
            <h1 class="text-3xl font-bold text-gray-800 tracking-tight">
              Roles & Permissions
            </h1>
            <p class="text-sm text-gray-500 mt-1">
              Kelola role dan penetapan hak akses (permissions).
            </p>
          </div>

          <button
            onClick={() => navigate("/admin/role-permissions/create")}
            class="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 hover:-translate-y-0.5 active:scale-95 transition-all"
          >
            <Plus size={16} /> Buat Role Baru
          </button>
        </div>

        <Show when={isLoading()}>
          <div class="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 size={40} class="animate-spin-slow mb-4 text-black" />
            <p class="text-sm font-medium">Memuat data roles...</p>
          </div>
        </Show>

        <Show when={!isLoading()}>
          <div class="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
            <div class="overflow-x-auto">
              <table class="min-w-full text-sm text-left">
                <thead class="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-widest border-b border-gray-100">
                  <tr>
                    <th class="p-4 font-semibold w-16 text-center">ID</th>
                    <th class="p-4 font-semibold w-1/4">Nama Role</th>
                    <th class="p-4 font-semibold">
                      Total Hak Akses (Permissions)
                    </th>
                    <th class="p-4 font-semibold text-center w-16">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  <Show
                    when={roles().length > 0}
                    fallback={
                      <tr>
                        <td colspan="4" class="p-12 text-center text-gray-400">
                          <ShieldAlert
                            size={40}
                            class="mx-auto mb-3 text-gray-300"
                          />
                          Belum ada data role.
                        </td>
                      </tr>
                    }
                  >
                    <For each={roles()}>
                      {(item, index) => {
                        // Asumsi API return `permissions` array of object, atau `permission_ids`
                        const totalPerms =
                          item.permissions?.length ||
                          item.permission_ids?.length ||
                          0;

                        return (
                          <tr
                            class="animate-row hover:bg-gray-50/80 transition-colors"
                            style={{ "animation-delay": `${index() * 0.05}s` }}
                          >
                            <td class="p-4 text-center text-gray-400 font-medium">
                              {item.id}
                            </td>
                            <td class="p-4 font-bold text-gray-800 flex items-center gap-2">
                              <ShieldAlert size={16} class="text-blue-500" />
                              <span class="uppercase tracking-wide">
                                {item.role_name}
                              </span>
                            </td>
                            <td class="p-4">
                              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                <Key size={12} /> {totalPerms} Akses Diberikan
                              </span>
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
                                    openActionId() === item.id ? null : item.id,
                                  );
                                }}
                                class="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <MoreVertical size={18} />
                              </button>

                              <Show when={openActionId() === item.id}>
                                <Portal>
                                  <div
                                    id="role-action-dropdown"
                                    class="animate-dropdown fixed w-36 bg-white border border-gray-100 rounded-xl shadow-xl z-[9999] overflow-hidden p-1"
                                    style={{
                                      top: `${dropdownPos().y}px`,
                                      left: `${dropdownPos().x}px`,
                                    }}
                                  >
                                    <button
                                      onClick={() =>
                                        navigate(
                                          `/admin/role-permissions/edit/${item.id}`,
                                        )
                                      }
                                      class="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black w-full text-left rounded-lg transition-colors"
                                    >
                                      <Pencil size={14} /> Edit Role
                                    </button>
                                    <div class="h-px bg-gray-100 my-1"></div>
                                    <button
                                      onClick={() => handleDelete(item)}
                                      class="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left rounded-lg transition-colors"
                                    >
                                      <Trash2 size={14} /> Hapus
                                    </button>
                                  </div>
                                </Portal>
                              </Show>
                            </td>
                          </tr>
                        );
                      }}
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

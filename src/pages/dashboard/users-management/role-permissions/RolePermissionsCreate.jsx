import { createSignal, For, onMount, Show } from "solid-js";
import { useNavigate, useParams } from "@solidjs/router";
import { Loader2, ShieldCheck, KeyRound, CheckSquare } from "lucide-solid";
import Swal from "sweetalert2";

// Import Services
import { RolePermissionsService } from "../../../../services/role-permissions";
import { PermissionsService } from "../../../../services/permissions"; // Butuh buat nge-load master permissions

const baseInputClass =
  "w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm text-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-100 focus:border-gray-400 transition-all duration-200";

export default function RolePermissionsCreate() {
  const navigate = useNavigate();
  const params = useParams();
  const isEdit = () => !!params.id;

  const [isMounted, setIsMounted] = createSignal(false);
  const [isLoading, setIsLoading] = createSignal(false);
  const [isSaving, setIsSaving] = createSignal(false);

  // Master Data & Form State
  const [allPermissions, setAllPermissions] = createSignal([]);
  const [form, setForm] = createSignal({
    role_name: "",
    permission_ids: [],
  });

  onMount(async () => {
    setTimeout(() => setIsMounted(true), 50);

    await fetchMasterPermissions();

    if (isEdit()) {
      await fetchDetailRole();
    }
  });

  // 1. Ambil seluruh list Permission dari master data
  const fetchMasterPermissions = async () => {
    try {
      const res = await PermissionsService.list();
      setAllPermissions(res.data?.data || res.data || []);
    } catch (error) {
      console.error("Gagal load master permissions", error);
    }
  };

  // 2. Jika mode Edit, cari data Role-nya (karena ga ada getById, kita filter dari list)
  const fetchDetailRole = async () => {
    setIsLoading(true);
    try {
      const response = await RolePermissionsService.list();
      const rolesList = response.data?.data || response.data || [];
      const roleItem = rolesList.find((r) => r.id == params.id);

      if (roleItem) {
        // Ambil ID permissions yang udah ter-assign (Handle kalau bentuknya object array / id array)
        let mappedIds = [];
        if (Array.isArray(roleItem.permission_ids)) {
          mappedIds = roleItem.permission_ids;
        } else if (Array.isArray(roleItem.permissions)) {
          mappedIds = roleItem.permissions.map((p) => p.id);
        }

        setForm({
          role_name: roleItem.role_name || "",
          permission_ids: mappedIds,
        });
      } else {
        Swal.fire("Error", "Data role tidak ditemukan", "error");
        navigate("/admin/role-permissions");
      }
    } catch (error) {
      console.error("Gagal load detail role:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler Ganti Text
  const handleNameChange = (val) =>
    setForm((prev) => ({ ...prev, role_name: val }));

  // Handler Klik Checkbox Permission (Card)
  const togglePermission = (permId) => {
    setForm((prev) => {
      const currentIds = prev.permission_ids;
      if (currentIds.includes(permId)) {
        // Jika sudah ada, hapus dari array
        return {
          ...prev,
          permission_ids: currentIds.filter((id) => id !== permId),
        };
      } else {
        // Jika belum ada, tambah ke array
        return { ...prev, permission_ids: [...currentIds, permId] };
      }
    });
  };

  // Fitur Pilih Semua
  const toggleAll = () => {
    if (form().permission_ids.length === allPermissions().length) {
      setForm((prev) => ({ ...prev, permission_ids: [] })); // Unselect All
    } else {
      const allIds = allPermissions().map((p) => p.id);
      setForm((prev) => ({ ...prev, permission_ids: allIds })); // Select All
    }
  };

  const handleSubmit = async () => {
    if (!form().role_name) {
      return Swal.fire("Peringatan", "Nama Role wajib diisi!", "warning");
    }

    setIsSaving(true);

    // Sesuai JSON structure request lu
    const payload = {
      role_name: form().role_name,
      permission_ids: form().permission_ids, // Array of integers [1, 2, 3]
    };

    try {
      if (isEdit()) {
        await RolePermissionsService.update(params.id, payload);
        Swal.fire({
          title: "Success",
          text: "Role berhasil diperbarui",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await RolePermissionsService.create(payload);
        Swal.fire({
          title: "Success",
          text: "Role baru berhasil dibuat",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      }
      navigate("/admin/role-permissions");
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Gagal menyimpan role", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div class="p-6 bg-gray-50/50 min-h-screen font-sans">
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin 1.5s linear infinite; }
      `}</style>

      <div
        class={`max-w-5xl mx-auto transition-all duration-700 ease-out transform ${
          isMounted() ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div class="flex justify-between items-center mb-8">
          <h1 class="text-3xl font-bold text-gray-800 tracking-tight">
            {isEdit() ? "Edit Role & Permissions" : "Create New Role"}
          </h1>
        </div>

        <div class="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 space-y-8 border border-gray-100 relative">
          <Show when={isLoading()}>
            <div class="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-2xl">
              <Loader2 size={40} class="animate-spin-slow text-black mb-4" />
              <p class="text-gray-500 font-medium">Memuat data role...</p>
            </div>
          </Show>

          {/* SECTION 1: ROLE INFO */}
          <section class="p-6 rounded-xl bg-gray-50/50 border border-gray-100">
            <h2 class="text-xs font-bold mb-6 text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={16} class="text-blue-500" /> Profil Role
            </h2>
            <div class="w-full md:w-1/2">
              <label class="block text-sm font-medium mb-2 text-gray-700">
                Nama Role <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form().role_name}
                onInput={(e) => handleNameChange(e.target.value)}
                placeholder="Misal: peasant, manager, admin..."
                class={baseInputClass}
              />
            </div>
          </section>

          {/* SECTION 2: PERMISSIONS CHECKBOX GRID */}
          <section class="p-6 rounded-xl bg-gray-50/50 border border-gray-100">
            <div class="flex justify-between items-end mb-6">
              <h2 class="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <KeyRound size={16} class="text-orange-500" /> Tetapkan Hak
                Akses
              </h2>

              <button
                onClick={toggleAll}
                class="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                <CheckSquare size={16} />
                {form().permission_ids.length === allPermissions().length
                  ? "Batalkan Semua"
                  : "Pilih Semua"}
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <For each={allPermissions()}>
                {(perm) => {
                  const isSelected = () =>
                    form().permission_ids.includes(perm.id);

                  return (
                    <div
                      onClick={() => togglePermission(perm.id)}
                      class={`relative flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 select-none ${
                        isSelected()
                          ? "border-blue-500 bg-blue-50 shadow-[0_0_0_2px_rgba(59,130,246,0.1)]"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div
                        class={`w-5 h-5 flex-shrink-0 rounded border flex items-center justify-center transition-colors ${
                          isSelected()
                            ? "bg-blue-600 border-blue-600"
                            : "bg-white border-gray-300"
                        }`}
                      >
                        <Show when={isSelected()}>
                          <svg
                            class="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            stroke-width="3"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </Show>
                      </div>
                      <span
                        class={`text-sm font-semibold truncate ${isSelected() ? "text-blue-900" : "text-gray-700"}`}
                      >
                        {perm.permission_name}
                      </span>
                    </div>
                  );
                }}
              </For>
            </div>

            <Show when={allPermissions().length === 0}>
              <div class="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                Belum ada master data permission.
              </div>
            </Show>
          </section>

          {/* ACTIONS */}
          <div class="flex justify-end gap-4 pt-6 border-t border-gray-100">
            <button
              onClick={() => navigate("/admin/role-permissions")}
              class="px-6 py-2.5 font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
              disabled={isSaving()}
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving()}
              class="flex items-center gap-2 px-8 py-2.5 font-medium bg-black text-white rounded-xl hover:bg-gray-800 hover:shadow-lg active:scale-95 transition-all disabled:opacity-70"
            >
              <Show when={isSaving()}>
                <Loader2 size={16} class="animate-spin-slow" />
              </Show>
              {isSaving()
                ? "Menyimpan..."
                : isEdit()
                  ? "Update Role"
                  : "Simpan Role"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

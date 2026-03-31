import {
  createResource,
  createSignal,
  createMemo,
  For,
  Show,
  onMount,
} from "solid-js";
import {
  CircleX,
  Edit,
  Plus,
  Save,
  X,
  Key,
  ChevronLeft,
  ChevronRight,
} from "lucide-solid";
import Swal from "sweetalert2";

// Sesuaikan path import ini ke file api service Permissions lu
import { PermissionsService } from "../../../../services/permissions";

export default function Permissions() {
  // ===== ANIMATION STATE =====
  const [isMounted, setIsMounted] = createSignal(false);

  const [permissions, { refetch }] = createResource(() =>
    PermissionsService.list(),
  );

  const [name, setName] = createSignal("");
  const [editingId, setEditingId] = createSignal(null);

  // ===== PAGINATION STATE & LOGIC =====
  const [currentPage, setCurrentPage] = createSignal(1);
  const ITEMS_PER_PAGE = 20;

  // Hitung total halaman
  const totalPages = createMemo(() => {
    const data = permissions()?.data || [];
    return Math.ceil(data.length / ITEMS_PER_PAGE) || 1;
  });

  // Potong data sesuai halaman yang aktif
  const paginatedData = createMemo(() => {
    const data = permissions()?.data || [];
    const startIndex = (currentPage() - 1) * ITEMS_PER_PAGE;
    return data.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  });

  onMount(() => {
    // Trigger animasi setelah komponen di-render
    setTimeout(() => setIsMounted(true), 50);
  });

  const submit = async () => {
    if (!name()) {
      return Swal.fire({
        icon: "warning",
        title: "Form belum lengkap",
        text: "Nama permission wajib diisi!",
        confirmButtonColor: "#000",
      });
    }

    try {
      if (editingId()) {
        await PermissionsService.update(editingId(), {
          permission_name: name(),
        });
        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: "Permission berhasil diperbarui ✅",
          confirmButtonColor: "#10b981",
        });
      } else {
        await PermissionsService.create({ permission_name: name() });
        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: "Permission berhasil ditambahkan ✅",
          confirmButtonColor: "#10b981",
        });
        // Balik ke halaman 1 kalau abis nambah data baru
        setCurrentPage(1);
      }

      setName("");
      setEditingId(null);
      refetch();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal!",
        text: "Terjadi kesalahan saat menyimpan data ❌",
        confirmButtonColor: "#ef4444",
      });
    }
  };

  const remove = async (id) => {
    const confirm = await Swal.fire({
      title: "Hapus data?",
      text: "Data permission akan terhapus permanen.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#f3f4f6",
      customClass: {
        cancelButton: "text-gray-800",
      },
    });

    if (!confirm.isConfirmed) return;

    try {
      await PermissionsService.delete(id);
      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Permission berhasil dihapus ✅",
        confirmButtonColor: "#10b981",
      });

      // Jika data di halaman terakhir habis dihapus, mundur 1 halaman
      if (paginatedData().length === 1 && currentPage() > 1) {
        setCurrentPage(currentPage() - 1);
      }

      refetch();
    } catch {
      Swal.fire({
        icon: "error",
        title: "Gagal!",
        text: "Tidak dapat menghapus data ❌",
        confirmButtonColor: "#ef4444",
      });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName("");
  };

  return (
    <div class="p-6 bg-gray-50/50 min-h-screen font-sans">
      {console.log("Data roles & permissions berhasil dimuat:", permissions())}
      {/* ===== INJECT CUSTOM KEYFRAMES ===== */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-row {
          opacity: 0;
          animation: fadeSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* CONTAINER UTAMA */}
      <div
        class={`max-w-4xl mx-auto space-y-6 transition-all duration-700 ease-out transform ${
          isMounted() ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* HEADER */}
        <div class="flex items-center gap-4 mb-6">
          <div class="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-700">
            <Key size={24} />
          </div>
          <div>
            <h1 class="text-2xl font-bold text-gray-800 tracking-tight">
              Master Permissions
            </h1>
            <p class="text-sm text-gray-500 mt-0.5">
              Kelola daftar hak akses fungsional (permissions) sistem.
            </p>
          </div>
        </div>

        {/* INPUT FORM SECTION */}
        <div class="bg-white p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
            {editingId() ? "Edit Permission" : "Add New Permission"}
          </label>
          <div class="flex flex-col sm:flex-row gap-3">
            <div class="relative flex-1">
              <input
                type="text"
                class={`w-full px-4 py-2.5 rounded-xl text-sm transition-all duration-200 outline-none border ${
                  editingId()
                    ? "bg-blue-50/50 border-blue-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                    : "bg-gray-50/50 border-gray-200 focus:border-gray-400 focus:ring-4 focus:ring-gray-100"
                }`}
                placeholder="e.g. delete_checklist_abracodebra, teleport..."
                value={name()}
                onInput={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            </div>

            <div class="flex gap-2">
              <button
                onClick={submit}
                class={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                  editingId()
                    ? "bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20"
                    : "bg-black hover:bg-gray-800 hover:shadow-lg"
                }`}
              >
                {editingId() ? <Save size={16} /> : <Plus size={16} />}
                {editingId() ? "Update" : "Add Data"}
              </button>

              <Show when={editingId()}>
                <button
                  onClick={cancelEdit}
                  class="flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all active:scale-95"
                  title="Cancel Edit"
                >
                  <X size={18} />
                </button>
              </Show>
            </div>
          </div>
        </div>

        {/* TABLE SECTION */}
        <div class="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden flex flex-col">
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm text-left">
              <thead class="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-widest border-b border-gray-100">
                <tr>
                  <th class="p-4 font-semibold text-center w-16">No</th>
                  <th class="p-4 font-semibold">Permission Name</th>
                  <th class="p-4 font-semibold text-center w-32">Actions</th>
                </tr>
              </thead>

              <tbody class="divide-y divide-gray-50">
                <Show when={permissions.loading}>
                  <tr>
                    <td colspan="3" class="p-12 text-center">
                      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
                      <p class="text-gray-500 text-sm font-medium">
                        Memuat data...
                      </p>
                    </td>
                  </tr>
                </Show>

                <Show
                  when={
                    !permissions.loading &&
                    (!permissions() || permissions().data.length === 0)
                  }
                >
                  <tr>
                    <td colspan="3" class="p-12 text-center text-gray-500">
                      <Key size={40} class="mx-auto text-gray-300 mb-3" />
                      <p class="font-medium text-gray-600">
                        Belum ada data permission
                      </p>
                      <p class="text-sm mt-1">
                        Silakan tambah data melalui form di atas.
                      </p>
                    </td>
                  </tr>
                </Show>

                {/* LOOPING MENGGUNAKAN PAGINATED DATA */}
                <For each={paginatedData()}>
                  {(item, i) => (
                    <tr
                      class="animate-row hover:bg-gray-50/80 transition-colors duration-200 group"
                      style={{ "animation-delay": `${i() * 0.05}s` }}
                    >
                      <td class="p-4 text-center text-gray-400 font-medium">
                        {/* Hitung nomor baris secara dinamis berdasarkan halaman */}
                        {(currentPage() - 1) * ITEMS_PER_PAGE + i() + 1}
                      </td>
                      <td class="p-4 font-medium text-gray-700 flex items-center gap-3">
                        <div class="w-2 h-2 rounded-full bg-gray-300 group-hover:bg-black transition-colors"></div>
                        <code class="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-bold border border-gray-200">
                          {item.permission_name}
                        </code>
                      </td>
                      <td class="p-4 text-center">
                        <div class="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            class="p-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors"
                            title="Edit"
                            onClick={() => {
                              setEditingId(item.id);
                              setName(item.permission_name);
                            }}
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            class="p-2 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                            title="Hapus"
                            onClick={() => remove(item.id)}
                          >
                            <CircleX size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>

          {/* PAGINATION CONTROLS */}
          <Show when={!permissions.loading && totalPages() > 1}>
            <div class="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <span class="text-sm text-gray-500 font-medium">
                Halaman{" "}
                <span class="text-gray-900 font-bold">{currentPage()}</span>{" "}
                dari <span class="text-gray-900 font-bold">{totalPages()}</span>
              </span>
              <div class="flex gap-2">
                <button
                  disabled={currentPage() === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  class="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={currentPage() === totalPages()}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages(), p + 1))
                  }
                  class="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
}

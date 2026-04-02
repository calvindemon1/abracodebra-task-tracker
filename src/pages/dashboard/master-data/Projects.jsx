import { createSignal, onMount, For, Show } from "solid-js";
import {
  Plus,
  Search,
  Layers,
  Trash2,
  Pencil,
  Loader2,
  LayoutGrid,
  ExternalLink,
} from "lucide-solid";
import Swal from "sweetalert2";
import { ProjectsService } from "../../../services/projects";
import { useNavigate } from "@solidjs/router";

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = createSignal([]);
  const [isLoading, setIsLoading] = createSignal(true);
  const [isSaving, setIsSaving] = createSignal(false);
  const [showModal, setShowModal] = createSignal(false);
  const [searchQuery, setSearchQuery] = createSignal("");

  // State untuk form tambah/edit
  const [formData, setFormData] = createSignal({
    id: null,
    name: "",
    description: "",
  });

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const res = await ProjectsService.list()
      setProjects(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(true); // Biar transisi smooth
      setTimeout(() => setIsLoading(false), 300);
    }
  };

  onMount(fetchProjects);

  const filteredProjects = () => {
    return projects().filter((p) =>
      p.name.toLowerCase().includes(searchQuery().toLowerCase()),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (formData().id) {
        await ProjectsService.update(formData().id, formData());
      } else {
        await ProjectsService.create(formData());
      }

      Swal.fire({
        icon: "success",
        title: "Project Saved",
        background: "#0a0a0a",
        color: "#fff",
        timer: 1000,
        showConfirmButton: false,
      });

      setShowModal(false);
      setFormData({ id: null, name: "", description: "" });
      fetchProjects();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || "Gagal simpan",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Hapus Master Project?",
      text: "Semua penugasan di dalamnya akan ikut terhapus!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      background: "#0a0a0a",
      color: "#fff",
    });

    if (confirm.isConfirmed) {
      try {
        await ProjectsService.delete(id);
        fetchProjects();
      } catch (err) {
        Swal.fire("Error", "Gagal hapus data", "error");
      }
    }
  };

  return (
    <div class="p-6 max-w-7xl mx-auto text-white">
      <style>{`
        .animate-in { animation: fadeIn 0.5s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* HEADER */}
      <div class="flex justify-between items-center mb-10 animate-in">
        <div>
          <h1 class="text-4xl font-black tracking-tighter uppercase italic">
            Master Projects
          </h1>
          <p class="text-gray-500 text-xs font-bold tracking-widest mt-1 uppercase">
            Database Judul Project Utama
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({ id: null, name: "", description: "" });
            setShowModal(true);
          }}
          class="bg-white text-black px-6 py-3 rounded-2xl font-black hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-xl"
        >
          <Plus size={20} /> CREATE NEW PROJECT
        </button>
      </div>

      {/* SEARCH BAR */}
      <div class="relative mb-8 animate-in" style="animation-delay: 0.1s">
        <Search
          class="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600"
          size={20}
        />
        <input
          type="text"
          placeholder="Cari nama project..."
          class="w-full bg-white/5 border border-white/10 rounded-[24px] pl-16 pr-6 py-5 text-lg font-bold outline-none focus:border-blue-600 transition-all"
          onInput={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* GRID LIST */}
      <Show
        when={!isLoading()}
        fallback={
          <div class="py-40 text-center opacity-20">
            <Loader2 size={48} class="animate-spin mx-auto" />
          </div>
        }
      >
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <For each={filteredProjects()}>
            {(project) => (
              <div class="bg-gray-900/40 border border-white/10 p-8 rounded-[32px] hover:border-blue-600/50 transition-all group animate-in">
                <div class="flex justify-between items-start mb-6">
                  <div class="p-3 bg-blue-600/10 text-blue-500 rounded-2xl">
                    <Layers size={24} />
                  </div>
                  <div class="flex gap-2">
                    <button
                      onClick={() => {
                        setFormData({
                          id: project.id,
                          name: project.name,
                          description: project.description,
                        });
                        setShowModal(true);
                      }}
                      class="p-2 text-gray-600 hover:text-white transition-colors"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      class="p-2 text-gray-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <h3 class="text-xl font-black uppercase tracking-tight mb-2 group-hover:text-blue-400 transition-colors">
                  {project.name}
                </h3>
                <p class="text-gray-500 text-sm font-medium line-clamp-2 mb-6">
                  {project.description || "Tidak ada deskripsi."}
                </p>

                <div class="pt-6 border-t border-white/5 flex justify-between items-center">
                  <div class="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                    Status: <span class="text-blue-500">{project.status}</span>
                  </div>
                  <div class="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                    {project.tasks?.length || 0} Assignments
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>

      {/* MODAL FORM */}
      <Show when={showModal()}>
        <div class="fixed inset-0 z-[9999] flex items-center justify-center p-6 backdrop-blur-xl bg-black/60 animate-in">
          <div class="bg-[#0f0f0f] border border-white/10 w-full max-w-lg rounded-[40px] p-10 shadow-2xl">
            <h2 class="text-2xl font-black uppercase tracking-tighter mb-8">
              {formData().id ? "Edit Project" : "New Master Project"}
            </h2>
            <form onSubmit={handleSubmit} class="space-y-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black text-gray-500 uppercase ml-2">
                  Project Name
                </label>
                <input
                  required
                  type="text"
                  class="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold outline-none focus:border-blue-600"
                  value={formData().name}
                  onInput={(e) =>
                    setFormData({ ...formData(), name: e.target.value })
                  }
                />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-gray-500 uppercase ml-2">
                  Description
                </label>
                <textarea
                  rows="4"
                  class="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold outline-none focus:border-blue-600"
                  value={formData().description}
                  onInput={(e) =>
                    setFormData({ ...formData(), description: e.target.value })
                  }
                ></textarea>
              </div>

              <div class="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  class="flex-1 bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl transition-all"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isSaving()}
                  class="flex-1 bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-500 transition-all flex items-center justify-center gap-2"
                >
                  <Show
                    when={isSaving()}
                    fallback={formData().id ? "UPDATE" : "CREATE"}
                  >
                    <Loader2 size={20} class="animate-spin" />
                  </Show>
                </button>
              </div>
            </form>
          </div>
        </div>
      </Show>
    </div>
  );
}

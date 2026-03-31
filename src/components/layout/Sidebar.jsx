import { useNavigate, useLocation, A } from "@solidjs/router"; // Tambah A di sini
import { createSignal, createEffect, For, Show, on } from "solid-js";
import {
  Boxes,
  Database,
  BarChart3,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  LayoutGrid,
} from "lucide-solid";
import logoAbra from "../../assets/img/logo-abracodebra.png";
import logoGramAbra from "../../assets/img/logogram-abracodebra.png";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [openKeys, setOpenKeys] = createSignal([]);
  const [collapsed, setCollapsed] = createSignal(false);

  const toggleMenu = (key) => {
    setOpenKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const isOpen = (key) => openKeys().includes(key);

  // Kunci perbaikan 1: Logic active yang lebih solid
  const checkActive = (path) => {
    if (!path) return false;
    const current = location.pathname;
    if (path === "/main") return current === "/main";
    return current === path || current.startsWith(`${path}/`);
  };

  // Kunci perbaikan 2: Cek group active secara rekursif
  const isGroupActive = (item) => {
    if (item.children) {
      return item.children.some((child) => {
        if (child.children) return isGroupActive(child);
        return checkActive(child.path);
      });
    }
    return checkActive(item.path);
  };

  const menus = [
    {
      key: "dashboard",
      label: "Overview",
      icon: LayoutGrid,
      path: "/main",
    },
    {
      key: "master-data",
      label: "Master Data",
      icon: Database,
      children: [
        { label: "Teams Division", path: "/main/teams" },
        { label: "Users", path: "/main/users" }
      ],
    },
    {
      key: "task",
      label: "Project Hub",
      icon: Boxes,
      children: [{ label: "All Tasks", path: "/main/task-list" }],
    },
  ];

  // Auto-expand menu saat pindah page
  createEffect(() => {
    const currentPath = location.pathname;
    menus.forEach((item) => {
      if (item.children && isGroupActive(item)) {
        if (!openKeys().includes(item.key)) {
          setOpenKeys((prev) => [...prev, item.key]);
        }
      }
    });
  });

  const renderMenu = (items, level = 0) => {
    return (
      <For each={items}>
        {(item) => {
          const hasChildren = !!item.children;
          const Icon = item.icon;

          // Kita bungkus pengecekan active di dalam function/memo agar reaktif
          const active = () =>
            hasChildren ? isGroupActive(item) : checkActive(item.path);

          if (hasChildren) {
            return (
              <div class="mb-2">
                <button
                  onClick={() => toggleMenu(item.key)}
                  class={`w-full flex items-center ${collapsed() ? "justify-center" : "justify-between"} 
                  p-3 rounded-2xl transition-all duration-300 group relative
                  ${active() ? "text-white bg-white/5 shadow-[inset_0_0_12px_rgba(255,255,255,0.02)]" : "text-gray-500 hover:text-gray-200"}`}
                >
                  <div class="flex items-center gap-3">
                    {Icon && (
                      <Icon
                        size={20}
                        class={`${active() ? "text-blue-500" : "group-hover:text-white"} transition-colors`}
                      />
                    )}
                    <Show when={!collapsed()}>
                      <span
                        class={`text-sm tracking-tight font-bold uppercase ${active() ? "opacity-100" : "opacity-60 group-hover:opacity-100"}`}
                      >
                        {item.label}
                      </span>
                    </Show>
                  </div>
                  <Show when={!collapsed()}>
                    <ChevronDown
                      size={14}
                      class={`transition-transform duration-500 ${isOpen(item.key) ? "rotate-180 text-blue-500" : "text-gray-600"}`}
                    />
                  </Show>
                </button>

                <Show when={isOpen(item.key) && !collapsed()}>
                  <div class="flex flex-col mt-2 ml-6 pl-4 border-l-2 border-white/5 space-y-1 relative">
                    {renderMenu(item.children, level + 1)}
                  </div>
                </Show>
              </div>
            );
          }

          return (
            <A
              href={item.path}
              class={`relative flex items-center ${collapsed() ? "justify-center p-3" : "px-4 py-3 gap-3"} 
              rounded-2xl transition-all duration-300 group mb-1
              ${
                active()
                  ? "bg-blue-600/10 text-white shadow-[0_0_20px_rgba(37,99,235,0.1)]"
                  : "text-gray-500 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Show when={level === 0}>
                {Icon ? (
                  <Icon
                    size={20}
                    class={
                      active() ? "text-blue-500" : "group-hover:text-blue-400"
                    }
                  />
                ) : (
                  <CircleDot size={18} />
                )}
              </Show>

              <Show when={level > 0 && !collapsed()}>
                <div
                  class={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${active() ? "bg-blue-500 scale-125 shadow-[0_0_8px_rgba(59,130,246,0.8)]" : "bg-gray-700"}`}
                />
              </Show>

              <Show when={!collapsed()}>
                <span
                  class={`text-[13px] tracking-wide ${active() ? "font-black" : "font-semibold"}`}
                >
                  {item.label}
                </span>
              </Show>

              <Show when={active() && !collapsed()}>
                <div class="absolute right-3 w-1 h-1 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]" />
              </Show>
            </A>
          );
        }}
      </For>
    );
  };

  return (
    <aside class="min-h-screen p-4 flex items-start z-50">
      <style>{`
        .sidebar-scroll::-webkit-scrollbar { width: 0px; }
        .sidebar-scroll { scrollbar-width: none; }
      `}</style>

      <div
        class={`${collapsed() ? "w-24" : "w-72"} bg-gray-900/50 text-white p-4 flex flex-col rounded-[32px] border border-white/5 h-[calc(100vh-32px)] sticky top-4 transition-all duration-500 shadow-2xl`}
      >
        <div
          class={`flex items-center ${collapsed() ? "justify-center" : "justify-between"} mb-10 mt-2 px-2`}
        >
          <Show
            when={!collapsed()}
            fallback={
              <button
                onClick={() => setCollapsed(false)}
                class="group relative w-full h-12 bg-white/5 hover:bg-blue-600/10 rounded-full flex flex-col items-center justify-center transition-all duration-500 overflow-hidden shadow-2xl border border-white/5 active:scale-95"
              >
                <img
                  src={logoGramAbra}
                  class="w-8 h-8 object-contain transition-all duration-500 group-hover:scale-0 group-hover:opacity-0"
                  alt="Logo"
                />
                <div class="absolute inset-0 flex items-center justify-center translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 text-blue-500">
                  <ChevronRight size={24} stroke-width={3} />
                </div>
              </button>
            }
          >
            <div class="flex items-center justify-between w-full pr-2">
              <img
                src={logoAbra}
                class="h-40 -my-32 -mx-10 object-contain select-none"
                alt="Logo"
              />
              <button
                onClick={() => setCollapsed(true)}
                class="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all"
              >
                <ChevronLeft size={18} />
              </button>
            </div>
          </Show>
        </div>

        <nav class="flex flex-col flex-1 overflow-y-auto sidebar-scroll space-y-1">
          {renderMenu(menus)}
        </nav>

        <div class="pt-6 mt-2 border-t border-white/5">
          <button
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/login");
            }}
            class="w-full flex items-center gap-3 px-5 py-4 rounded-[20px] text-red-500 bg-red-500/5 hover:bg-red-500 hover:text-white transition-all duration-500 group"
          >
            <LogOut
              size={20}
              class="group-hover:-translate-x-1 transition-transform"
            />
            <Show when={!collapsed()}>
              <span class="text-xs font-black uppercase tracking-widest">
                Sign Out
              </span>
            </Show>
          </button>
        </div>
      </div>
    </aside>
  );
}

import logoGramAbra from "../../assets/img/logogram-abracodebra.png";
import { Bell, Search, User } from "lucide-solid";

export default function Navbar() {
  return (
    <header class="py-4 pr-4 z-40">
      <div
        class="
          bg-gray-900/50
          backdrop-blur-xl
          rounded-[24px] 
          px-8 py-4 
          flex justify-between items-center
          border border-white/5
          shadow-[0_20px_50px_rgba(0,0,0,0.3)]
          transition-all duration-300
          w-full
        "
      >
        {/* LEFT: Title & Context */}
        <div class="flex flex-col">
          <h1 class="font-black text-xl text-white tracking-tighter uppercase italic">
            Task Management Hub
          </h1>
          <span class="text-[10px] font-bold text-gray-500 tracking-[0.3em] uppercase">
            Abracodebra System v1.0
          </span>
        </div>

        {/* RIGHT: Actions & Profile */}
        <div class="flex items-center gap-6">
          {/* Action Icons (Optional) */}
          <div class="hidden md:flex items-center gap-4 border-r border-white/10 pr-6">
            <button class="text-gray-500 hover:text-white transition-colors">
              <Search size={18} />
            </button>
            <button class="text-gray-500 hover:text-white transition-colors relative">
              <Bell size={18} />
              <span class="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full border-2 border-[#0a0a0a]"></span>
            </button>
          </div>

          <div class="flex items-center gap-4 group cursor-pointer">
            <div class="flex flex-col items-end hidden sm:flex">
              <span class="text-sm font-black text-white tracking-tight group-hover:text-blue-400 transition-colors">
                Hi, Admin
              </span>
              <span class="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                Superuser
              </span>
            </div>

            {/* Avatar Circle with Glow */}
            <div class="relative">
              <div class="absolute inset-0 bg-blue-600/20 blur-lg rounded-full group-hover:bg-blue-600/40 transition-all"></div>
              <div class="relative w-10 h-10 bg-gradient-to-br from-gray-800 to-black rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden group-hover:border-blue-500/50 transition-all">
                <img
                  src={logoGramAbra}
                  class="w-8 h-8 object-contain scale-150 transition-transform group-hover:scale-[1.7]"
                  alt="Avatar"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

import { createSignal, onMount, Show } from "solid-js";
import { useNavigate, A } from "@solidjs/router";
import Swal from "sweetalert2";
import { AuthService } from "../../services/auth";
import { User, Lock, Mail, UserPlus, Users } from "lucide-solid";
import logoAbra from "../../assets/img/logo-abracodebra.png";

export default function Register() {
  const navigate = useNavigate();

  // State sesuai struktur JSON baru
  const [name, setName] = createSignal("");
  const [username, setUsername] = createSignal("");
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [teamId, setTeamId] = createSignal(1); // Default ke 1 sesuai contoh

  const [loading, setLoading] = createSignal(false);
  const [isMounted, setIsMounted] = createSignal(false);

  onMount(() => {
    setTimeout(() => setIsMounted(true), 100);
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Membentuk body sesuai permintaanmu
    const payload = {
      name: name(),
      username: username(),
      email: email(),
      password: password(),
      team_id: Number(teamId()),
    };

    try {
      await AuthService.register(payload);

      await Swal.fire({
        icon: "success",
        title: "Registrasi Berhasil!",
        text: "Akun sudah terdaftar, silakan login.",
        timer: 2000,
        showConfirmButton: false,
        timerProgressBar: true,
      });

      navigate("/login");
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Gagal Mendaftar",
        text: err.response?.data?.message || "Terjadi kesalahan pada server.",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="relative w-screen min-h-screen flex items-center justify-center bg-[#0a0a0a] overflow-hidden p-4">
      {/* Background Animasi */}
      <style>{`
        .animated-gradient-bg::before {
          content: '';
          position: absolute;
          inset: -100px;
          opacity: 0.15;
          z-index: 1;
          background: radial-gradient(circle at 10% 20%, #4f46e5, transparent 40%),
                      radial-gradient(circle at 80% 90%, #10b981, transparent 40%),
                      radial-gradient(circle at 50% 50%, #4a5568, transparent 50%);
          background-size: 200% 200%;
          animation: gradient-move 20s linear infinite;
        }
        @keyframes gradient-move {
          0% { background-position: 0% 0%; }
          50% { background-position: 100% 100%; }
          100% { background-position: 0% 0%; }
        }
      `}</style>
      <div class="animated-gradient-bg"></div>

      <div
        class={`z-10 w-full max-w-md transition-all duration-700 ease-out transform ${isMounted() ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <div class="bg-gray-900/50 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-2xl space-y-6">
          <div class="text-center">
            <div class="w-full flex justify-center items-center h-16 mb-2 overflow-hidden">
              <img
                src={logoAbra}
                class="h-32 object-contain scale-200"
                alt="Logo"
              />
            </div>
            <h2 class="text-2xl font-bold text-white tracking-tight">
              Join the Team
            </h2>
            <p class="text-sm text-gray-400 mt-1">
              Daftarkan akun barumu di sini
            </p>
          </div>

          <form onSubmit={handleRegister} class="space-y-4">
            <div class="space-y-3">
              {/* Input Full Name */}
              <div class="relative">
                <User
                  size={18}
                  class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  onInput={(e) => setName(e.target.value)}
                  class="w-full bg-white/5 border border-white/10 text-gray-200 placeholder-gray-500 rounded-lg py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Input Username */}
              <div class="relative">
                <Users
                  size={18}
                  class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  type="text"
                  placeholder="Username"
                  required
                  onInput={(e) => setUsername(e.target.value)}
                  class="w-full bg-white/5 border border-white/10 text-gray-200 placeholder-gray-500 rounded-lg py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Input Email */}
              <div class="relative">
                <Mail
                  size={18}
                  class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  required
                  onInput={(e) => setEmail(e.target.value)}
                  class="w-full bg-white/5 border border-white/10 text-gray-200 placeholder-gray-500 rounded-lg py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Input Password */}
              <div class="relative">
                <Lock
                  size={18}
                  class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  type="password"
                  placeholder="Password"
                  required
                  onInput={(e) => setPassword(e.target.value)}
                  class="w-full bg-white/5 border border-white/10 text-gray-200 placeholder-gray-500 rounded-lg py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Input Team ID (Hidden or Disabled if static) */}
              <input type="hidden" value={teamId()} />
            </div>

            <button
              type="submit"
              disabled={loading()}
              class="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white font-semibold py-3 rounded-lg hover:bg-emerald-700 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 disabled:opacity-50"
            >
              <Show
                when={!loading()}
                fallback={
                  <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                }
              >
                <UserPlus size={18} />
                <span>Create Account</span>
              </Show>
            </button>

            <div class="text-center pt-2">
              <p class="text-sm text-gray-400">
                Sudah punya akun?{" "}
                <A
                  href="/login"
                  class="text-emerald-400 font-semibold hover:underline"
                >
                  Sign In
                </A>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

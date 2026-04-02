import { createSignal, onMount, Show } from "solid-js";
import { useNavigate, A } from "@solidjs/router";
import Swal from "sweetalert2";
import { useAuth } from "../../context/AuthContext";
import { AuthService } from "../../services/auth";
import { User, Lock, LogIn } from "lucide-solid";
import logoAbra from "../../assets/img/logo-abracodebra.png";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [isMounted, setIsMounted] = createSignal(false);

  onMount(() => {
    setTimeout(() => setIsMounted(true), 100);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username() || !password()) {
      Swal.fire({
        icon: "warning",
        title: "Form Belum Lengkap",
        text: "Username dan password wajib diisi!",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    setLoading(true);

    try {
      // MANGGIL API ASLI
      const response = await AuthService.login({
        username: username(),
        password: password(),
      });

      // Sesuaikan dengan struktur response backendmu
      const token = response.data?.token || response?.token;
      const userData = response.data?.user || response?.user;
      const permissions = response.data?.permissions || [];

      if (!token) throw new Error("Token tidak valid dari server.");

      // Set ke global context
      login(userData, token, permissions);

      await Swal.fire({
        icon: "success",
        title: "Login Berhasil!",
        text: `Selamat datang kembali, ${userData?.username || "User"}!`,
        timer: 1500,
        showConfirmButton: false,
        timerProgressBar: true,
      });

      navigate("/main");
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Login Gagal!",
        text:
          err.response?.data?.message ||
          err.message ||
          "Username atau password salah.",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="relative w-screen min-h-screen flex items-center justify-center bg-[#0a0a0a] overflow-hidden p-4">
      {/* Background Animasi tetap dipertahankan */}
      <style>{`
        .animated-gradient-bg::before {
          content: '';
          position: absolute;
          inset: -100px;
          opacity: 0.15;
          z-index: 1;
          background: radial-gradient(circle at 10% 20%, #4f46e5, transparent 40%),
                      radial-gradient(circle at 80% 90%, #2563eb, transparent 40%),
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
        <div class="bg-gray-900/50 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-2xl space-y-8">
          <div class="text-center">
            <div class="w-full flex justify-center items-center h-16 mb-4 overflow-hidden">
              <img
                src={logoAbra}
                class="h-32 object-contain scale-200"
                alt="Logo"
              />
            </div>
            <h2 class="text-2xl font-bold text-white tracking-tight">
              Welcome Back
            </h2>
          </div>

          <form onSubmit={handleSubmit} class="space-y-6">
            <div class="space-y-4">
              <div class="relative">
                <User
                  size={18}
                  class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  type="text"
                  placeholder="Username"
                  value={username()}
                  onInput={(e) => setUsername(e.target.value)}
                  class="w-full bg-white/5 border border-white/10 text-gray-200 placeholder-gray-500 rounded-lg py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                />
              </div>

              <div class="relative">
                <Lock
                  size={18}
                  class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password()}
                  onInput={(e) => setPassword(e.target.value)}
                  class="w-full bg-white/5 border border-white/10 text-gray-200 placeholder-gray-500 rounded-lg py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading()}
              class="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-wait"
            >
              <Show
                when={!loading()}
                fallback={
                  <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                }
              >
                <LogIn size={18} />
                <span>Sign In</span>
              </Show>
            </button>

            <p class="text-center text-sm text-gray-400">
              Belum punya akun?{" "}
              <A
                href="/register"
                class="text-blue-400 font-semibold hover:underline"
              >
                Daftar Sekarang
              </A>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

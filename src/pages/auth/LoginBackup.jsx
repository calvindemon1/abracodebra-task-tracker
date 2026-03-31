import { createSignal, onMount, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import Swal from "sweetalert2";
import { login } from "../../utils/auth";
import { UsersService } from "../../services/users";
import { User, Lock, LogIn, UserPlus } from "lucide-solid";
import logoAbra from "../../assets/img/logo-abracodebra.png";

export default function Login() {
  const navigate = useNavigate();

  const [isLoginMode, setIsLoginMode] = createSignal(true);
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [confirmPassword, setConfirmPassword] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [isMounted, setIsMounted] = createSignal(false);

  onMount(() => {
    setTimeout(() => setIsMounted(true), 100);
  });

  const toggleMode = (mode) => {
    setIsLoginMode(mode);
    setUsername("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi basic
    if (!username() || !password()) {
      Swal.fire({
        icon: "warning",
        title: "Form Belum Lengkap",
        text: "Username dan password wajib diisi!",
        confirmButtonColor: "#000",
      });
      return;
    } // <-- TYPO 'a' SUDAH DIHAPUS DISINI

    // Validasi Confirm Password khusus buat Sign Up
    if (!isLoginMode() && password() !== confirmPassword()) {
      Swal.fire({
        icon: "warning",
        title: "Password Tidak Cocok",
        text: "Konfirmasi password harus sama dengan password yang lu ketik!",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    setLoading(true);
    try {
      if (isLoginMode()) {
        const response = await UsersService.login({
          username: username(),
          password: password(),
        });

        // Pastikan path 'response.data.token' ini sesuai dengan balasan backend lu
        const token = response.data?.token || response?.token;
        if (!token) throw new Error("Token tidak ditemukan pada response API");

        login(token);

        await Swal.fire({
          icon: "success",
          title: "Login Berhasil!",
          text: "Anda akan diarahkan ke dashboard...",
          timer: 1500,
          showConfirmButton: false,
          timerProgressBar: true,
        });

        navigate("/admin/asset");
      } else {
        const data = {
          username: username(),
          password: password(),
          role_id: 0,
        };

        await UsersService.register(data);

        await Swal.fire({
          icon: "success",
          title: "Sign Up Berhasil!",
          text: "Akun berhasil dibuat. Silakan login.",
          confirmButtonColor: "#2563eb",
        });

        toggleMode(true);
      }
    } catch (err) {
      console.error(isLoginMode() ? "Login Gagal:" : "Sign Up Gagal:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        (isLoginMode()
          ? "Username atau password salah. Silakan coba lagi."
          : "Gagal membuat akun. Username mungkin sudah terpakai.");

      Swal.fire({
        icon: "error",
        title: isLoginMode() ? "Login Gagal!" : "Sign Up Gagal!",
        text: errorMessage,
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="relative w-screen min-h-screen flex items-center justify-center bg-[#0a0a0a] overflow-hidden p-4">
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
        class={`z-10 w-full max-w-md transition-all duration-700 ease-out transform ${
          isMounted() ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div class="bg-gray-900/50 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-2xl space-y-6">
          <div class="text-center">
            <div class="w-full flex justify-center items-center h-16 mb-4 overflow-hidden">
              <img
                src={logoAbra}
                class="h-32 object-contain scale-200"
                alt="Logo Abra"
              />
            </div>
            <h2 class="text-2xl font-bold text-white tracking-tight transition-all duration-300">
              {isLoginMode() ? "Welcome Back" : "Create Account"}
            </h2>
            <p class="text-sm text-gray-400 mt-1 transition-all duration-300">
              {isLoginMode()
                ? "Please sign in to continue"
                : "Register a new account to get started"}
            </p>
          </div>

          <div class="relative flex bg-white/5 rounded-lg p-1 border border-white/5">
            <div
              class="absolute left-1 top-1 bottom-1 w-[calc(50%-4px)] bg-blue-600 rounded-md transition-transform duration-300 ease-out shadow-lg"
              style={{
                transform: isLoginMode() ? "translateX(0)" : "translateX(100%)",
              }}
            ></div>

            <button
              type="button"
              onClick={() => toggleMode(true)}
              class={`relative z-10 w-1/2 py-2 text-sm font-medium transition-colors duration-300 ${
                isLoginMode() ? "text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={() => toggleMode(false)}
              class={`relative z-10 w-1/2 py-2 text-sm font-medium transition-colors duration-300 ${
                !isLoginMode() ? "text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Sign Up
            </button>
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

              {/* URUTAN DIPERBAIKI: Password dulu, baru Confirm Password */}
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

              <div
                class={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isLoginMode() ? "max-h-0 opacity-0" : "max-h-20 opacity-100"
                }`}
              >
                <div class="relative mt-4">
                  <Lock
                    size={18}
                    class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword()}
                    onInput={(e) => setConfirmPassword(e.target.value)}
                    class="w-full bg-white/5 border border-white/10 text-gray-200 placeholder-gray-500 rounded-lg py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading()}
              class="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-wait disabled:hover:translate-y-0"
            >
              <Show
                when={!loading()}
                fallback={
                  <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                }
              >
                {isLoginMode() ? <LogIn size={18} /> : <UserPlus size={18} />}
                <span>{isLoginMode() ? "Sign In" : "Sign Up"}</span>
              </Show>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

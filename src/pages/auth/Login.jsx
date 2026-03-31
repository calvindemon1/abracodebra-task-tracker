// import { createSignal, onMount, Show } from "solid-js";
// import { useNavigate } from "@solidjs/router";
// import Swal from "sweetalert2";

// // 1. HAPUS IMPORT INI: import { login } from "../../utils/auth";
// // 2. GANTI JADI IMPORT INI:
// import { useAuth } from "../../context/AuthContext";

// import { UsersService } from "../../services/users";
// import { User, Lock, LogIn } from "lucide-solid";
// import logoAbra from "../../assets/img/logo-abracodebra.png";

// export default function Login() {
//   const navigate = useNavigate();

//   // 3. PANGGIL FUNGSI LOGIN DARI CONTEXT
//   const { login } = useAuth();

//   const [username, setUsername] = createSignal("");
//   const [password, setPassword] = createSignal("");
//   const [loading, setLoading] = createSignal(false);
//   const [isMounted, setIsMounted] = createSignal(false);

//   onMount(() => {
//     setTimeout(() => setIsMounted(true), 100);
//   });

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!username() || !password()) {
//       Swal.fire({
//         icon: "warning",
//         title: "Form Belum Lengkap",
//         text: "Username dan password wajib diisi!",
//         confirmButtonColor: "#000",
//       });
//       return;
//     }

//     setLoading(true);
//     try {
//       const response = await UsersService.login({
//         username: username(),
//         password: password(),
//       });

//       const token = response.data?.token || response?.token;
//       if (!token) throw new Error("Token tidak ditemukan pada response API");

//       // 4. AMBIL JUGA DATA USER SAMA PERMISSIONS DARI RESPONSE BACKEND
//       // Sesuaikan 'response.data.user' & 'response.data.permissions' dengan format JSON API lu
//       const userData = response.data?.user || { username: username() };
//       const userPermissions = response.data?.permissions || [];

//       // 5. PANGGIL LOGIN DARI CONTEXT (Kirim User, Token, Permissions)
//       login(userData, token, userPermissions);

//       await Swal.fire({
//         icon: "success",
//         title: "Login Berhasil!",
//         text: "Anda akan diarahkan ke dashboard...",
//         timer: 1500,
//         showConfirmButton: false,
//         timerProgressBar: true,
//       });

//       navigate("/admin/asset");
//     } catch (err) {
//       console.error("Login Gagal:", err);
//       const errorMessage =
//         err.response?.data?.message ||
//         err.message ||
//         "Username atau password salah. Silakan coba lagi.";

//       Swal.fire({
//         icon: "error",
//         title: "Login Gagal!",
//         text: errorMessage,
//         confirmButtonColor: "#ef4444",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div class="relative w-screen min-h-screen flex items-center justify-center bg-[#0a0a0a] overflow-hidden p-4">
//       {/* Background Animasi */}
//       <style>{`
//         .animated-gradient-bg::before {
//           content: '';
//           position: absolute;
//           inset: -100px;
//           opacity: 0.15;
//           z-index: 1;
//           background: radial-gradient(circle at 10% 20%, #4f46e5, transparent 40%),
//                       radial-gradient(circle at 80% 90%, #2563eb, transparent 40%),
//                       radial-gradient(circle at 50% 50%, #4a5568, transparent 50%);
//           background-size: 200% 200%;
//           animation: gradient-move 20s linear infinite;
//         }

//         @keyframes gradient-move {
//           0% { background-position: 0% 0%; }
//           50% { background-position: 100% 100%; }
//           100% { background-position: 0% 0%; }
//         }
//       `}</style>

//       <div class="animated-gradient-bg"></div>

//       <div
//         class={`z-10 w-full max-w-md transition-all duration-700 ease-out transform ${
//           isMounted() ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
//         }`}
//       >
//         <div class="bg-gray-900/50 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-2xl space-y-8">
//           {/* Header */}
//           <div class="text-center">
//             <div class="w-full flex justify-center items-center h-16 mb-4 overflow-hidden">
//               <img
//                 src={logoAbra}
//                 class="h-32 object-contain scale-200"
//                 alt="Logo Abra"
//               />
//             </div>
//             <h2 class="text-2xl font-bold text-white tracking-tight">
//               Welcome Back
//             </h2>
//             <p class="text-sm text-gray-400 mt-1">Please sign in to continue</p>
//           </div>

//           {/* Form */}
//           <form onSubmit={handleSubmit} class="space-y-6">
//             <div class="space-y-4">
//               {/* Username Input */}
//               <div class="relative">
//                 <User
//                   size={18}
//                   class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
//                 />
//                 <input
//                   type="text"
//                   placeholder="Username"
//                   value={username()}
//                   onInput={(e) => setUsername(e.target.value)}
//                   class="w-full bg-white/5 border border-white/10 text-gray-200 placeholder-gray-500 rounded-lg py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
//                 />
//               </div>

//               {/* Password Input */}
//               <div class="relative">
//                 <Lock
//                   size={18}
//                   class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
//                 />
//                 <input
//                   type="password"
//                   placeholder="Password"
//                   value={password()}
//                   onInput={(e) => setPassword(e.target.value)}
//                   class="w-full bg-white/5 border border-white/10 text-gray-200 placeholder-gray-500 rounded-lg py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
//                 />
//               </div>
//             </div>

//             {/* Tombol Submit */}
//             <button
//               type="submit"
//               disabled={loading()}
//               class="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-wait disabled:hover:translate-y-0"
//             >
//               <Show
//                 when={!loading()}
//                 fallback={
//                   <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
//                 }
//               >
//                 <LogIn size={18} />
//                 <span>Sign In</span>
//               </Show>
//             </button>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }

import { createSignal, onMount, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import Swal from "sweetalert2";
import { useAuth } from "../../context/AuthContext";
import { UsersService } from "../../services/users"; // Tetap import buat jaga-jaga nanti
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
        confirmButtonColor: "#000",
      });
      return;
    }

    setLoading(true);

    // ==========================================
    // LOGIK BYPASS (MOCK DATA)
    // ==========================================
    try {
      // Simulasi delay tipis-tipis
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Cek kredensial statis: admin / admin
      if (username() === "admin" && password() === "admin") {
        const mockUser = {
          id: 1,
          username: "admin",
          name: "Super Admin (Bypass)",
        };
        const mockToken = "fake-jwt-token-bypass-123";
        const mockPermissions = [
          "admin",
          "asset_read",
          "asset_write",
          "asset_delete",
        ];

        // Set ke context
        login(mockUser, mockToken, mockPermissions);

        await Swal.fire({
          icon: "success",
          title: "Login Berhasil!",
          text: "Welcome back, Admin!",
          timer: 1500,
          showConfirmButton: false,
          timerProgressBar: true,
        });

        navigate("/main");
      } else {
        // Jika input bukan admin/admin
        throw new Error("Username atau password salah!");
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Login Gagal!",
        text: err.message || "Terjadi kesalahan.",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }

    /* // ==========================================
    // LOGIKA ASLI API (DI-RESERVE)
    // ==========================================
    // setLoading(true);
    // try {
    //   const response = await UsersService.login({
    //     username: username(),
    //     password: password(),
    //   });
    //   const token = response.data?.token || response?.token;
    //   if (!token) throw new Error("Token tidak ditemukan");
    //   const userData = response.data?.user || { username: username() };
    //   const userPermissions = response.data?.permissions || [];
    //   login(userData, token, userPermissions);
    //   navigate("/admin/asset");
    // } catch (err) {
    //   // handle error...
    // } finally {
    //   setLoading(false);
    // }
    */
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
        <div class="bg-gray-900/50 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-2xl space-y-8">
          {/* Header */}
          <div class="text-center">
            <div class="w-full flex justify-center items-center h-16 mb-4 overflow-hidden">
              <img
                src={logoAbra}
                class="h-32 object-contain scale-200"
                alt="Logo Abra"
              />
            </div>
            <h2 class="text-2xl font-bold text-white tracking-tight">
              Welcome Back
            </h2>
            <p class="text-sm text-gray-400 mt-1">
              Gunakan <b>admin</b> / <b>admin</b> untuk bypass
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} class="space-y-6">
            <div class="space-y-4">
              {/* Username Input */}
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

              {/* Password Input */}
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

            {/* Tombol Submit */}
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
                <LogIn size={18} />
                <span>Sign In</span>
              </Show>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

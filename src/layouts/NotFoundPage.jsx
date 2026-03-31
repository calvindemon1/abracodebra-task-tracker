import { useNavigate } from "@solidjs/router";
import styles from "../App.module.css";
import rogLogo from "../assets/img/rogLogo.svg"; // ✅ optional, tampilkan logo ROG biar keren

export default function NotFoundPage() {
  const navigate = useNavigate();

  const handleBackHome = () => {
    navigate("/", { replace: true });
  };

  return (
    <div
      class="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden p-5 bg-black bg-opacity-80"
      style={{
        "font-family": "NormProRegular",
        "background-image":
          "radial-gradient(circle at center, #1a1a1a 0%, #000000 100%)",
      }}
    >
      {/* Efek blur glow background */}
      <div class="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(255,0,100,0.1)_0%,transparent_70%)]"></div>

      {/* Konten utama */}
      <div class={`flex flex-col items-center text-center ${styles.fadeIn}`}>
        <img
          src={rogLogo}
          alt="ROG Logo"
          class="w-28 mb-8 opacity-90 animate-pulse"
        />

        <h1 class="text-[100px] font-extrabold text-white drop-shadow-lg leading-none">
          404
        </h1>

        <p class="text-xl text-gray-300 font-semibold max-w-[600px] mt-4">
          Kamu salah alamat, klik tombol di bawah untuk kembali ke menu utama.
        </p>

        <button
          onClick={handleBackHome}
          class="mt-8 bg-linear-to-r from-[#FF0066] to-[#FFB848] text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-300 active:scale-95 uppercase tracking-wide"
        >
          Kembali ke Menu Utama
        </button>
      </div>
    </div>
  );
}

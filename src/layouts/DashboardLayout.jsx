import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";

export default function DashboardLayout(props) {
  // HAPUS: Logic isLoggedIn di sini biar nggak double check sama Router

  return (
    <div class="flex h-screen bg-[#0f1115] overflow-hidden w-full text-white">
      <Sidebar />
      <div class="flex-1 flex flex-col overflow-hidden relative">
        <Navbar />
        {/* Tambahin bg-dark biar sinkron sama tema login lu */}
        <main class="p-6 flex-1 bg-[#0f1115] overflow-y-auto custom-scrollbar">
          {props.children}
        </main>
      </div>
    </div>
  );
}

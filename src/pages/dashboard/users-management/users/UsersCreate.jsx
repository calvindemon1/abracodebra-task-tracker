import {
  createSignal,
  For,
  onMount,
  Show,
  createResource,
  createEffect,
} from "solid-js";
import { useNavigate, useParams } from "@solidjs/router";
import { Loader2, User, KeyRound } from "lucide-solid";
import Swal from "sweetalert2";

import { UsersService } from "../../../../services/users";
import { DivisionsService } from "../../../../services/divisions";
import { PositionsService } from "../../../../services/positions";

const baseInputClass =
  "w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm text-gray-800 " +
  "focus:outline-none focus:ring-4 focus:ring-gray-100 focus:border-gray-400 hover:border-gray-300 transition-all duration-200";

const ROLE_OPTIONS = [
  { id: 1, label: "Super Admin" },
  { id: 2, label: "Admin" },
  { id: 3, label: "User" },
];

export default function UsersCreate() {
  const navigate = useNavigate();
  const params = useParams();
  const isEdit = () => !!params.id;

  const [isMounted, setIsMounted] = createSignal(false);
  const [isLoading, setIsLoading] = createSignal(false);
  const [isSaving, setIsSaving] = createSignal(false);

  // ===== FETCH DROPDOWN API =====
  const [divisions] = createResource(() => DivisionsService.list());
  const [positions] = createResource(() => PositionsService.list());

  // ===== FORM =====
  const [form, setForm] = createSignal({
    username: "",
    role_id: 3,
    password: "",
    full_name: "",
    division_id: "",
    position_id: "",
  });

  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // ===== FETCH DETAIL =====
  const fetchDetail = async () => {
    setIsLoading(true);
    try {
      const res = await UsersService.list();
      const list = res.data?.data || [];

      const userDetail = await UsersService.getById(params.id);
      const user = userDetail.data;

      if (!user) {
        Swal.fire("Error", "User tidak ditemukan", "error");
        return navigate("/admin/users");
      }

      setForm({
        username: user.username || "",
        role_id: user.role_id || 3,
        password: "",
        full_name: user.full_name || "",
        division_id: user.division_id || "",
        position_id: user.position_id || "",
      });
    } catch (err) {
      Swal.fire("Error", "Gagal load user", "error");
    } finally {
      setIsLoading(false);
    }
  };

  onMount(() => {
    setTimeout(() => setIsMounted(true), 50);
    if (isEdit()) fetchDetail();
  });

  // ===== SUBMIT =====
  const handleSubmit = async () => {
    if (!form().username)
      return Swal.fire("Warning", "Username wajib", "warning");

    if (!form().full_name)
      return Swal.fire("Warning", "Full name wajib", "warning");

    if (!form().division_id)
      return Swal.fire("Warning", "Division wajib", "warning");

    if (!form().position_id)
      return Swal.fire("Warning", "Position wajib", "warning");

    if (!isEdit() && !form().password)
      return Swal.fire("Warning", "Password wajib", "warning");

    setIsSaving(true);

    try {
      if (isEdit()) {
        await UsersService.update(params.id, {
          username: form().username,
          role_id: +form().role_id,
          full_name: form().full_name,
          division_id: +form().division_id,
          position_id: +form().position_id,
        });

        if (form().password) {
          await UsersService.updatePassword(params.id, {
            password: form().password,
          });
        }
      } else {
        await UsersService.register({
          username: form().username,
          role_id: +form().role_id,
          password: form().password,
          full_name: form().full_name,
          division_id: +form().division_id,
          position_id: +form().position_id,
        });
      }

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        timer: 1500,
        showConfirmButton: false,
      });

      navigate("/admin/users");
    } catch (err) {
      // Tambahkan log ini buat liat detail error dari API
      console.error("Detail Error Simpan:", err.response?.data || err);

      const errorMessage = err.response?.data?.message || "Gagal simpan";
      Swal.fire("Error", errorMessage, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // ===== HELPER =====
  const divisionOptions = () =>
    (divisions()?.data || []).map((d) => ({
      id: d.id,
      label: d.division_name,
    }));

  const positionOptions = () =>
    (positions()?.data || []).map((p) => ({
      id: p.id,
      label: p.position_name,
    }));

  return (
    <div class="p-6 bg-gray-50/50 min-h-screen">
      <div
        class={`max-w-4xl mx-auto transition-all duration-700 ${
          isMounted() ? "opacity-100" : "opacity-0 translate-y-8"
        }`}
      >
        {/* HEADER */}
        <h1 class="text-3xl font-bold mb-8">
          {isEdit() ? "Edit User" : "Create User"}
        </h1>

        {/* CARD */}
        <div class="bg-white p-8 rounded-2xl shadow border space-y-8 relative">
          <Show when={isLoading()}>
            <div class="absolute inset-0 flex items-center justify-center bg-white/70">
              <Loader2 class="animate-spin" />
            </div>
          </Show>

          {/* PROFILE */}
          <section class="space-y-6">
            <h2 class="text-xs font-bold text-gray-500 uppercase">Profile</h2>

            <div class="grid grid-cols-2 gap-6">
              <Input
                label="Username"
                value={form().username}
                onInput={(v) => handleChange("username", v)}
              />

              <Input
                label="Full Name"
                value={form().full_name}
                onInput={(v) => handleChange("full_name", v)}
              />

              <Select
                label="Role"
                options={ROLE_OPTIONS}
                value={form().role_id}
                onChange={(v) => handleChange("role_id", v)}
              />
            </div>
          </section>

          {/* ORGANIZATION */}
          <section class="space-y-6">
            <h2 class="text-xs font-bold text-gray-500 uppercase">
              Organization
            </h2>

            <div class="grid grid-cols-2 gap-6">
              <Select
                label="Division"
                options={divisionOptions()}
                value={form().division_id}
                onChange={(v) => handleChange("division_id", v)}
              />

              <Select
                label="Position"
                options={positionOptions()}
                value={form().position_id}
                onChange={(v) => handleChange("position_id", v)}
              />
            </div>
          </section>

          {/* PASSWORD */}
          <section>
            <Input
              label={`Password ${isEdit() ? "(Opsional)" : ""}`}
              type="password"
              value={form().password}
              onInput={(v) => handleChange("password", v)}
            />
          </section>

          {/* ACTION */}
          <div class="flex justify-end gap-4">
            <button onClick={() => navigate("/admin/users")}>Batal</button>

            <button
              onClick={handleSubmit}
              disabled={isSaving()}
              class="bg-black text-white px-6 py-2 rounded-xl"
            >
              {isSaving() ? "Saving..." : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== COMPONENTS =====
function Input(props) {
  return (
    <div>
      <label class="text-sm">{props.label}</label>
      <input
        type={props.type || "text"}
        value={props.value}
        onInput={(e) => props.onInput(e.target.value)}
        class={baseInputClass}
      />
    </div>
  );
}

function Select(props) {
  return (
    <div>
      <label class="text-sm">{props.label}</label>
      <select
        class={baseInputClass}
        value={+props.value}
        onChange={(e) => props.onChange(e.target.value)}
      >
        <option value="">Pilih...</option>

        <For each={props.options}>
          {(opt) => <option value={opt.id}>{opt.label}</option>}
        </For>
      </select>
    </div>
  );
}

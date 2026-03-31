import { createSignal } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { login } from "../../utils/auth";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");

  const handleRegister = (e) => {
    e.preventDefault();

    // fake register
    // normally call API & store user token
    login("dummy-token");
    navigate("/admin");
  };

  return (
    <form class="flex flex-col gap-3 w-72" onSubmit={handleRegister}>
      <h2 class="text-xl font-bold text-center">Register</h2>

      <input
        class="border p-2 rounded"
        type="email"
        placeholder="Email"
        required
        onInput={(e) => setEmail(e.target.value)}
      />

      <input
        class="border p-2 rounded"
        type="password"
        placeholder="Password"
        required
        onInput={(e) => setPassword(e.target.value)}
      />

      <button class="bg-green-500 text-white p-2 rounded hover:bg-green-600">
        Create Account
      </button>

      <p class="text-sm text-center">
        Already have an account?
        <a href="/login" class="text-blue-600 font-semibold">
          {" "}
          Login
        </a>
      </p>
    </form>
  );
}

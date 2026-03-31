import AppRouter from "./router";
import { AuthProvider } from "./context/AuthContext"; // Sesuaikan pathnya ya bro

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

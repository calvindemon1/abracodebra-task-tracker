import { Router, Route, Navigate } from "@solidjs/router";
import { isLoggedIn } from "../utils/auth";

// Layouts & Pages
import AuthLayout from "../layouts/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import Login from "../pages/auth/Login";

// Master Data Pages
import Teams from "../pages/dashboard/master-data/Teams";
import Users from "../pages/dashboard/master-data/Users";

// Dashboard Pages
import DashboardHome from "../pages/DashboardHome";
import TaskList from "../pages/dashboard/task/TaskList";
import TaskForm from "../pages/dashboard/task/TaskForm";

function ProtectedAdminLayout(props) {
  // Debug: Cek di console apakah ini true/false saat login
  console.log("Is Authenticated:", isLoggedIn());

  return isLoggedIn() ? (
    <DashboardLayout>{props.children}</DashboardLayout>
  ) : (
    <Navigate href="/login" />
  );
}

export default function AppRouter() {
  return (
    <Router>
      {/* Auth Routes */}
      <Route path="/" component={AuthLayout}>
        <Route path="" component={Login} />
        <Route path="login" component={Login} />
      </Route>

      {/* Main Routes */}
      <Route path="/main" component={ProtectedAdminLayout}>
        <Route path="" component={DashboardHome} />

        {/* Master Data Pages */}
        <Route path="/teams" component={Teams} />
        <Route path="/users" component={Users} />

        {/* Dashboard Pages */}
        <Route path="/task-list" component={TaskList} />
        <Route path="/task/create" component={TaskForm} />
        <Route path="/task/edit/:id" component={TaskForm} />
      </Route>

      <Route path="*404" element={<Navigate href="/" />} />
    </Router>
  );
}

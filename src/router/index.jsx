import { Router, Route, Navigate } from "@solidjs/router";
import { isLoggedIn } from "../utils/auth";

// Layouts & Pages
import AuthLayout from "../layouts/AuthLayout";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import DashboardLayout from "../layouts/DashboardLayout";

// Master Data Pages
import Users from "../pages/dashboard/master-data/Users";
import Projects from "../pages/dashboard/master-data/Projects";
import Teams from "../pages/dashboard/master-data/Teams";

// Dashboard Pages
import DashboardHome from "../pages/DashboardHome";
import TaskList from "../pages/dashboard/task/TaskList";
import TaskForm from "../pages/dashboard/task/TaskForm";

function ProtectedAdminLayout(props) {
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
        <Route path="register" component={Register} />
      </Route>

      {/* Main Routes */}
      <Route path="/main" component={ProtectedAdminLayout}>
        <Route path="" component={DashboardHome} />

        {/* Master Data Pages */}
        <Route path="/users" component={Users} />
        <Route path="/projects" component={Projects} />
        <Route path="/teams" component={Teams} />

        {/* Dashboard Pages */}
        <Route path="/task-list" component={TaskList} />
        <Route path="/task/create" component={TaskForm} />
        <Route path="/task/edit/:id" component={TaskForm} />
      </Route>

      <Route path="*404" element={<Navigate href="/" />} />
    </Router>
  );
}

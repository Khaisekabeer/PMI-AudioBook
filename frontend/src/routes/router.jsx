import { createBrowserRouter, Navigate } from "react-router-dom";
import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
import Signup from "../pages/Signup/Signup";
import Dashboard from "../pages/Dashboard/Dashboard";
import AdminDashboard from "../pages/Admin";
import SingleAudioBook from "../pages/SingleAudioBook/SingleAudioBook";
import { RouteErrorFallback } from "../components/ErrorBoundary";

const router = createBrowserRouter([
  {
    path: "/",
    errorElement: <RouteErrorFallback />,
    element: <Home />,
  },
  {
    path: "/login",
    errorElement: <RouteErrorFallback />,
    element: <Login />,
  },
  {
    path: "/signup",
    errorElement: <RouteErrorFallback />,
    element: <Signup />,
  },
  {
    path: "/dashboard",
    errorElement: <RouteErrorFallback />,
    element: <Dashboard />,
  },
  {
    path: "/admindashboard",
    errorElement: <RouteErrorFallback />,
    element: <AdminDashboard />,
  },
  {
    path: "/book/:id",
    errorElement: <RouteErrorFallback />,
    element: <SingleAudioBook />,
  },
  // Redirect any unknown paths to home
  {
    path: "*",
    element: <Navigate to="/" replace />
  }
]);

export default router;

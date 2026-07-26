import { createBrowserRouter, Navigate } from "react-router-dom";
import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
import Signup from "../pages/Signup/Signup";
import Dashboard from "../pages/Dashboard/Dashboard";
import AdminDashboard from "../pages/Admin";
import SingleAudioBook from "../pages/SingleAudioBook/SingleAudioBook";
import RouteErrorBoundary from "../components/RouteErrorBoundary";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/login",
    element: <Login />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/signup",
    element: <Signup />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/admindashboard",
    element: <AdminDashboard />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/book/:id",
    element: <SingleAudioBook />,
    errorElement: <RouteErrorBoundary />,
  },
  // Redirect any unknown paths to home
  {
    path: "*",
    element: <Navigate to="/" replace />,
    errorElement: <RouteErrorBoundary />,
  }
]);

export default router;

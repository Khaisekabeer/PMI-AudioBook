import axios from "axios";

const API_BASE_URL = "/api";

const API = axios.create({
  // Use the API base; callers should include "/auth/..." or other namespaces explicitly
  baseURL: API_BASE_URL,
});


// Attach the JWT token to every request if available
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Handle unauthorized responses globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // If we're not already on the login page, redirect
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login?expired=true";
      }
    }
    return Promise.reject(error);
  }
);

const BASE_URL = "";

// API providers do not all use the same error shape. Keep values destined for
// JSX as text: React cannot render an error object (for example `{ code, message }`).
export const getErrorMessage = (error, fallback = "Something went wrong. Please try again.") => {
  const payload = error?.response?.data ?? error;
  const value = payload?.error ?? payload?.error_description ?? payload?.message ?? error?.message;

  if (typeof value === "string" && value.trim()) return value;
  if (value && typeof value.message === "string" && value.message.trim()) {
    return value.message;
  }

  return fallback;
};

export { BASE_URL };
export default API;

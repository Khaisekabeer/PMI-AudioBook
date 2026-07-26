import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";

const RouteErrorBoundary = () => {
  const error = useRouteError();
  const payload = isRouteErrorResponse(error) ? error.data : error;
  const detail = typeof payload === "string"
    ? payload
    : payload?.message || payload?.error?.message || "Please try again or return to the home page.";

  return (
    <main className="min-h-screen grid place-items-center bg-slate-50 p-6 text-center">
      <section className="max-w-md rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Something went wrong</h1>
        <p className="mt-3 text-slate-600">{detail}</p>
        <Link className="mt-6 inline-block text-blue-600 hover:underline" to="/">
          Return home
        </Link>
      </section>
    </main>
  );
};

export default RouteErrorBoundary;

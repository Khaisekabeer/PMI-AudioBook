// middleware/errorMiddleware.js — global error handler.
export const errorHandler = (err, req, res, _next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message || err);

  res.status(statusCode).json({
    error: err.name || "ServerError",
    message: err.message || "An unexpected error occurred on the server.",
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
};

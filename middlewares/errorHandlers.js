export function notFoundHandler(req, res, next) {
  res.status(404).json({ error: "Not Found" });
}

export function generalErrorHandler(err, req, res, next) {
  res.status(err.status || 500).json({
    error: {
      message: err.message,
      stack: req.app.get("env") === "development" ? err.stack : {},
    },
  });
}

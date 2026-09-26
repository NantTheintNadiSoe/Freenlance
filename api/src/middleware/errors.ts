import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";

export const notFound: RequestHandler = (_request, _response, next) => {
  next(Object.assign(new Error("Route not found"), { statusCode: 404, code: "NOT_FOUND" }));
};

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  const statusCode = error?.statusCode ?? 500;
  const code = error?.code ?? "INTERNAL_SERVER_ERROR";
  const fields = error instanceof ZodError ? error.flatten().fieldErrors : undefined;
  const message = error instanceof ZodError ? "The request is invalid" : error?.message ?? "Unexpected server error";

  if (statusCode >= 500) request.logError?.(error);

  response.status(statusCode).json({
    error: { code, message, ...(fields ? { fields } : {}) }
  });
};

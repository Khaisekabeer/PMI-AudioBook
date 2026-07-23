import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function getErrorMessage(err, defaultMessage = "An error occurred. Please try again.") {
  if (!err) return defaultMessage;
  if (typeof err === "string") return err;

  const resData = err.response?.data;
  if (resData) {
    if (typeof resData === "string") return resData;
    if (typeof resData.error === "string") return resData.error;
    if (resData.error && typeof resData.error === "object") {
      if (typeof resData.error.message === "string") return resData.error.message;
      if (typeof resData.error.code === "string" || typeof resData.error.code === "number") {
        return `Error ${resData.error.code}: ${resData.error.message || 'Server error'}`;
      }
    }
    if (typeof resData.message === "string") return resData.message;
    if (typeof resData.error_description === "string") return resData.error_description;
  }

  if (typeof err.message === "string") return err.message;
  if (typeof err.error_description === "string") return err.error_description;

  if (typeof err === "object") {
    if (typeof err.code === "string" || typeof err.code === "number") {
      if (typeof err.message === "string") return `[${err.code}] ${err.message}`;
    }
  }

  return defaultMessage;
}
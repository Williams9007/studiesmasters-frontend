"use client";

import { cn } from "../../utils/helpers";


export function Input({ className, type = "text", ...props }) {
  return (
    <input
      type={type}
      className={cn(
        "w-full rounded-md border px-3 py-2 text-sm text-gray-900 bg-white outline-none placeholder-gray-400 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  );
}

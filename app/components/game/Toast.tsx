import React from "react";

interface ToastProps {
  msg: string;
  type: "success" | "error" | "info";
}

export const Toast = ({ msg, type }: ToastProps) => {
  const colors = { success: "#5BDB6F", error: "#FF6B6B", info: "#818cf8" };
  return (
    <div
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl font-bold text-white text-sm pointer-events-none"
      style={{
        background: "rgba(10,10,20,0.95)",
        border: `1px solid ${colors[type]}`,
        boxShadow: `0 4px 24px ${colors[type]}44`,
        color: colors[type],
      }}
    >
      {msg}
    </div>
  );
};

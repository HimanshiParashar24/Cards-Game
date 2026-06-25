import React from "react";

const AVATAR_COLORS: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  you: { bg: "#2d1b4e", border: "#b794f4", text: "#b794f4" },
  rohan: { bg: "#1a3a5c", border: "#63b3ed", text: "#63b3ed" },
  aman: { bg: "#1a2c1a", border: "#68d391", text: "#68d391" },
  sneha: { bg: "#3d1a1a", border: "#fc8181", text: "#fc8181" },
};

interface AvatarProps {
  id: string;
  name: string;
  size?: number;
  online?: boolean;
}

export const Avatar = ({
  id,
  name,
  size = 44,
  online = false,
}: AvatarProps) => {
  const c = AVATAR_COLORS[id] || {
    bg: "#2a2a3e",
    border: "#a0aec0",
    text: "#a0aec0",
  };
  const initials = name === "You" ? "YO" : name.slice(0, 2).toUpperCase();
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="rounded-full flex items-center justify-center font-bold"
        style={{
          width: size,
          height: size,
          background: c.bg,
          border: `2px solid ${c.border}`,
          color: c.text,
          fontSize: size * 0.33,
        }}
      >
        {initials}
      </div>
      {online && (
        <div
          className="absolute bottom-0 right-0 rounded-full"
          style={{
            width: size * 0.28,
            height: size * 0.28,
            background: "#48bb78",
            border: "2px solid #071510",
          }}
        />
      )}
    </div>
  );
};

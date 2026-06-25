import React from "react";

interface ScoreNumProps {
  v: number;
  size?: "sm" | "lg";
}

export const ScoreNum = ({ v, size = "lg" }: ScoreNumProps) => (
  <span
    style={{
      color: v >= 0 ? "#5BDB6F" : "#FF6B6B",
      fontWeight: 900,
      fontSize: size === "lg" ? 20 : 13,
    }}
  >
    {v >= 0 ? "+" : ""}
    {v}
  </span>
);

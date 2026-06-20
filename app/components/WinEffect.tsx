import Confetti from "react-confetti";
import { useEffect, useState } from "react";

export default function WinEffect({ show }: { show: boolean }) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const update = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (!show) return null;

  return (
    <Confetti
      width={size.width}
      height={size.height}
      numberOfPieces={2500}   // ✅ smooth & bright
      recycle={true}
      gravity={0.11}         // ✅ natural fall
      initialVelocityY={25}  // 💥 burst feel
      initialVelocityX={10}
      colors={[
        "#FF0054",
        "#00F5FF",
        "#FFD500",
        "#00FF85",
        "#FF3D00",
        "#B300FF",
        "#FFFFFF",
      ]}
      style={{
        position: "fixed",
        zIndex: 9999,
      }}
    />
  );
}
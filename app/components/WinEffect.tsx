import Confetti from "react-confetti";
import { useEffect, useState } from "react";

export default function WinEffect({ show }: { show: boolean }) {
  const [size, setSize] = useState({
    width: 0,
    height: 0,
  });

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
      numberOfPieces={200}
      recycle={false}
      gravity={0.25}
    />
  );
}
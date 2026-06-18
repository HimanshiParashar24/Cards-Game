// "use client";
// import HomeComponent from "~/components/home";
// import type { Route } from "./+types/home";
// import FirstPage from "~/components/FirstPage";

// export function meta({}: Route.MetaArgs) {
//   return [
//     { title: "New React Router App" },
//     { name: "description", content: "Welcome to React Router!" },
//   ];
// }

// export default function Home() {
//   return
//   <>
//   <HomeComponent />;
  
//   <FirstPage/>;
//   </> 
//  }

"use client";

import { useEffect, useState } from "react";
import HomeComponent from "~/components/home";
import FirstPage from "~/components/FirstPage";

export default function Home() {
  const [showHome, setShowHome] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHome(true);
    }, 5000); // 5 sec intro

    return () => clearTimeout(timer);
  }, []);

  return showHome ? <HomeComponent /> : <FirstPage />;
}
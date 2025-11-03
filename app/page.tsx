"use client";

import { useState } from "react";
import { Card } from "@heroui/react";
import SudokuGrid from "./frontend/components/SudokuGrid";
import SudokuMenu from "./frontend/components/main";

export default function Page() {
  const [view, setView] = useState<"menu" | "grid">("menu");

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card shadow="lg" className="p-6 bg-white flex flex-col items-center gap-4">
        <div className="flex gap-2">
          <button onClick={() => setView("menu")}>Menu</button>
          <button onClick={() => setView("grid")}>Grid</button>
        </div>

        {view === "menu" && <SudokuMenu />}
        {view === "grid" && <SudokuGrid />}
      </Card>
    </main>
  );
}

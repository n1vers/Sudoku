"use client";

import { Card } from "@heroui/react";
import SudokuGrid from "./frontend/components/SudokuGrid";

export default function Page() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card shadow="lg" className="p-6 bg-white">
        <SudokuGrid />
      </Card>
    </main>
  );
}

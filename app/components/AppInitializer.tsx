"use client";

import { useAppNavigation } from "@/app/hooks/useAppNavigation";
import React from "react";

// Este componente aplica o hook de navegação por controle remoto
export default function AppInitializer({ children }: { children: React.ReactNode }) {
  useAppNavigation();
  return <>{children}</>;
}
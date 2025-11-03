"use client";

import { useAppNavigation } from "@/app/hooks/useAppNavigation";
import React from "react";

// Este componente aplica o hook de navegação por controle remoto
export default function AppInitializer({ children }: { children: React.ReactNode }) {
  
  // OTIMIZAÇÃO: Desabilitado o hook de navegação por setas.
  // Este hook é muito pesado (calcula distâncias em todos os elementos
  // a cada tecla) e é uma causa provável de congelamentos.
  // A LINHA ABAIXO É A CAUSA DO TRAVAMENTO:
  // useAppNavigation(); 
  
  return <>{children}</>;
}
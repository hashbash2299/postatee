"use client"
import { usePresence } from "@/lib/hooks/usePresence";

export default function PresenceProvider({ children }: { children: React.ReactNode }){
  usePresence();
  return <>{children}</>;
}
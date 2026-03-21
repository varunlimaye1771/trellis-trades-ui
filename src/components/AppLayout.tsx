import { ReactNode } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileBottomBar } from "@/components/MobileBottomBar";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <AppSidebar />
      <MobileBottomBar />
      <main className="md:ml-[220px] p-6 pb-20 md:pb-6">
        {children}
      </main>
    </div>
  );
}

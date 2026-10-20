import React, { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="bg-[#f9f9ff] text-[#151c27] min-h-screen flex flex-col font-sans selection:bg-[#b12408] selection:text-white">
      {/* 1. Left Fixed 256px Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* 2. Top Shared Header */}
      <AdminHeader
        onOpenSidebar={() => setSidebarOpen(true)}
      />

      {/* 3. Main Page Content (Offset by 256px sidebar on lg and 64px header) */}
      <div className="lg:pl-64 pt-16 flex-1 flex flex-col min-w-0 transition-all">
        {children}
      </div>
    </div>
  );
}

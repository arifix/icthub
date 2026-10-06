import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { usePageTracking } from "../hooks/usePageTracking";

const MainLayout: React.FC = () => {
  usePageTracking();
  return (
    <div className="portal-shell flex flex-col min-h-screen bg-[#f9fafb]">
      <div className="print:hidden">
        <Navbar />
      </div>
      <main className="flex-grow">
        <Outlet />
      </main>
      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;

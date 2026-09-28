import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { usePageTracking } from "../hooks/usePageTracking";

const MainLayout: React.FC = () => {
  usePageTracking();
  return (
    <div className="flex flex-col min-h-screen bg-[#f9fafb]">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;

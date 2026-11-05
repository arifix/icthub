import React, { Suspense } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ChatWidget from "../components/ChatWidget";
import ErrorBoundary from "../components/ErrorBoundary";
import { Spinner } from "../components/ui";
import { usePageTracking } from "../hooks/usePageTracking";
import { NotificationsProvider } from "../context/NotificationsContext";

const MainLayout: React.FC = () => {
  usePageTracking();
  return (
    <NotificationsProvider>
      <div className="portal-shell flex flex-col min-h-screen bg-[#f9fafb]">
        <a
          href="#main"
          className="sr-only z-[60] rounded-lg bg-accent px-4 py-2 text-accent-fg focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <div className="print:hidden">
          <Navbar />
        </div>
        <main id="main" className="flex-grow">
          <ErrorBoundary>
            <Suspense
              fallback={
                <div className="grid min-h-[50vh] place-items-center">
                  <Spinner />
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
        <div className="print:hidden">
          <Footer />
          <ChatWidget />
        </div>
      </div>
    </NotificationsProvider>
  );
};

export default MainLayout;

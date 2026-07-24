import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { PortalAccessProvider } from "./context/PortalAccessContext";
import ScrollToTop from "./components/ScrollToTop";
import "./index.css";
import { Toaster } from "react-hot-toast";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <PortalAccessProvider>
          <App />
          <Toaster position="top-right" />
        </PortalAccessProvider>
      </AuthProvider>
    </Router>
  </StrictMode>,
);

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { LocationProvider } from "./context/LocationContext.jsx";
import { Toaster } from "sonner";

import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LocationProvider>
          <App />
          <Toaster position="top-center" richColors theme="dark" />
        </LocationProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);

import { RouterProvider } from "react-router";
import { router } from "./routes";
import { ThemeProvider } from "./components/ThemeProvider";
import { Toaster } from "./components/ui/sonner";
import DataPopup from "./components/Data";
import { AuthProvider } from "./pages/AuthContext";
import { Suspense } from "react";

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Suspense fallback={<div>Loading...</div>}>
          <RouterProvider router={router} />
        </Suspense>
        <DataPopup />
        <Toaster />
      </ThemeProvider>
    </AuthProvider>
  );
}
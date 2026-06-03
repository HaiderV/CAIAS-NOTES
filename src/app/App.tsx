import { RouterProvider } from "react-router";
import { router } from "./routes";
import { ThemeProvider } from "./components/ThemeProvider";
import { Toaster } from "./components/ui/sonner";
import DataPopup from "./components/Data";
import { AuthProvider } from "./pages/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <RouterProvider router={router} />
        <DataPopup />
        <Toaster />
      </ThemeProvider>
    </AuthProvider>
  );
}
import { createBrowserRouter } from "react-router";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import BrowseNotes from "./pages/BrowseNotes";
import PDFPreview from "./pages/PDFPreview";
import UploadNotes from "./pages/UploadNotes";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import MyDownloads from "./pages/MyDownloads";
import SavedNotes from "./pages/SavedNotes";
import MyUploads from "./pages/MyUploads";
import ProtectedRoute from "./pages/protectedRoutes";
import ErrorPage from "./pages/ErrorPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
    errorElement: <ErrorPage />,
  },
  {
    path: "/login",
    Component: Login,
    errorElement: <ErrorPage />,
  },
  {
    path: "/register",
    Component: Register,
    errorElement: <ErrorPage />,
  },
  {
    path: "*",
    element: <ErrorPage />
  },

  // Protected Routes
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: "/browse",
    element: (
      <ProtectedRoute>
        <BrowseNotes />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: "/pdf-preview/:noteId",
    element: (
      <ProtectedRoute>
        <PDFPreview />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: "/upload",
    element: (
      <ProtectedRoute>
        <UploadNotes />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: "/profile/:profileId",
    element: (
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: "/settings",
    element: (
      <ProtectedRoute>
        <Settings />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: "/my-downloads",
    element: (
      <ProtectedRoute>
        <MyDownloads />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: "/saved-notes",
    element: (
      <ProtectedRoute>
        <SavedNotes />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: "/my-uploads",
    element: (
      <ProtectedRoute>
        <MyUploads />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
]);
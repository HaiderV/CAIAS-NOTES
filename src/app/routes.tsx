import { lazy } from "react";
import { createBrowserRouter } from "react-router";

import Home from "./pages/Home";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const BrowseNotes = lazy(() => import("./pages/BrowseNotes"));
const PDFPreview = lazy(() => import("./pages/PDFPreview"));
const UploadNotes = lazy(() => import("./pages/UploadNotes"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const MyDownloads = lazy(() => import("./pages/MyDownloads"));
const SavedNotes = lazy(() => import("./pages/SavedNotes"));
const MyUploads = lazy(() => import("./pages/MyUploads"));
const NoticeBoard = lazy(() => import("./pages/NoticeBoard"));

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
    element: (
      <ProtectedRoute>
        <Home />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: "/NoticeBoard",
    element: (
      <ProtectedRoute>
        <NoticeBoard />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
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
    Component: BrowseNotes,
    errorElement: <ErrorPage />,
  },
  {
    path: "/pdf-preview/:noteId",
    Component: PDFPreview,
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
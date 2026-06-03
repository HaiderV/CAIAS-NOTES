import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export default function ProtectedRoute({
    children,
}: ProtectedRouteProps) {
    const { user, loading } = useAuth();

    if (loading) return <div>Loading...</div>;

    return user ? children : <Navigate to="/login" replace />;
}
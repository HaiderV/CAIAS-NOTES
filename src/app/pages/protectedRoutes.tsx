import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export default function ProtectedRoute({
    children,
}: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
                    <p className="text-muted-foreground text-sm font-medium animate-pulse">Authenticating...</p>
                </div>
            </div>
        );
    }

    return user ? children : <Navigate to="/login" replace />;
}
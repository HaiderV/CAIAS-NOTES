import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { auth, db } from "../../../backend/Auth/firebase";
import { Button } from "../components/ui/button";
import { doc, getDoc } from "firebase/firestore";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
    Settings,
    User,
    LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import ConfirmationPopup from "./ui/Confirmation";

export default function DashNav() {
    const { setTheme, theme } = useTheme();
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [userData, setUserData] = useState<any>(null);
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                try {
                    const userDocRef = doc(db, "users", user.uid);
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        setUserData(userDoc.data());
                    }
                } catch (err) {
                    if (err instanceof Error) {
                        toast.error(err.message);
                    } else {
                        toast.error("Something went wrong");
                    }
                }
            } else {
                navigate("/login");
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const getInitials = (name: string) => {
        if (!name) return "JD";
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleConfirmLogout = async () => {
        try {
            setIsLoggingOut(true);
            await signOut(auth);
            setShowLogoutConfirm(false);
            navigate("/login");
            toast.success("Logged Out successfully!")
        } catch (err: any) {
            toast.error(err.message || "Something went wrong");
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {currentUser ? (
                <Link
                    to={`/profile/${currentUser?.uid}`}
                    className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
                >
                    {userData?.avatarUrl || currentUser.photoURL ? (
                        <img
                            src={userData?.avatarUrl || currentUser.photoURL || ""}
                            alt="User Profile"
                            className="w-9 h-9 rounded-full object-cover border border-border hover:opacity-85 transition-opacity"
                        />
                    ) : (
                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold hover:opacity-85 transition-opacity">
                            {getInitials(
                                userData?.firstName && userData?.lastName
                                    ? `${userData.firstName} ${userData.lastName}`
                                    : currentUser.displayName || currentUser.email || "U"
                            )}
                        </div>
                    )}
                </Link>
            ) : (
                <Link to="/login" className="shrink-0">
                    <div className="w-9 h-9 bg-muted rounded-full flex items-center justify-center text-muted-foreground text-sm hover:bg-accent transition-colors">
                        <User className="w-4 h-4" />
                    </div>
                </Link>
            )}

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="px-2 sm:px-3 gap-1 items-center shrink-0 hidden sm:flex"
                        onClick={() => navigate(`/profile/${currentUser?.uid}`)}
                    >
                        <span className="truncate max-w-[120px] font-medium">
                            {userData?.firstName && userData?.lastName
                                ? `${userData.firstName} ${userData.lastName}`
                                : currentUser?.displayName || currentUser?.email?.split('@')[0] || "Guest"}
                        </span>
                        <svg className="w-4 h-4 text-muted-foreground ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    align="end"
                    className="w-56"
                >
                    <DropdownMenuLabel>
                        My Account
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem asChild>
                        <Link
                            to={`/profile/${currentUser?.uid}`}
                            className="cursor-pointer"
                        >
                            <User className="w-4 h-4 mr-2" />
                            Profile
                        </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                        <Link
                            to="/settings"
                            className="cursor-pointer"
                        >
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                        </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        onClick={() =>
                            setTheme(
                                theme === "dark" ? "light" : "dark"
                            )
                        }
                    >
                        {theme === "dark"
                            ? "Light"
                            : "Dark"}{" "}
                        Mode
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        className="text-red-600 cursor-pointer"
                        onClick={() => setShowLogoutConfirm(true)}
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Log out
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <ConfirmationPopup
                isOpen={showLogoutConfirm}
                title="Log Out"
                message="Are you sure you want to log out of your account?"
                isLoading={isLoggingOut}
                onConfirm={handleConfirmLogout}
                onCancel={() => setShowLogoutConfirm(false)}
            />
        </div>
    );
}
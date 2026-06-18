import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { signOut } from "firebase/auth";
import { auth } from "../../../backend/Auth/firebase";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import ConfirmationPopup from "./ui/Confirmation";
import {
    Home,
    Upload,
    FileText,
    Download,
    Bookmark,
    Settings,
    LogOut,
    FolderUp,
    Newspaper,
} from "lucide-react";

import { motion } from "motion/react";

const sidebarItems = [
    { icon: Home, label: "Dashboard", href: "/dashboard" },
    { icon: FileText, label: "Browse Notes", href: "/browse" },
    { icon: Upload, label: "Upload Notes", href: "/upload" },
    { icon: FolderUp, label: "My Uploads", href: "/my-uploads" },
    { icon: Download, label: "My Downloads", href: "/my-downloads" },
    { icon: Bookmark, label: "Saved Notes", href: "/saved-notes" },
    { icon: Settings, label: "Settings", href: "/settings" },
    { icon: Newspaper, label: "Notice Board", href: "/NoticeBoard" },
];

type SideBarProps = {
    sidebarOpen: boolean;
    setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function SideBar({
    sidebarOpen,
    setSidebarOpen,
}: SideBarProps) {
    const navigate = useNavigate();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleConfirmLogout = async () => {
        try {
            setIsLoggingOut(true);
            navigate("/", { replace: true });
            await signOut(auth);
            setShowLogoutConfirm(false);
            setSidebarOpen(false);
            toast.success("Logged Out successfully!")
        } catch (err: any) {
            toast.error(err.message || "Error while logging out?");
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <motion.aside
            initial={false}
            className={`fixed lg:sticky left-0 top-0 h-screen w-64 bg-card border-r border-border z-50 transition-transform duration-300 ease-in-out ${sidebarOpen
                ? "translate-x-0"
                : "-translate-x-full lg:translate-x-0"
                }`}
        >
            <div className="flex flex-col h-full">
                {/* Logo */}
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold">N</span>
                        </div>

                        <span className="font-bold text-lg sm:text-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                            CAIAS NOTES
                        </span>
                    </Link>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    >
                        ✕
                    </Button>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {sidebarItems.map((item) => (
                        <Link key={item.label} to={item.href}>
                            <Button
                                variant="ghost"
                                className="w-full justify-start hover:bg-accent/50 h-12 text-base lg:h-10 lg:text-sm"
                                onClick={() => setSidebarOpen(false)}
                            >
                                <item.icon className="w-6 h-6 mr-3 lg:w-5 lg:h-5" />
                                {item.label}
                            </Button>
                        </Link>
                    ))}
                    <Button
                        variant="ghost"
                        className="w-full justify-start h-12 text-base lg:h-10 lg:text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                        onClick={() => setShowLogoutConfirm(true)}
                    >
                        <LogOut className="w-6 h-6 mr-3 lg:w-5 lg:h-5" />
                        Log out
                    </Button>
                </nav>
            </div>

            <ConfirmationPopup
                isOpen={showLogoutConfirm}
                title="Log Out"
                message="Are you sure you want to log out of your account?"
                isLoading={isLoggingOut}
                onConfirm={handleConfirmLogout}
                onCancel={() => setShowLogoutConfirm(false)}
            />
        </motion.aside>
    );
}
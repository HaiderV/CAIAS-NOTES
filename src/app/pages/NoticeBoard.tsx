import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import DashNav from "../components/DashNav";
import SideBar from "../components/SideBar";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../../backend/Auth/firebase";
import {
    Menu,
    Calendar,
    Pin,
    Megaphone,
    AlertTriangle,
    Info,
    CheckCircle2,
    Bell,
    Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

interface Announcement {
    id: string;
    title: string;
    message: string;
    type: "warning" | "info" | "success" | "alert";
    date: string;
    pinned: boolean;
    author: string;
}

// Announcements Constant Data
const ANNOUNCEMENTS: Announcement[] = [
    {
        id: "ann-1",
        title: "Server Wake-Up Delay Notice",
        message: "Our backend is hosted on a free Render instance. To keep this platform free, the server goes to sleep when inactive. Your first upload, save, download, or delete request might take few seconds to complete while the backend spins up. Subsequent requests will load instantly!",
        type: "warning",
        date: "June 5, 2026",
        pinned: true,
        author: "Admin"
    },
    {
        id: "ann-2",
        title: "Vercel Routing Optimizations",
        message: "We've optimized direct page access routing on Vercel. Reloading the page or visiting routes like /dashboard or /settings directly will now load seamlessly without throwing 404 errors.",
        type: "info",
        date: "June 5, 2026",
        pinned: false,
        author: "Admin"
    },
    {
        id: "ann-3",
        title: "Welcome to CAIAS NOTES",
        message: "Welcome to the central study hub for CAIAS! Share original lecture notes, previous year question papers (PYQP), or internal exams to help fellow students prepare. Happy studying!",
        type: "success",
        date: "June 5, 2026",
        pinned: false,
        author: "Admin"
    }
];

export default function NoticeBoard() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [filterPinned, setFilterPinned] = useState<"all" | "pinned">("all");

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
                } catch (err: any) {
                    toast.error(err.message || "Error while fetching user data");
                }
            } else {
                navigate("/login");
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [navigate]);

    // Filter announcements (by pinned status only)
    const filteredAnnouncements = useMemo(() => {
        return ANNOUNCEMENTS.filter((ann) => {
            return filterPinned === "all" || (filterPinned === "pinned" && ann.pinned);
        });
    }, [filterPinned]);

    const getTypeStyles = (type: Announcement["type"]) => {
        switch (type) {
            case "warning":
                return {
                    border: "border-amber-500/30 dark:border-amber-500/20",
                    bg: "bg-amber-50/50 dark:bg-amber-950/10",
                    iconColor: "text-amber-600 dark:text-amber-400",
                    badgeBg: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300",
                    glow: "shadow-amber-500/5 dark:shadow-amber-500/2",
                    icon: <AlertTriangle className="w-5 h-5" />
                };
            case "success":
                return {
                    border: "border-emerald-500/30 dark:border-emerald-500/20",
                    bg: "bg-emerald-50/50 dark:bg-emerald-950/10",
                    iconColor: "text-emerald-600 dark:text-emerald-400",
                    badgeBg: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300",
                    glow: "shadow-emerald-500/5 dark:shadow-emerald-500/2",
                    icon: <CheckCircle2 className="w-5 h-5" />
                };
            case "alert":
                return {
                    border: "border-rose-500/30 dark:border-rose-500/20",
                    bg: "bg-rose-50/50 dark:bg-rose-950/10",
                    iconColor: "text-rose-600 dark:text-rose-400",
                    badgeBg: "bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300",
                    glow: "shadow-rose-500/5 dark:shadow-rose-500/2",
                    icon: <Bell className="w-5 h-5" />
                };
            default: // info
                return {
                    border: "border-indigo-500/30 dark:border-indigo-500/20",
                    bg: "bg-indigo-50/50 dark:bg-indigo-950/10",
                    iconColor: "text-indigo-600 dark:text-indigo-400",
                    badgeBg: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300",
                    glow: "shadow-indigo-500/5 dark:shadow-indigo-500/2",
                    icon: <Info className="w-5 h-5" />
                };
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
                    <p className="text-muted-foreground text-sm font-medium animate-pulse">Loading Notice Board...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background lg:flex">
            {/* Sidebar Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            <SideBar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />

            {/* Main Content */}
            <div className="flex-1 min-h-screen pb-20">
                {/* Header */}
                <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
                    <div className="flex items-center justify-between px-4 lg:px-8 h-16">
                        <div className="flex items-center gap-4 flex-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="lg:hidden"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <Menu className="w-5 h-5" />
                            </Button>
                        </div>
                        <DashNav />
                    </div>
                </header>

                {/* Content */}
                <main className="p-4 lg:p-8">
                    {/* Header Banner */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                    <Megaphone className="w-6 h-6 text-white" />
                                </div>
                                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                                    Notice Board
                                </h1>
                            </div>
                            <p className="text-muted-foreground text-sm sm:text-base">
                                Keep track of important platform announcements, updates, and backend status.
                            </p>
                        </div>

                        {/* Sparkle decorative element */}
                        <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-full px-3 py-1.5 text-xs text-indigo-600 dark:text-indigo-400">
                            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                            <span>Stay Updated</span>
                        </div>
                    </div>

                    {/* Controls Bar */}
                    <div className="mb-6 flex justify-start">
                        <div className="flex items-center gap-2 bg-card border border-border p-1 rounded-lg shadow-sm">
                            <Button
                                size="sm"
                                variant={filterPinned === "all" ? "default" : "ghost"}
                                className={`text-xs h-8 px-4 font-semibold ${filterPinned === "all" ? "bg-indigo-600 text-white hover:bg-indigo-700" : ""}`}
                                onClick={() => setFilterPinned("all")}
                            >
                                All Updates
                            </Button>
                            <Button
                                size="sm"
                                variant={filterPinned === "pinned" ? "default" : "ghost"}
                                className={`text-xs h-8 px-4 gap-1.5 font-semibold ${filterPinned === "pinned" ? "bg-indigo-600 text-white hover:bg-indigo-700" : ""}`}
                                onClick={() => setFilterPinned("pinned")}
                            >
                                <Pin className="w-3 h-3 fill-current rotate-45" />
                                Pinned Only
                            </Button>
                        </div>
                    </div>

                    {/* Announcement Feed */}
                    <div className="space-y-6">
                        {filteredAnnouncements.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-card rounded-2xl border border-dashed border-border shadow-sm">
                                <Megaphone className="w-12 h-12 text-muted-foreground mb-4 opacity-40 animate-bounce" />
                                <h3 className="text-lg font-bold mb-1">No Announcements Found</h3>
                                <p className="text-sm text-muted-foreground max-w-sm">
                                    There are no notices matching your filter.
                                </p>
                            </div>
                        ) : (
                            <motion.div layout className="space-y-6">
                                {filteredAnnouncements.map((ann, idx) => {
                                    const styles = getTypeStyles(ann.type);

                                    return (
                                        <motion.div
                                            key={ann.id}
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.4, delay: idx * 0.05 }}
                                        >
                                            <Card className={`relative border-l-4 border shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 overflow-hidden ${styles.border} ${styles.bg} ${styles.glow}`}>

                                                {/* Background decorative gradient */}
                                                <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full blur-xl pointer-events-none" />

                                                <CardHeader className="p-5 pb-3">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex items-start gap-3 min-w-0">
                                                            {/* Type Icon Container */}
                                                            <div className={`p-2 rounded-lg shrink-0 ${styles.badgeBg} ${styles.iconColor}`}>
                                                                {styles.icon}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                                    <Badge className={`text-[10px] py-0.5 px-2 uppercase font-bold tracking-wider rounded-md border-0 ${styles.badgeBg}`}>
                                                                        {ann.type}
                                                                    </Badge>
                                                                    {ann.pinned && (
                                                                        <Badge className="bg-indigo-600/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[10px] py-0.5 px-2 rounded-md font-semibold flex items-center gap-1">
                                                                            <Pin className="w-3 h-3 fill-current rotate-45 shrink-0" />
                                                                            Pinned
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <CardTitle className="text-lg font-bold text-foreground break-words leading-tight">
                                                                    {ann.title}
                                                                </CardTitle>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardHeader>

                                                <CardContent className="p-5 pt-0">
                                                    <p className="text-sm text-foreground/80 dark:text-foreground/90 leading-relaxed mb-6 whitespace-pre-line break-words">
                                                        {ann.message}
                                                    </p>

                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-border/60 pt-4 text-xs text-muted-foreground">
                                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="w-3.5 h-3.5" />
                                                                <span>{ann.date}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-border" />
                                                                <span>Posted by: <strong className="text-foreground/70">{ann.author}</strong></span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
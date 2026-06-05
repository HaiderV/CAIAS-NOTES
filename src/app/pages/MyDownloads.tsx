import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import DashNav from "../components/DashNav";
import SideBar from "../components/SideBar";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../../backend/Auth/firebase";
import {
    FileText,
    Download,
    Search,
    Menu,
    Eye,
    Star,
    Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

export default function MyDownloads() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [downloadedNotes, setDownloadedNotes] = useState<any[]>([]);

    //fetch download notes
    const fetchDownloadedNotes = async (uid?: string) => {
        try {
            const userId = uid || auth.currentUser?.uid;
            if (!userId) return;

            const userSnap = await getDoc(
                doc(db, "users", userId)
            );

            if (!userSnap.exists()) return;

            const downloadedIds = userSnap.data().downloadedNotes || [];

            const notesList = await Promise.all(
                downloadedIds.map(async (noteId: string) => {
                    const noteSnap = await getDoc(
                        doc(db, "notes", noteId)
                    );

                    if (noteSnap.exists()) {
                        const data = noteSnap.data();
                        return {
                            id: noteSnap.id,
                            ...data,
                        };
                    }

                    return null;
                })
            );

            const validNotes = notesList.filter(Boolean);

            validNotes.sort(
                (a: any, b: any) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
            );

            setDownloadedNotes(validNotes);
        } catch (error: any) {
            toast.error(error.message || "Error in fetching data!");
        }
    };

    // Listen to Firebase Auth state changes and fetch downloaded notes
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
                    await fetchDownloadedNotes(user.uid);
                } catch (err: any) {
                    toast.error(err.message || "Error loading user profile details");
                }
            } else {
                navigate("/login");
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [navigate]);

    //download pdf function
    const handleDownload = async (
        fileUrl: string,
        title: string
    ) => {
        if (!fileUrl) return;

        try {
            const link = document.createElement("a");
            link.href = fileUrl;
            link.download = `${title || "document"}.pdf`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("Downloaded Successfully!")
        } catch (error: any) {
            toast.error(error.message || "Error in downloading file!");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
                    <p className="text-muted-foreground text-sm font-medium animate-pulse">Loading My Downloads...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background lg:flex">
            {/* Sidebar */}
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
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-lg flex items-center justify-center">
                                <Download className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h1 className="text-3xl font-bold">My Downloads</h1>
                        </div>
                        <p className="text-muted-foreground">Access all your downloaded study materials in one place</p>
                    </div>

                    {/* Downloads List */}
                    <div className="space-y-4">
                        {downloadedNotes.map((note, index) => (
                            <motion.div
                                key={note.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                            >
                                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            {/* PDF Icon */}
                                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600 dark:text-indigo-400" />
                                            </div>

                                            {/* Note Info */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-lg mb-2">{note.title}</h3>

                                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                                    <Badge className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border-0">
                                                        {note.course}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-xs">
                                                        Sem {note.semester}
                                                    </Badge>
                                                    <span className="text-sm text-muted-foreground">{note.subject}</span>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        {new Date(note.createdAt).toLocaleDateString("en-IN", {
                                                            day: "numeric",
                                                            month: "short",
                                                            year: "numeric",
                                                        })}
                                                    </span>
                                                    <span>{note.fileSize}</span>
                                                    <span className="flex items-center gap-1">
                                                        <Download className="w-4 h-4" />
                                                        {note.downloadCount || 0}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                        {note.ratingCount > 0
                                                            ? (note.ratingSum / note.ratingCount).toFixed(1)
                                                            : "Not Rated"}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex sm:flex-col gap-2">
                                                <Link to={`/pdf-preview/${note.id}`} className="flex-1 sm:flex-initial">
                                                    <Button variant="outline" className="w-full">
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        Preview
                                                    </Button>
                                                </Link>
                                                <Button
                                                    className="flex-1 sm:flex-initial bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90"
                                                    onClick={() =>
                                                        handleDownload(
                                                            note.fileUrl,
                                                            note.title
                                                        )
                                                    }
                                                >
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Download
                                                </Button>

                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    {/* Empty State (when no downloads) */}
                    {downloadedNotes.length === 0 && (
                        <Card className="border-0 shadow-lg">
                            <CardContent className="p-12 text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Download className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">No Downloads Yet</h3>
                                <p className="text-muted-foreground mb-6">
                                    Start exploring and downloading notes to build your study collection
                                </p>
                                <Link to="/browse">
                                    <Button className="bg-gradient-to-r from-indigo-600 to-purple-600">
                                        <Search className="w-4 h-4 mr-2" />
                                        Browse Notes
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    )}
                </main>
            </div>
        </div>
    );
}

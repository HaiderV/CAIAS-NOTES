import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, arrayRemove, updateDoc, deleteDoc } from "firebase/firestore";
import axios from "axios";
import { auth, db } from "../../../backend/Auth/firebase";
import DashNav from "../components/DashNav";
import SideBar from "../components/SideBar";
import { toast } from "sonner";
import {
    Upload,
    FileText,
    Menu,
    Eye,
    Star,
    Trash2,
    Calendar,
    FolderUp,
    Download,
    Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function MyUploads() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [recentUploads, setRecentUploads] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

    //fetch uploaded notes
    const fetchUploadedNotes = async (uid?: string) => {
        try {
            const userId = uid || auth.currentUser?.uid;
            if (!userId) return;

            const notesQuery = query(
                collection(db, "notes"),
                where("uploadedBy", "==", userId)
            );
            const notesSnap = await getDocs(notesQuery);
            const notesList = notesSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Sort by createdAt descending
            notesList.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setRecentUploads(notesList);
        } catch (error: any) {
            toast.error(error.message || "Error fetching notes!");
        }
    };

    // Auth State Handler
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
                    await fetchUploadedNotes(user.uid);
                } catch (err: any) {
                    toast.error(err.message || "Error fetching user data!");
                }
            } else {
                navigate("/login");
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [navigate]);

    //delete note function
    const handleDeleteNote = async (noteId: string) => {
        try {
            setDeletingNoteId(noteId);
            const user = auth.currentUser;

            if (!user) {
                toast.error("User not logged in");
                return;
            }

            const noteRef = doc(db, "notes", noteId);
            const noteSnap = await getDoc(noteRef);

            if (!noteSnap.exists()) {
                toast.error("Note not found");
                return;
            }

            const noteData = noteSnap.data();

            // Optional security check
            if (noteData.uploadedBy !== user.uid) {
                toast.error("You are not allowed to delete this note");
                return;
            }

            // Remove noteId from all users
            const allUsersSnapshot = await getDocs(
                collection(db, "users")
            );

            const cleanupPromises = allUsersSnapshot.docs.map(
                async (userDoc) => {
                    const userData = userDoc.data();

                    const updates: any = {};

                    if (userData.savedNotes?.includes(noteId)) {
                        updates.savedNotes = arrayRemove(noteId);
                    }

                    if (userData.downloadedNotes?.includes(noteId)) {
                        updates.downloadedNotes = arrayRemove(noteId);
                    }

                    if (Object.keys(updates).length > 0) {
                        await updateDoc(userDoc.ref, updates);
                    }
                }
            );

            await Promise.all(cleanupPromises);

            // Delete Cloudinary file
            if (noteData.publicId) {
                await axios.post(
                    `${import.meta.env.VITE_API_URL}/api/delete-note-file`,
                    {
                        publicId: noteData.publicId,
                    }
                );
            }

            // Delete ratings
            const ratingsRef = collection(
                db,
                "notes",
                noteId,
                "ratings"
            );

            const ratingsSnapshot = await getDocs(ratingsRef);

            await Promise.all(
                ratingsSnapshot.docs.map((ratingDoc) =>
                    deleteDoc(ratingDoc.ref)
                )
            );

            // Delete downloads collection
            const downloadsRef = collection(
                db,
                "notes",
                noteId,
                "downloads"
            );

            const downloadsSnapshot = await getDocs(downloadsRef);

            await Promise.all(
                downloadsSnapshot.docs.map((downloadDoc) =>
                    deleteDoc(downloadDoc.ref)
                )
            );

            // Remove from uploader's uploadedNotes array
            const userRef = doc(db, "users", user.uid);

            await updateDoc(userRef, {
                uploadedNotes: arrayRemove(noteId),
            });

            // Delete note document
            await deleteDoc(noteRef);

            // Update UI
            setRecentUploads((prev) =>
                prev.filter((note) => note.id !== noteId)
            );

            toast.success("Note deleted successfully!");
        } catch (error: any) {
            console.error(error);
            toast.error(
                error.message || "Failed to delete note"
            );
        } finally {
            setDeletingNoteId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
                    <p className="text-muted-foreground text-sm font-medium animate-pulse">Loading settings...</p>
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
                    <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 rounded-lg flex items-center justify-center">
                                    <FolderUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h1 className="text-3xl font-bold">My Uploads</h1>
                            </div>
                            <p className="text-muted-foreground">Manage and track your contributed study materials</p>
                        </div>
                        <Link to="/upload" className="shrink-0">
                            <Button className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white">
                                <Upload className="w-4 h-4 mr-2" />
                                Upload New Notes
                            </Button>
                        </Link>
                    </div>

                    {/* Uploads List */}
                    <div className="space-y-4">
                        {recentUploads.map((upload, index) => (
                            <motion.div
                                key={upload.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                            >
                                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            {/* PDF Icon */}
                                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600 dark:text-emerald-400" />
                                            </div>

                                            {/* Note Info */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-lg mb-2">{upload.title}</h3>

                                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                                    <Badge className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border-0">
                                                        {upload.course}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-xs">
                                                        Sem {upload.semester}
                                                    </Badge>
                                                    <span className="text-sm text-muted-foreground">{upload.subject}</span>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        {new Date(upload.createdAt).toLocaleDateString("en-IN", {
                                                            day: "numeric",
                                                            month: "short",
                                                            year: "numeric",
                                                        })}
                                                    </span>
                                                    <span>{upload.fileSize}</span>
                                                    <span className="flex items-center gap-1">
                                                        <Download className="w-4 h-4" />
                                                        {upload.downloadCount || 0}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                        {upload.ratingCount > 0
                                                            ? (upload.ratingSum / upload.ratingCount).toFixed(1)
                                                            : "Not Rated"}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex sm:flex-col gap-2">
                                                <Link to={`/pdf-preview/${upload.id}`} className="flex-1 sm:flex-initial">
                                                    <Button variant="outline" className="w-full">
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        Preview
                                                    </Button>
                                                </Link>
                                                <Button variant="destructive" className="flex-1 sm:flex-initial"
                                                    onClick={() => handleDeleteNote(upload.noteId)}
                                                    disabled={deletingNoteId === upload.noteId}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    {deletingNoteId === upload.noteId ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                            Deleting...
                                                        </>
                                                    ) : (
                                                        "Delete"
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    {/* Empty State (when no uploads) */}
                    {recentUploads.length === 0 && (
                        <Card className="border-0 shadow-lg">
                            <CardContent className="p-12 text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Upload className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">No Uploads Yet</h3>
                                <p className="text-muted-foreground mb-6">
                                    Start sharing notes to help the college community and track your uploads here
                                </p>
                                <Link to="/upload">
                                    <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white">
                                        <Upload className="w-4 h-4 mr-2" />
                                        Upload Notes
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

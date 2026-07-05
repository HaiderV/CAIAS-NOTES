import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, runTransaction, serverTimestamp, arrayUnion } from "firebase/firestore";
import { auth, db } from "../../../backend/Auth/firebase";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent } from "../components/ui/tabs";
import DashNav from "../components/DashNav";
import SideBar from "../components/SideBar";
import {
    Bookmark,
    BookmarkCheck,
    FileText,
    Search,
    Menu,
    Eye,
    Star,
    Download,
    Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

export default function SavedNotes() {
    const [activeCollection, setActiveCollection] = useState("All");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [savedNotes, setSavedNotes] = useState<any[]>([]);

    const collections = [
        { name: "All", count: savedNotes.length },
        { name: "Favorites", count: savedNotes.filter(n => n.collection === "Favorites").length },
        { name: "Important", count: savedNotes.filter(n => n.collection === "Important").length },
        { name: "Study Later", count: savedNotes.filter(n => n.collection === "Study Later").length },
    ];

    const filteredNotes = activeCollection === "All"
        ? savedNotes
        : savedNotes.filter(note => note.collection === activeCollection);

    const fetchSavedNotes = async (uid?: string) => {
        try {
            const userId = uid || auth.currentUser?.uid;
            if (!userId) return;

            const userSnap = await getDoc(
                doc(db, "users", userId)
            );

            if (!userSnap.exists()) return;

            const savedIds = userSnap.data().savedNotes || [];

            const notesList = await Promise.all(
                savedIds.map(async (noteId: string) => {
                    const noteSnap = await getDoc(
                        doc(db, "notes", noteId)
                    );

                    if (noteSnap.exists()) {
                        const data = noteSnap.data();
                        // Assign a deterministic mock collection for client-side tab sorting/demonstration
                        const collectionTypes = ["Favorites", "Important", "Study Later"];
                        const collection = data.collection || collectionTypes[noteId.charCodeAt(0) % 3];
                        return {
                            id: noteSnap.id,
                            ...data,
                            collection,
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

            setSavedNotes(validNotes);
        } catch (error: any) {
            toast.error(error.message || "Error fetching saved notes");
        }
    };

    // Listen to Firebase Auth state changes and fetch saved notes
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
                    await fetchSavedNotes(user.uid);
                } catch (err) {
                    console.error("Error loading user profile details:", err);
                }
            } else {
                navigate("/login");
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [navigate]);

    //Download function
    const user = auth.currentUser;
    const handleDownloadCount = async (noteId: string) => {
        if (!user || !noteId) return false;

        try {
            const noteRef = doc(db, "notes", noteId);
            const downloadRef = doc(db, "notes", noteId, "downloads", user.uid);
            const userRef = doc(db, "users", user.uid);

            let incremented = false;

            await runTransaction(db, async (transaction) => {
                const existingDownload = await transaction.get(downloadRef);

                if (existingDownload.exists()) {
                    return;
                }

                const noteDoc = await transaction.get(noteRef);

                if (!noteDoc.exists()) {
                    throw new Error("Note not found");
                }

                transaction.update(noteRef, {
                    downloadCount: (noteDoc.data().downloadCount || 0) + 1,
                });

                transaction.set(downloadRef, {
                    userId: user.uid,
                    downloadedAt: serverTimestamp(),
                });

                transaction.set(
                    userRef,
                    {
                        downloadedNotes: arrayUnion(noteId),
                    },
                    { merge: true }
                );

                incremented = true;
            });

            if (incremented) {
                setSavedNotes((prev) =>
                    prev.map((n) =>
                        n.id === noteId
                            ? { ...n, downloadCount: (n.downloadCount || 0) + 1 }
                            : n
                    )
                );
            }

            return incremented;
        } catch (error: any) {
            toast.error(error.message || "Something went wrong");
            return false;
        }
    };


    //download pdf function
    // const handleDownload = async (
    //     noteId: string,
    //     fileUrl: string,
    //     title: string
    // ) => {
    //     if (!fileUrl) return;

    //     const toastId = toast.loading("Preparing download...");
    //     try {
    //         const response = await fetch(fileUrl);
    //         if (!response.ok) {
    //             throw new Error("Failed to fetch file");
    //         }
    //         const blob = await response.blob();
    //         const url = window.URL.createObjectURL(blob);

    //         const link = document.createElement("a");
    //         link.href = url;
    //         link.download = `${title || "document"}.pdf`;

    //         document.body.appendChild(link);
    //         link.click();
    //         document.body.removeChild(link);
    //         window.URL.revokeObjectURL(url);

    //         await handleDownloadCount(noteId);
    //         toast.success("Downloaded Successfully!", { id: toastId });
    //     } catch (error: any) {
    //         toast.error(error.message || "Downloading Failed!", { id: toastId });
    //     }
    // };

    //new google drive 
    const handleDownload = async (noteId: string) => {
        if (!noteId) return;

        window.open(
            `${import.meta.env.VITE_API_URL}/api/files/download/${noteId}`,
            "_blank"
        );

        await handleDownloadCount(noteId);
    };

    const loadingMessages = [
        "Finding your notes...",
        "Organizing notebooks...",
        "Removing coffee stains...",
        "Sharpening virtual pencils...",
        "Looking for page 42...",
        "Summoning forgotten formulas...",
        "Making your notes look smarter...",
        "Loading knowledge..."
    ];

    const [loadingText, setLoadingText] = useState(0);

    useEffect(() => {
        if (!loading) return;

        const interval = setInterval(() => {
            setLoadingText((prev) => (prev + 1) % loadingMessages.length);
        }, 2200);

        return () => clearInterval(interval);
    }, [loading]);


    if (loading) {
        return (
            <div className="relative min-h-screen bg-background flex items-center justify-center overflow-hidden select-none">

                {/* Background Glow */}
                <div className="absolute inset-0">
                    <div className="absolute -top-32 -left-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl animate-pulse" />
                    <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl animate-pulse [animation-delay:1s]" />
                </div>

                <div className="relative z-10 flex flex-col items-center gap-8">

                    {/* Book */}
                    <div className="relative w-24 h-20 flex items-center justify-center animate-[float_2.8s_ease-in-out_infinite] drop-shadow-[0_10px_25px_rgba(99,102,241,0.25)]">

                        {/* Spine */}
                        <div className="absolute w-1 h-16 bg-indigo-600 rounded-full opacity-40" />

                        {/* Covers */}
                        <div className="absolute right-1/2 w-10 h-14 border-2 border-r-0 border-indigo-600 rounded-l-md bg-background" />

                        <div className="absolute left-1/2 w-10 h-14 border-2 border-l-0 border-indigo-600 rounded-r-md bg-background" />

                        {/* Pages */}
                        {[0, 180, 360, 540].map((delay) => (
                            <div
                                key={delay}
                                className="absolute right-1/2 w-9 h-13 border-y border-l border-indigo-400 rounded-l-sm bg-background origin-right"
                                style={{
                                    animation: `pageFlip 1.6s infinite`,
                                    animationDelay: `${delay}ms`,
                                }}
                            />
                        ))}

                        {/* Bookmark */}
                        <div className="absolute top-[78%] left-1/2 -translate-x-1/2 w-1 h-5 bg-indigo-500 rounded-b-sm animate-[bookmark_2s_ease-in-out_infinite]" />
                    </div>

                    {/* Text */}
                    <div className="text-center space-y-2">

                        <h2 className="font-semibold text-lg text-foreground">
                            CAIAS Notes
                        </h2>

                        <p
                            key={loadingText}
                            className="text-sm text-muted-foreground animate-[fadeIn_0.5s]"
                        >
                            {loadingMessages[loadingText]}
                        </p>

                    </div>

                    {/* Loading Bar */}
                    <div className="w-56 h-1 rounded-full bg-muted overflow-hidden">

                        <div className="h-full w-20 rounded-full bg-indigo-500 animate-[loadingBar_1.8s_infinite]" />

                    </div>

                </div>

                <style>{`
      
      @keyframes float{
        0%,100%{
          transform:translateY(0px);
        }
        50%{
          transform:translateY(-8px);
        }
      }

      @keyframes pageFlip{

        0%{
          transform:rotateY(0deg);
          opacity:1;
        }

        70%{
          transform:rotateY(-180deg);
          opacity:.8;
        }

        100%{
          transform:rotateY(-180deg);
          opacity:0;
        }

      }

      @keyframes loadingBar{

        0%{
          transform:translateX(-120%);
        }

        100%{
          transform:translateX(340%);
        }

      }

      @keyframes bookmark{

        0%,100%{
          transform:translateX(-50%) rotate(0deg);
        }

        50%{
          transform:translateX(-50%) rotate(6deg);
        }

      }

      @keyframes fadeIn{

        from{
          opacity:0;
          transform:translateY(6px);
        }

        to{
          opacity:1;
          transform:translateY(0);
        }

      }

      `}</style>

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
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 rounded-lg flex items-center justify-center">
                                <Bookmark className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h1 className="text-3xl font-bold">Saved Notes</h1>
                        </div>
                        <p className="text-muted-foreground">Your bookmarked materials organized by collections</p>
                    </div>

                    {/* Saved Notes Card List (Only if user has bookmarked notes) */}
                    {savedNotes.length > 0 ? (
                        <Tabs value={activeCollection} onValueChange={setActiveCollection}>
                            {collections.map((col) => (
                                <TabsContent key={col.name} value={col.name} className="mt-0">
                                    <div className="space-y-4">
                                        {filteredNotes.length > 0 ? (
                                            filteredNotes.map((note, index) => (
                                                <motion.div
                                                    key={note.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.4, delay: index * 0.05 }}
                                                >
                                                    <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
                                                        <CardContent className="p-6">
                                                            <div className="flex flex-col sm:flex-row gap-4">
                                                                {/* PDF Icon */}
                                                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                                                                    <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 dark:text-purple-400" />
                                                                </div>

                                                                {/* Note Info */}
                                                                <div className="flex-1 min-w-0">
                                                                    <h3 className="font-semibold text-lg mb-2">{note.title}</h3>

                                                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                                                        <Badge className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border-0">
                                                                            {note.course}
                                                                        </Badge>
                                                                        <Badge variant="outline" className="text-xs">
                                                                            Sem {note.semester}
                                                                        </Badge>
                                                                        <span className="text-sm text-muted-foreground line-clamp-1">
                                                                            {note.subject}
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-muted-foreground">
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
                                                                <div className="flex sm:flex-col gap-1.5">
                                                                    <Link
                                                                        to={`/pdf-preview/${note.id}`}
                                                                        className="flex-1 sm:flex-none"
                                                                    >
                                                                        <Button
                                                                            variant="outline"
                                                                            className="w-full"
                                                                        >
                                                                            <Eye className="w-4 h-4 mr-2" />
                                                                            Preview
                                                                        </Button>
                                                                    </Link>

                                                                    {note.id ? (
                                                                        <Button
                                                                            className="flex-1 sm:flex-none w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90"
                                                                            onClick={() =>
                                                                                handleDownload(note.id)
                                                                            }
                                                                        >
                                                                            <Download className="w-4 h-4 mr-2" />
                                                                            Download
                                                                        </Button>
                                                                    ) : (
                                                                        <Button
                                                                            disabled
                                                                            className="flex-1 sm:flex-none w-full bg-gray-400"
                                                                        >
                                                                            <Download className="w-4 h-4 mr-2" />
                                                                            Download
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </motion.div>
                                            ))
                                        ) : (
                                            <div className="py-12 text-center text-muted-foreground">
                                                <BookmarkCheck className="w-16 h-16 mx-auto mb-4 opacity-50 text-purple-400" />
                                                <p className="font-medium">No notes saved in this collection</p>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    ) : (
                        /* Empty State (when user has zero saved notes) */
                        <Card className="border-0 shadow-lg mt-6">
                            <CardContent className="p-12 text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Bookmark className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">No Saved Notes</h3>
                                <p className="text-muted-foreground mb-6">
                                    Start bookmarking notes to create your personalized study collection
                                </p>
                                <Link to="/browse">
                                    <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                                        <Search className="w-4 h-4 mr-2" />
                                        Browse Notes
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    )}
                </main>
            </div>
        </div >
    );
}

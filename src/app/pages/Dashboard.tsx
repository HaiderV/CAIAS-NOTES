import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../../../backend/Auth/firebase";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import DashNav from "../components/DashNav";
import SideBar from "../components/SideBar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";

import {
  Home,
  Upload,
  FileText,
  Download,
  Bookmark,
  Settings,
  Search,
  Menu,
  Award,
  Clock,
  ChevronRight,
  FolderUp,
} from "lucide-react";

import { motion, AnimatePresence } from "motion/react";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentUploads, setRecentUploads] = useState<any[]>([]);
  const [savedCount, setSavedCount] = useState<any>(0);
  const [uploadCount, setUploadCount] = useState<any>(0);
  const [totalRatingSum, setTotalRatingSum] = useState(0);
  const [totalRatingCount, setTotalRatingCount] = useState(0);
  const [savedNotes, setSavedNotes] = useState<any[]>([]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);

        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const data = userDoc.data();

            setUserData(data);

            // Saved Notes Count
            setSavedCount(data.savedNotes?.length || 0);

            // Uploaded Notes Count
            setUploadCount(data.uploadedNotes?.length || 0);

            // Rating Calculation
            const uploadedNotes = data.uploadedNotes || [];

            let ratingSum = 0;
            let ratingCount = 0;

            const notePromises = uploadedNotes.map(async (noteId: string) => {

              const noteSnap = await getDoc(doc(db, "notes", noteId));

              if (noteSnap.exists()) {
                ratingSum += noteSnap.data().ratingSum || 0;
                ratingCount += noteSnap.data().ratingCount || 0;
              }
            });

            await Promise.all(notePromises);

            setTotalRatingSum(ratingSum);
            setTotalRatingCount(ratingCount);
          }

          await fetchUploadedNotes(user.uid);
          await fetchSavedNotes(user.uid);
        } catch (err: any) {
          toast.error(err.message || "Error in fetching user data!");
        }
      } else {
        navigate("/login");
      }

      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  const averageRating =
    totalRatingCount > 0
      ? (totalRatingSum / totalRatingCount).toFixed(1)
      : "0.0";

  //fetching user's uploaded notes
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
      toast.error(error.message || "Error in fetching uploaded notes!");
    }
  };

  // Saved Notes Fetch

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
            return {
              id: noteSnap.id,
              ...noteSnap.data(),
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
      toast.error(error.message || "Error in fetching user data!")
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm font-medium animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex overflow-x-hidden">
      {/* Overlay */}
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

      {/* Sidebar */}
      <SideBar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content */}
      <div className="flex-1 min-h-screen min-w-0 pb-10">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between gap-2 px-3 sm:px-4 lg:px-8 h-16 min-w-0">
            {/* Left */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden shrink-0"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>

            {/* Right */}
            <DashNav />
          </div>
        </header>

        {/* Content */}
        <main className="p-4 lg:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {/* Welcome */}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Welcome back, {userData?.firstName || currentUser?.displayName?.split(" ")[0] || "Student"}!
              </h1>

              <p className="text-sm sm:text-base text-muted-foreground">
                Here&apos;s what&apos;s happening with your notes
                today.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm">
                    Total Uploads
                  </CardTitle>

                  <Upload className="w-4 h-4 text-blue-600" />
                </CardHeader>

                <CardContent>
                  <div className="text-2xl font-bold">{uploadCount}</div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm">
                    Total Downloads
                  </CardTitle>

                  <Download className="w-4 h-4 text-purple-600" />
                </CardHeader>

                <CardContent>
                  <div className="text-2xl font-bold">
                    {userData?.DownloadsCount?.toString() || "0"}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm">
                    Saved Notes
                  </CardTitle>

                  <Bookmark className="w-4 h-4 text-green-600" />
                </CardHeader>

                <CardContent>
                  <div className="text-2xl font-bold">{savedCount}</div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm">
                    Reputation
                  </CardTitle>

                  <Award className="w-4 h-4 text-orange-600" />
                </CardHeader>

                <CardContent>
                  <div className="text-2xl font-bold">{averageRating}</div>
                </CardContent>
              </Card>
            </div>

            {/* Two Column Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Recent Uploads */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="truncate">
                        My Recent Uploads
                      </CardTitle>

                      <CardDescription>
                        Your latest contributions
                      </CardDescription>
                    </div>

                    <Link to="/upload" className="shrink-0">
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-indigo-600 to-purple-600"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </Button>
                    </Link>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3 md:space-y-4 max-h-[500px] overflow-y-auto pr-1 md:pr-2">
                    {recentUploads.map((upload) => (
                      <div
                        key={upload.id}
                        onClick={() => navigate(`/pdf-preview/${upload.id}`)}
                        className="flex items-start gap-2 md:gap-3 p-3 md:p-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors cursor-pointer"
                      >
                        {/* PDF Icon */}
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 md:w-6 md:h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm md:text-base truncate">
                            {upload.title}
                          </h4>

                          {/* Badges */}
                          <div className="flex flex-wrap gap-1.5 md:gap-2 mt-2">
                            <Badge variant="default" className="text-[10px] md:text-xs">
                              {upload.course}
                            </Badge>

                            <Badge variant="secondary" className="text-[10px] md:text-xs">
                              Sem {upload.semester}
                            </Badge>

                            {/* Hide on mobile, show on md+ */}
                            <Badge
                              variant="outline"
                              className="hidden md:inline-flex text-xs"
                            >
                              {upload.noteType}
                            </Badge>
                          </div>

                          {/* Hide subject on mobile, show on md+ */}
                          <p className="hidden md:block text-xs text-muted-foreground mt-2 truncate">
                            {upload.subject}
                          </p>

                          {/* Stats */}
                          <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-3 text-[11px] md:text-xs text-muted-foreground">
                            <span className="flex items-center gap-1 whitespace-nowrap">
                              <Clock className="w-3 h-3 shrink-0" />
                              {upload.createdAt
                                ? new Date(upload.createdAt).toLocaleDateString()
                                : ""}
                            </span>

                            <span className="flex items-center gap-1 whitespace-nowrap">
                              <Download className="w-3 h-3 shrink-0" />
                              {upload.downloads || 0}
                            </span>

                            <span className="flex items-center gap-1 whitespace-nowrap">
                              ⭐
                              {upload.ratingCount > 0
                                ? (upload.ratingSum / upload.ratingCount).toFixed(1)
                                : "NR"}
                            </span>
                          </div>
                        </div>

                        {/* Arrow */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 md:h-10 md:w-10 shrink-0"
                        >
                          <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Saved Notes */}
              <Card className="border-0 shadow-lg pb-5">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="truncate">
                        Saved Notes
                      </CardTitle>

                      <CardDescription>
                        Your bookmarked materials
                      </CardDescription>
                    </div>

                    <Link to="/browse" className="shrink-0">
                      <Button size="sm" variant="outline">
                        View All
                      </Button>
                    </Link>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3 md:space-y-4 max-h-[500px] overflow-y-auto pr-1 md:pr-2">
                    {savedNotes.map((note) => (
                      <div
                        key={note.id}
                        onClick={() => navigate(`/pdf-preview/${note.id}`)}
                        className="flex items-start gap-2 md:gap-3 p-3 md:p-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors cursor-pointer"
                      >
                        {/* PDF Icon */}
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 md:w-6 md:h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm md:text-base truncate">
                            {note.title}
                          </h4>

                          {/* Badges */}
                          <div className="flex flex-wrap gap-1.5 md:gap-2 mt-2">
                            <Badge variant="default" className="text-[10px] md:text-xs">
                              {note.course}
                            </Badge>

                            <Badge variant="secondary" className="text-[10px] md:text-xs">
                              Sem {note.semester}
                            </Badge>

                            {/* Hide on mobile, show on md+ */}
                            <Badge
                              variant="outline"
                              className="hidden md:inline-flex text-xs"
                            >
                              {note.noteType}
                            </Badge>
                          </div>

                          {/* Hide subject on mobile, show on md+ */}
                          <p className="hidden md:block text-xs text-muted-foreground mt-2 truncate">
                            {note.subject}
                          </p>

                          {/* Stats */}
                          <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-3 text-[11px] md:text-xs text-muted-foreground">
                            <span className="flex items-center gap-1 whitespace-nowrap">
                              <Clock className="w-3 h-3 shrink-0" />
                              {note.createdAt
                                ? new Date(note.createdAt).toLocaleDateString()
                                : ""}
                            </span>

                            <span className="flex items-center gap-1 whitespace-nowrap">
                              <Download className="w-3 h-3 shrink-0" />
                              {note.downloads || 0}
                            </span>

                            <span className="flex items-center gap-1 whitespace-nowrap">
                              ⭐
                              {note.ratingCount > 0
                                ? (note.ratingSum / note.ratingCount).toFixed(1)
                                : "NR"}
                            </span>
                          </div>
                        </div>

                        {/* Arrow */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 md:h-10 md:w-10 shrink-0"
                        >
                          <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
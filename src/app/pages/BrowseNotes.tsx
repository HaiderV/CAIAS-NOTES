import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router";
import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import DashNav from "../components/DashNav";
import SideBar from "../components/SideBar";
import { collection, getDocs, doc, getDoc, runTransaction, serverTimestamp, arrayUnion } from "firebase/firestore";
import { db } from "../../../backend/Auth/firebase";
import {
  Search,
  FileText,
  Download,
  Eye,
  Star,
  User,
  SlidersHorizontal,
  X,
  Menu,
  Calendar,
} from "lucide-react";
import { motion } from "motion/react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../backend/Auth/firebase";
import { AnimatePresence } from "motion/react";
import { toast } from 'sonner';

export default function BrowseNotes() {
  const [searchParams] = useSearchParams();
  const selectedCourseFromUrl = searchParams.get("course") || "all";

  const [inputValue, setInputValue] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectSubject, setSelectSubject] = useState("Notes");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  type Note = {
    noteId: string;
    title: string;
    subject: string;
    course: string;
    semester: number;
    noteType: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    fileName: string;
    fileSize: string;
    fileUrl: string;
    publicId: string;
    uploadedBy: string;
    ratingCount: number;
    ratingSum: number;
    savedCount: number;
    downloadCount: number;
  };

  type SearchableNote = Note & {
    _searchText: string;
  };

  //States for searching and filtering
  const [allNotes, setAllNotes] = useState<SearchableNote[]>([]);

  const [selectedCourse, setSelectedCourse] = useState(selectedCourseFromUrl);

  useEffect(() => {
    setSelectedCourse(selectedCourseFromUrl);
  }, [selectedCourseFromUrl]);

  const [selectedSemester, setSelectedSemester] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  //Helpers 
  const getDefaultNoteIds = (notes: SearchableNote[]) => {
    return [...notes]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      )
      .map((note) => note.noteId);
  };

  //Applying filters
  const applyFilters = (
    notes: SearchableNote[],
    selectedCourse: string,
    selectedSemester: string,
    selectedType: string
  ) => {
    return notes.filter((note) => {
      const matchesCourse =
        selectedCourse === "all" ||
        (note.course &&
          note.course.toLowerCase() ===
          selectedCourse.toLowerCase());

      const matchesSemester =
        selectedSemester === "all" ||
        (note.semester !== undefined &&
          Number(note.semester) === Number(selectedSemester));

      const matchesType =
        selectedType === "all" ||
        (note.noteType &&
          note.noteType.toLowerCase() ===
          selectedType.toLowerCase());

      return (
        matchesCourse &&
        matchesSemester &&
        matchesType
      );
    });
  };

  //Authentication Effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (!user) {
          navigate("/login");
        } else {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [navigate]);

  //Load Notes
  useEffect(() => {
    const loadNotes = async () => {
      try {
        setLoading(true);

        const querySnapshot = await getDocs(
          collection(db, "notes")
        );

        const notes: SearchableNote[] =
          querySnapshot.docs.map((doc) => {
            const data = doc.data() as Omit<
              Note,
              "noteId"
            >;

            return {
              ...data,
              noteId: doc.id,
              ratingSum: data.ratingSum || 0,
              ratingCount: data.ratingCount || 0,
              savedCount: data.savedCount || 0,

              _searchText: `
              ${data.title || ""}
              ${data.subject || ""}
              ${data.course || ""}
              ${data.noteType || ""}
              ${data.description || ""}
              semester ${data.semester || ""}
            `
                .toLowerCase()
                .trim(),
            };
          });

        setAllNotes(notes);
      } catch (error: any) {
        toast.error(error.message || "Failed to load notes");
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, []);

  //Filter Effect
  useEffect(() => {
    const filteredNotes = applyFilters(
      allNotes,
      selectedCourse,
      selectedSemester,
      selectedType
    );
  }, [
    allNotes,
    selectedCourse,
    selectedSemester,
    selectedType,
  ]);

  //----Search----
  //Search Helper

  const normalizeText = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ");


  const applySearch = (
    notes: SearchableNote[],
    searchQuery: string
  ) => {
    const query = normalizeText(searchQuery);

    if (!query) return notes;

    const terms = query.split(" ");

    return notes
      .map((note) => {
        const text = normalizeText(
          note._searchText
        );

        let score = 0;

        for (const term of terms) {
          if (text.includes(term)) {
            score += 1;
          }
        }

        if (text.includes(query)) {
          score += 10;
        }

        if (
          normalizeText(note.title).includes(query)
        ) {
          score += 20;
        }

        return {
          note,
          score,
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.note);
  };

  //Filter ans search combine
  const filteredNotes = useMemo(() => {
    let results = applyFilters(
      allNotes,
      selectedCourse,
      selectedSemester,
      selectedType
    );

    results = applySearch(
      results,
      searchQuery
    );
    return results;
  }, [
    allNotes,
    selectedCourse,
    selectedSemester,
    selectedType,
    searchQuery,
  ]);

  const noteIds = useMemo(() => {
    return getDefaultNoteIds(filteredNotes);
  }, [filteredNotes]);

  // Client-side pagination state
  const [visibleCount, setVisibleCount] = useState(12);

  // Computed displayed notes
  const displayedNotes = useMemo(() => {
    return filteredNotes.slice(0, visibleCount);
  }, [filteredNotes, visibleCount]);

  const hasMore = visibleCount < filteredNotes.length;

  // Reset pagination when search/filter changes
  useEffect(() => {
    setVisibleCount(12);
  }, [searchQuery, selectedCourse, selectedSemester, selectedType]);

  // Scroll observer for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + 12);
        }
      },
      {
        threshold: 0.1,
      }
    );

    const current = loadMoreRef.current;
    if (current) {
      observer.observe(current);
    }

    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, [hasMore, filteredNotes.length]);

  //uploader name fetch 
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  useEffect(() => {
    const fetchUserNames = async () => {
      const uniqueIds = [...new Set(filteredNotes.map(note => note.uploadedBy))];

      const usersMap: Record<string, string> = {};

      for (const uid of uniqueIds) {
        const userSnap = await getDoc(doc(db, "users", uid));

        if (userSnap.exists()) {
          usersMap[uid] = userSnap.data().firstName;
        }
      }

      setUserNames(usersMap);
    };

    if (filteredNotes.length) {
      fetchUserNames();
    }
  }, [filteredNotes]);

  const user = auth.currentUser;

  //download Count function
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
        setAllNotes((prev: any) =>
          prev.map((n: any) =>
            n.id === noteId
              ? { ...n, downloadCount: (n.downloadCount || 0) + 1 }
              : n
          )
        );
      }

      return incremented;
    } catch (error: any) {
      toast.error(error.message || "Something went wrong!");
      return false;
    }
  };


  //download pdf function
  const handleDownload = async (
    noteId: string,
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

      await handleDownloadCount(noteId);
      toast.success("Downloaded Successfully!");
    } catch (error: any) {
      toast.error(error.message || "Error in Downloading the notes!");
    }
  };



  // loading function
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm font-medium animate-pulse">Loading notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden pb-20">
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
        <div className="flex-1 min-h-screen">
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
            <div className="max-w-7xl mx-auto">

              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                  Browse Notes
                </h1>

                <p className="text-muted-foreground">
                  Discover study materials shared by students across courses
                </p>
              </div>

              {/* Search and Filter Bar */}
              <div className="mb-8">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex gap-2 w-full">
                    <div className="relative flex-1">
                      <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                      />

                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            setSearchQuery(inputValue);
                          }
                        }}
                        placeholder="Search notes, subjects, or topics..."
                        className="pl-10 h-10"
                      />
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 px-4"
                      onClick={() => setSearchQuery(inputValue)}
                    >
                      Search
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="sm:w-auto"
                  >
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Filters
                    {showFilters && <X className="w-4 h-4 ml-2" />}
                  </Button>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-6 bg-card rounded-lg border border-border"
                  >
                    <div className="grid sm:grid-cols-3 lg:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Course</label>
                        <Select value={selectedCourse} onValueChange={(value) => {
                          console.log("Course changed:", value);
                          setSelectedCourse(value);
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="All Courses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Courses</SelectItem>
                            <SelectItem value="BCA">BCA</SelectItem>
                            <SelectItem value="BBA">BBA</SelectItem>
                            <SelectItem value="BCOM">BCOM</SelectItem>
                            <SelectItem value="BSC">BSC</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Semester</label>
                        <Select value={selectedSemester} onValueChange={(value) => {
                          console.log("Course changed:", value);
                          setSelectedSemester(value);
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="All Semesters" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Semesters</SelectItem>
                            <SelectItem value="1">1st Semester</SelectItem>
                            <SelectItem value="2">2nd Semester</SelectItem>
                            <SelectItem value="3">3rd Semester</SelectItem>
                            <SelectItem value="4">4th Semester</SelectItem>
                            <SelectItem value="5">5th Semester</SelectItem>
                            <SelectItem value="6">6th Semester</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Type</label>
                        <Select value={selectedType} onValueChange={(value) => {
                          console.log("Course changed:", value);
                          setSelectedType(value);
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Notes/Question Papers" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="Notes">Notes</SelectItem>
                            <SelectItem value="PYQP">Previous Year Question Papers</SelectItem>
                            <SelectItem value="Internal QP">Internal Question Papers</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Results Count */}
              <div className="mb-6 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing{" "}
                  <span className="font-semibold text-foreground">
                    {filteredNotes.length}
                  </span>{" "}
                  results
                </p>
              </div>

              {/* Notes Grid & Empty State */}
              {filteredNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-card rounded-lg border border-dashed border-border mt-4">
                  <FileText className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-1">No notes found</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    We couldn't find any study materials matching your search or filters. Try adjusting your query or filters.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {displayedNotes.map((note, index) => (
                      <motion.div
                        key={note.noteId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                      >
                        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row gap-4">

                              {/* PDF Icon */}
                              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600 dark:text-indigo-400" />
                              </div>

                              {/* Note Info */}
                              <div className="flex-1 min-w-0">

                                <h3 className="font-semibold text-base sm:text-lg mb-2 line-clamp-2">
                                  {note.title}
                                </h3>

                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                  <Badge className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border-0">
                                    {note.course}
                                  </Badge>

                                  <Badge variant="outline" className="text-xs">
                                    Semester {note.semester}
                                  </Badge>

                                  <span className="text-sm text-muted-foreground line-clamp-1">
                                    {note.subject}
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">

                                  <span className="flex items-center gap-1">
                                    <User className="w-4 h-4" />
                                    {userNames[note.uploadedBy] || "Loading..."}
                                  </span>

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

                              {/* Actions */}
                              <div className="flex sm:flex-col gap-2">

                                <Link
                                  to={`/pdf-preview/${note.noteId}`}
                                  className="flex-1 sm:flex-initial"
                                >
                                  <Button variant="outline" className="w-full">
                                    <Eye className="w-4 h-4 mr-2" />
                                    Preview
                                  </Button>
                                </Link>

                                {note.fileUrl ? (
                                  <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90"
                                    onClick={() =>
                                      handleDownload(
                                        note.noteId,
                                        note.fileUrl,
                                        note.title
                                      )
                                    }>
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                  </Button>
                                ) : (
                                  <Button
                                    disabled
                                    className="w-full bg-gray-400"
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
                    ))}
                  </div>

                  {/* Infinite Scroll Trigger */}
                  {hasMore && (
                    <div ref={loadMoreRef} className="h-10 flex items-center justify-center mt-6">
                      <div className="w-6 h-6 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                    </div>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

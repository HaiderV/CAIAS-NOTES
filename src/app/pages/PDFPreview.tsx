import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import Footer from "../components/Footer";
import { useParams } from "react-router-dom";
import { doc, getDoc, runTransaction, serverTimestamp, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { auth, db } from "../../../backend/Auth/firebase";
import {
  ArrowLeft,
  Download,
  Bookmark,
  FileText,
  Calendar,
  Star,
} from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PDFPreview() {

  const navigate = useNavigate();
  const { noteId } = useParams();

  //note data fetch 
  const [note, setNote] = useState<any>(null);

  useEffect(() => {
    const fetchNote = async () => {
      if (!noteId) return;

      const noteRef = doc(db, "notes", noteId);
      const noteSnap = await getDoc(noteRef);

      if (noteSnap.exists()) {
        setNote({
          id: noteSnap.id,
          ...noteSnap.data(),
        });
      }
    };

    fetchNote();
  }, [noteId]);

  // Uploader's Data
  const [uploader, setUploader] = useState<any>(null);
  useEffect(() => {
    const fetchUploader = async () => {
      if (!note) return;
      const uploaderRef = doc(db, "users", note?.uploadedBy);
      const uploaderSnap = await getDoc(uploaderRef);
      if (uploaderSnap.exists()) {
        setUploader({
          id: uploaderSnap.id,
          ...uploaderSnap.data(),
        });
      }
    };
    fetchUploader();
  }, [note?.uploadedBy]);

  const imageUrl =
    uploader?.avatarUrl &&
      uploader.avatarUrl !== "null" &&
      uploader.avatarUrl.trim() !== ""
      ? uploader.avatarUrl
      : uploader?.photoURL;

  const getInitials = () => {
    if (uploader?.firstName && uploader?.lastName) {
      return (uploader.firstName[0] + uploader.lastName[0]).toUpperCase();
    }
    return uploader?.email?.slice(0, 2).toUpperCase() || "U";
  };

  //download Count function
  const handleDownloadCount = async () => {
    if (!user || !note?.id) return false;

    try {
      let incremented = false;

      await runTransaction(db, async (transaction) => {
        const noteRef = doc(db, "notes", note.id);
        const downloadRef = doc(db, "notes", note.id, "downloads", user.uid);
        const userRef = doc(db, "users", user.uid);

        const existingDownload = await transaction.get(downloadRef);

        if (existingDownload.exists()) {
          return;
        }

        const noteDoc = await transaction.get(noteRef);

        if (!noteDoc.exists()) {
          throw new Error("Note not found.");
        }

        transaction.update(noteRef, {
          downloadCount:
            (noteDoc.data().downloadCount || 0) + 1,
        });

        transaction.set(downloadRef, {
          userId: user.uid,
          downloadedAt: serverTimestamp(),
        });

        transaction.set(
          userRef,
          {
            downloadedNotes: arrayUnion(note.id),
          },
          { merge: true }
        );

        incremented = true;
      });

      if (incremented) {
        setNote((prev: any) => ({
          ...prev,
          downloadCount: (prev?.downloadCount || 0) + 1,
        }));
      }

      return incremented;
    } catch (error: any) {
      toast.error(error.message || "Something went wrong")
      return false;
    }
  };

  //download pdf function
  const handleDownload = async () => {
    if (!note?.fileUrl) return;
    try {
      const link = document.createElement("a");
      link.href = note.fileUrl;
      link.download = `${note?.title || "document"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      await handleDownloadCount();
      toast.success("Downloaded Successfully!")
    } catch (error: any) {
      toast.error(error.message || "Failed to Download")
    }
  };

  //Rating 
  const [userRating, setUserRating] = useState(0);

  const user = auth.currentUser;

  const [hasRated, setHasRated] = useState(false);

  const [canRate, setCanRate] = useState<any>(true);

  useEffect(() => {
    const checkRating = async () => {
      if (!user || !note?.id) {
        setCanRate(false);
        return;
      }
      // Only allow rating section for users other than the uploader
      setCanRate(user.uid !== note.uploadedBy);

      const ratingRef = doc(
        db,
        "notes",
        note.id,
        "ratings",
        user.uid
      );

      const ratingSnap = await getDoc(ratingRef);

      if (ratingSnap.exists()) {
        setHasRated(true);
        setUserRating(ratingSnap.data().rating);
      }
    };

    checkRating();
  }, [user, note]);

  const handleSubmitRating = async () => {
    if (!user) return;

    try {
      await runTransaction(db, async (transaction) => {
        const noteRef = doc(db, "notes", note.id);

        const ratingRef = doc(
          db,
          "notes",
          note.id,
          "ratings",
          user.uid
        );

        const existingRating = await transaction.get(ratingRef);

        if (existingRating.exists()) {
          throw new Error("You have already rated this note.");
        }

        const noteDoc = await transaction.get(noteRef);

        if (!noteDoc.exists()) {
          throw new Error("Note not found.");
        }

        transaction.update(noteRef, {
          ratingSum:
            (noteDoc.data().ratingSum || 0) + userRating,
          ratingCount:
            (noteDoc.data().ratingCount || 0) + 1,
        });

        transaction.set(ratingRef, {
          rating: userRating,
          userId: user.uid,
          ratedAt: serverTimestamp(),
        });
      });

      setHasRated(true);

      toast.success("Rating Submitted Successfully!");

      setNote((prev: any) => {
        if (!prev) return prev;

        return {
          ...prev,
          ratingSum: (prev.ratingSum || 0) + userRating,
          ratingCount: (prev.ratingCount || 0) + 1,
        };
      });

    } catch (error) {
      toast.error("Failed something went wrong");
    }
  };

  // Save Notes
  const [isSaved, setIsSaved] = useState(false);
  const handleToggleSave = async () => {
    if (!user || !note?.id) return;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    const noteRef = doc(db, "notes", note.id);
    const noteSnap = await getDoc(noteRef);

    const noteData = noteSnap.data();

    if (noteData) {
      setCanRate(user.uid !== noteData.userId);
    }

    if (isSaved) {
      await updateDoc(userRef, {
        savedNotes: arrayRemove(note.id),
      });

      setIsSaved(false);
      toast.success("Removed from saved notes");
    } else {
      await updateDoc(userRef, {
        savedNotes: arrayUnion(note.id),
      });

      setIsSaved(true);
      toast.success("Note saved");
    }
  };

  useEffect(() => {

    const checkSavedStatus = async () => {
      if (!user || !note?.id) return;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const savedNotes = userSnap.data().savedNotes || [];
        setIsSaved(savedNotes.includes(note.id));
      }
    };

    checkSavedStatus();
  }, [user, note?.id]);

  //pdf preview
  const containerRef = useRef<HTMLDivElement>(null);
  // Default to 300 to safely stay within small mobile screens on first paint
  const [containerWidth, setContainerWidth] = useState<number>(300);

  useEffect(() => {
    if (!containerRef.current) return;

    const handleResize = (entries: ResizeObserverEntry[]) => {
      for (let entry of entries) {
        // Use clientWidth to measure the inner width excluding scrollbars and borders
        const element = entry.target as HTMLElement;
        const width = element.clientWidth;

        if (width > 0) {
          // Enforce the medium size cap (e.g., 400px looks ideal inside a card padding)
          setContainerWidth(Math.min(width, 400));
        }
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);
  return (
    <div className="min-h-screen bg-background overflow-x-hidden antialiased selection:bg-indigo-500/30">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Go Back</span>
              <span className="sm:hidden">Back</span>
            </Button>

            <div className="flex items-center gap-2 max-w-full">
              <Button
                variant={isSaved ? "default" : "outline"}
                size="sm"
                className="h-8 px-3 text-xs shrink-0"
                onClick={handleToggleSave}
              >
                <Bookmark
                  className={`w-3.5 h-3.5 mr-1 ${isSaved ? "fill-current" : ""}`}
                />
                {isSaved ? "Saved" : "Save"}
              </Button>

              <Button
                size="sm"
                className="h-8 px-2.5 sm:px-3 text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 active:scale-90 transition-all duration-150 shrink-0"
                onClick={handleDownload}
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                <span className="hidden sm:inline">Download</span>
                <span className="sm:hidden">Get</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6 w-full min-w-0 overflow-hidden">

            {/* Document Info Card */}
            <Card className="border shadow-md md:shadow-lg overflow-hidden w-full">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 w-full">
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                      <Badge className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border-0 max-w-full text-xs truncate">
                        {note?.course}
                      </Badge>
                      <Badge variant="outline" className="text-xs shrink-0">Sem {note?.semester}</Badge>
                      <Badge variant="outline" className="text-xs shrink-0">{note?.noteType}</Badge>
                    </div>
                    <CardTitle className="text-lg sm:text-xl md:text-2xl mb-2 font-bold tracking-tight text-foreground break-words overflow-wrap-anywhere whitespace-normal">
                      {note?.title}
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base text-muted-foreground break-words overflow-wrap-anywhere whitespace-normal">
                      {note?.subject}
                    </CardDescription>
                  </div>

                  {/* Rating Badge */}
                  <div className="flex items-center gap-1 self-start sm:self-auto shrink-0 bg-yellow-500/10 dark:bg-yellow-500/20 px-2.5 py-1 rounded-full border border-yellow-500/20">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold text-xs sm:text-sm text-yellow-700 dark:text-yellow-400">
                      {note?.ratingCount > 0
                        ? (note?.ratingSum / note?.ratingCount).toFixed(1)
                        : "Not rated"}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4 w-full">
                {/* Meta Icons Row */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground border-t border-border/60 pt-4">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <FileText className="w-4 h-4 text-muted-foreground/80" />
                    <span>{note?.fileSize}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Download className="w-4 h-4 text-muted-foreground/80" />
                    <span>{note?.downloadCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Calendar className="w-4 h-4 text-muted-foreground/80" />
                    <span>
                      {note?.createdAt ? new Date(note?.createdAt).toLocaleDateString() : ""}
                    </span>
                  </div>
                </div>

                {/* Description Text */}
                <div className="pt-4 border-t border-border/60 w-full">
                  <h4 className="font-semibold text-sm sm:text-base mb-1.5 text-foreground">Description</h4>
                  <p className="text-sm text-muted-foreground break-words overflow-wrap-anywhere whitespace-normal leading-relaxed">
                    {note?.description || "No Description from the uploader"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* PDF Viewer Card */}
            <Card className="overflow-hidden border shadow-sm w-full">
              <CardContent className="p-0 w-full">
                <div className="bg-muted/30 p-2 sm:p-4 w-full flex justify-center items-center overflow-x-hidden">
                  <div className="w-full max-w-lg overflow-hidden flex justify-center">
                    {note?.fileUrl ? (
                      <div ref={containerRef} className="w-full max-w-full rounded-lg overflow-hidden border bg-background shadow-inner">
                        <Document
                          file={note.fileUrl}
                          loading={
                            <div className="h-48 sm:h-64 flex items-center justify-center text-sm text-muted-foreground">
                              Loading PDF Preview...
                            </div>
                          }
                          className="flex justify-center w-full"
                        >
                          <Page
                            pageNumber={1}
                            width={containerWidth || 300}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            className="max-w-full block h-auto"
                          />
                        </Document>
                      </div>
                    ) : (
                      <div className="h-48 sm:h-64 w-full flex items-center justify-center rounded-lg border border-dashed bg-muted/20">
                        <FileText className="w-10 h-10 text-muted-foreground/60" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 border-t border-border bg-background w-full">
                  <Button
                    onClick={handleDownload}
                    className="w-full text-sm font-medium transition-all"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Rating Section Card */}
            {canRate && (
              <Card className="border shadow-sm w-full">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 w-full">

                    <div className="w-full min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-foreground">Rate this Note</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        Help other students by sharing your feedback.
                      </p>

                      <div className="mt-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => !hasRated && setUserRating(star)}
                              disabled={hasRated}
                              type="button"
                              className={`transition-transform duration-100 p-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md ${hasRated ? "cursor-not-allowed opacity-50" : "hover:scale-110 active:scale-95"
                                }`}
                            >
                              <Star
                                className={`w-7 h-7 sm:w-8 sm:h-8 shrink-0 transition-colors ${star <= userRating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground"
                                  }`}
                              />
                            </button>
                          ))}
                        </div>

                        <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                          {hasRated
                            ? `You already rated this note ${userRating}/5 ⭐`
                            : "Select a rating and submit"}
                        </p>
                      </div>
                    </div>

                    <div className="w-full md:w-auto shrink-0">
                      <Button
                        onClick={handleSubmitRating}
                        disabled={!userRating || hasRated}
                        className="w-full md:w-auto"
                      >
                        {hasRated ? "Rating Submitted" : "Submit Rating"}
                      </Button>
                    </div>

                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Uploader Info */}
            <Card
              className="border-0 shadow-lg cursor-pointer
                         transition-all duration-200
                         hover:shadow-xl hover:-translate-y-1
                         active:scale-[0.98]"
              onClick={() => navigate(`/profile/${uploader?.id}`)}
            >
              <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-2">
                <CardTitle className="text-base sm:text-lg">Uploaded By</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                <div className="flex items-center gap-3">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Avatar"
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border border-border shadow-sm shrink-0"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-base sm:text-lg font-bold shadow-sm shrink-0">
                      {getInitials()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-sm sm:text-base truncate text-foreground">
                      {uploader?.firstName} {uploader?.lastName}
                    </h4>

                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {uploader?.course} Sem {uploader?.semester}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

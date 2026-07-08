import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Progress } from "../components/ui/progress";
import Footer from "../components/Footer";
import { toast } from "sonner";
import {
  ArrowLeft,
  Upload,
  FileText,
  X,
  Check,
  AlertCircle,
  Loader2,
  Cloud,
  Database,
  Sparkles,
  Server,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import { getAuth } from "firebase/auth";

const auth = getAuth();

export default function UploadNotes() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Loading & processing stages state
  const [uploadStage, setUploadStage] = useState<"idle" | "uploading" | "converting" | "storing" | "finalizing">("idle");
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");
  const [description, setDescription] = useState("");
  const [noteType, setNoteType] = useState("");
  const [uploadCount, setUploadCount] = useState(0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validateAndSetFile = (selectedFile: File | undefined) => {
    if (!selectedFile) return;

    // Check file extension (.pdf, .docx, .pptx, .jpg, .jpeg, .png, .webp, .txt)
    const allowedExtensions = /(\.pdf|\.docx|\.pptx|\.jpg|\.jpeg|\.png|\.webp|\.txt)$/i;
    if (!allowedExtensions.test(selectedFile.name)) {
      toast.error("Unsupported file format! Please upload PDF, Word, PowerPoint, Text, or Image files.");
      return;
    }

    // Check file size (30MB limit)
    if (selectedFile.size > 30 * 1024 * 1024) {
      toast.error("File is exceeding the upload criteria of 30MB limit.");
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    validateAndSetFile(droppedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    validateAndSetFile(selectedFile);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      return;
    }

    try {
      setIsUploading(true);
      setUploadStage("uploading");
      setAnimatedProgress(0);
      setElapsedSeconds(0);
      setUploadProgress(0);
      setUploadError(null);

      const formData = new FormData();

      formData.append("file", file);

      formData.append("title", title);
      formData.append("subject", subject);
      formData.append("course", course);
      formData.append("semester", semester);
      formData.append("description", description);
      formData.append("noteType", noteType);

      formData.append("uploadedBy", auth.currentUser?.uid || "");

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },

          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );

              setUploadProgress(percent);
            }
          },
        }
      );

      toast.success("Uploaded Successfully!");

      setUploadComplete(true);

      // Reset form fields immediately
      setFile(null);
      setTitle("");
      setSubject("");
      setCourse("");
      setSemester("");
      setDescription("");
      setNoteType("");
      setUploadProgress(0);
    } catch (error: any) {
      let rawMessage = error.response?.data?.message || error.message || "An error occurred while uploading your note.";
      if (typeof rawMessage === "string") {
        rawMessage = rawMessage
          .replace(/https?:\/\/[^\s/$.?#].[^\s]*/gi, "the server")
          .replace(/localhost:\d+/gi, "the server");
      }
      
      const toastMessage = error.message 
        ? error.message.replace(/https?:\/\/[^\s/$.?#].[^\s]*/gi, "the server") 
        : "Something went wrong";

      toast.error(toastMessage);
      setUploadError(rawMessage);
    } finally {
      setIsUploading(false);
      setUploadStage("idle");
    }
  };

  // Timer for elapsed seconds
  useEffect(() => {
    if (!isUploading) {
      setElapsedSeconds(0);
      return;
    }
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isUploading]);

  // Main progress animation logic
  useEffect(() => {
    if (!isUploading) {
      setAnimatedProgress(0);
      setUploadStage("idle");
      return;
    }

    const interval = setInterval(() => {
      setAnimatedProgress((prev) => {
        if (uploadStage === "uploading") {
          // If we have actual upload progress from axios, match it
          if (uploadProgress > 0) {
            if (uploadProgress >= 100) {
              setUploadStage("converting");
              return 100;
            }
            // Smoothly approach the actual upload progress
            return prev + (uploadProgress - prev) * 0.15;
          } else {
            // If uploadProgress is stuck at 0 (or browser isn't reporting),
            // smoothly climb towards 90%
            if (prev < 90) {
              const diff = 90 - prev;
              const step = Math.max(0.4, diff * 0.05);
              const nextVal = prev + step;
              if (nextVal >= 89.9) {
                setUploadStage("converting");
                return 90;
              }
              return nextVal;
            }
            return prev;
          }
        } else if (uploadStage === "converting") {
          // Creep progress from 90% to 95%
          if (prev < 95) {
            return prev + 0.1;
          }
          return prev;
        } else if (uploadStage === "storing") {
          // Creep progress from 95% to 98%
          if (prev < 98) {
            return prev + 0.05;
          }
          return prev;
        } else if (uploadStage === "finalizing") {
          // Creep progress from 98% to 99.5%
          if (prev < 99.5) {
            return prev + 0.02;
          }
          return prev;
        }
        return prev;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isUploading, uploadProgress, uploadStage]);

  // Handle stage transitions based on time when upload is 100% or estimated.
  // Converting -> Storing -> Finalizing
  useEffect(() => {
    if (!isUploading || uploadStage === "idle" || uploadStage === "uploading") return;

    let delay = 6000; // 6 seconds for conversion phase
    if (uploadStage === "storing") {
      delay = 8000; // 8 seconds for cloud storage upload phase
    } else if (uploadStage === "finalizing") {
      delay = 5000; // 5 seconds for database finalize phase
    }

    const timer = setTimeout(() => {
      if (uploadStage === "converting") {
        setUploadStage("storing");
      } else if (uploadStage === "storing") {
        setUploadStage("finalizing");
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [uploadStage, isUploading]);

  return (
    <div className="min-h-dvh bg-background overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>

            <div className="flex items-center gap-2">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">N</span>
                </div>
                <span className="hidden sm:inline font-bold text-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  CAIAS NOTES
                </span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {uploadComplete ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <Card className="border-0 shadow-xl">
              <CardContent className="pt-12 pb-12">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Upload Successful!</h2>
                <p className="text-muted-foreground mb-8">
                  Your notes have been uploaded and are now available for other students.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/dashboard">
                    <Button variant="outline" size="lg">
                      Go to Dashboard
                    </Button>
                  </Link>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90"
                    onClick={() => {
                      setUploadComplete(false);
                      setFile(null);
                      setUploadProgress(0);
                    }}
                  >
                    Upload Another
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            <div className="mb-8 pl-4 sm:pl-0">
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">Upload Notes</h1>
              <p className="text-muted-foreground">Share your study materials with fellow students</p>
            </div>

            <Card className="border-0 shadow-xl relative overflow-hidden">
              <AnimatePresence>
                {isUploading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-background/90 dark:bg-background/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 sm:p-10 text-center"
                  >
                    {/* Glowing circular progress bar */}
                    <div className="relative w-32 h-32 flex items-center justify-center mb-6">
                      <svg className="w-full h-full transform -rotate-90">
                        <defs>
                          <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#4f46e5" />
                            <stop offset="50%" stopColor="#9333ea" />
                            <stop offset="100%" stopColor="#2563eb" />
                          </linearGradient>
                        </defs>
                        <circle
                          cx="64"
                          cy="64"
                          r="50"
                          className="stroke-muted/30 dark:stroke-muted/20"
                          strokeWidth="8"
                          fill="transparent"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="50"
                          stroke="url(#progressGrad)"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={314.159}
                          strokeDashoffset={314.159 - (Math.min(100, Math.max(0, animatedProgress)) / 100) * 314.159}
                          strokeLinecap="round"
                          style={{
                            filter: "drop-shadow(0 0 8px rgba(99, 102, 241, 0.4))",
                            transition: "stroke-dashoffset 0.15s ease-out"
                          }}
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-foreground">
                          {Math.round(animatedProgress)}%
                        </span>
                        <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-widest mt-0.5">
                          {uploadStage}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-1">
                      Processing Your Note
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm mb-6">
                      Your note is being uploaded, converted, and secured. Please do not close or refresh this page.
                    </p>

                    {/* Step Tracker */}
                    <div className="w-full max-w-xs space-y-3 mx-auto text-left">
                      {[
                        {
                          key: "uploading",
                          label: "Transmitting file to server",
                          status:
                            uploadStage === "uploading"
                              ? "active"
                              : uploadStage !== "idle"
                                ? "completed"
                                : "pending",
                          icon: Upload,
                        },
                        {
                          key: "converting",
                          label: "Converting to PDF format",
                          status:
                            uploadStage === "converting"
                              ? "active"
                              : ["storing", "finalizing"].includes(uploadStage)
                                ? "completed"
                                : "pending",
                          icon: Sparkles,
                        },
                        {
                          key: "storing",
                          label: "Uploading to Google Drive",
                          status:
                            uploadStage === "storing"
                              ? "active"
                              : ["finalizing"].includes(uploadStage)
                                ? "completed"
                                : "pending",
                          icon: Cloud,
                        },
                        {
                          key: "finalizing",
                          label: "Saving database records",
                          status: uploadStage === "finalizing" ? "active" : "pending",
                          icon: Database,
                        },
                      ].map((step) => {
                        const isActive = step.status === "active";
                        const isCompleted = step.status === "completed";

                        return (
                          <div
                            key={step.key}
                            className={`flex items-center gap-3 transition-all duration-300 ${isActive
                                ? "opacity-100 font-semibold scale-102"
                                : isCompleted
                                  ? "opacity-75 text-muted-foreground"
                                  : "opacity-35 text-muted-foreground"
                              }`}
                          >
                            <div className="flex-shrink-0">
                              {isCompleted ? (
                                <div className="w-6 h-6 rounded-full bg-green-500/10 border border-green-500 flex items-center justify-center text-green-500 shadow-[0_0_6px_rgba(34,197,94,0.2)]">
                                  <Check className="w-3.5 h-3.5" />
                                </div>
                              ) : isActive ? (
                                <div className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500 flex items-center justify-center text-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.2)]">
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-full border border-muted/50 flex items-center justify-center text-muted-foreground/60">
                                  <step.icon className="w-3.5 h-3.5" />
                                </div>
                              )}
                            </div>
                            <span className={`text-sm ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Render Free-tier Wake up Helper */}
                    <AnimatePresence>
                      {elapsedSeconds > 12 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="mt-6 p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/40 text-indigo-900 dark:text-indigo-200 text-xs text-center flex items-start gap-3 max-w-sm mx-auto shadow-sm"
                        >
                          <Server className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5 animate-pulse" />
                          <p className="text-left leading-normal font-medium">
                            The server is waking up or processing. Since the backend is hosted on a free-tier Render server, this first request might take a minute. Thank you for your patience! ☕
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
              <CardHeader>
                <CardTitle>Upload Details</CardTitle>
                <CardDescription>Fill in the information about your notes</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpload} className="space-y-6">
                  {/* File Upload */}
                  <div>
                    <Label>Upload Study Material *</Label>
                    <div
                      className={`mt-2 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/20"
                        : "border-border hover:border-indigo-400"
                        }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      {file ? (
                        <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="w-8 h-8 text-indigo-600" />
                            <div className="text-left">
                              <p className="font-medium">{file.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setFile(null)}
                          >
                            <X className="w-5 h-5" />
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="mb-2">
                            <span className="font-semibold text-indigo-600 hover:underline cursor-pointer">
                              Click to upload
                            </span>{" "}
                            or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground leading-normal">
                            PDF, Word, PPTX, Text or Image formats (Max 30MB)
                          </p>
                          <input
                            type="file"
                            accept=".pdf,.docx,.pptx,.jpg,.jpeg,.png,.webp,.txt"
                            className="hidden"
                            id="file-upload"
                            onChange={handleFileChange}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="mt-4"
                            onClick={() => document.getElementById("file-upload")?.click()}
                          >
                            Select File
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Data Structures - Complete Notes"
                      required
                      className="mt-2"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  {/* Subject */}
                  <div>
                    <Label htmlFor="subject">Subject *</Label>

                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g., Data Structures & Algorithms"
                      required
                      className="mt-2"
                    />
                  </div>

                  {/* Note Type */}
                  <div>
                    <Label htmlFor="noteType">Note Type *</Label>

                    <Select
                      value={noteType}
                      onValueChange={setNoteType}
                      required
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select note type" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="Notes">Notes</SelectItem>
                        <SelectItem value="PYQP">PYQP</SelectItem>
                        <SelectItem value="Internal QP">Internal QP</SelectItem>
                        <SelectItem value="Lab">Lab</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Course and Semester */}
                  <div className="grid sm:grid-cols-2 gap-4">

                    {/* Course */}
                    <div>
                      <Label htmlFor="course">Course *</Label>

                      <Select
                        value={course}
                        onValueChange={setCourse}
                        required
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select course" />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="BCA">BCA</SelectItem>
                          <SelectItem value="BBA">BBA</SelectItem>
                          <SelectItem value="BCOM">BCOM</SelectItem>
                          <SelectItem value="BSC">BSC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Semester */}
                    <div>
                      <Label htmlFor="semester">Semester *</Label>

                      <Select
                        value={semester}
                        onValueChange={setSemester}
                        required
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select semester" />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="1">1st Semester</SelectItem>
                          <SelectItem value="2">2nd Semester</SelectItem>
                          <SelectItem value="3">3rd Semester</SelectItem>
                          <SelectItem value="4">4th Semester</SelectItem>
                          <SelectItem value="5">5th Semester</SelectItem>
                          <SelectItem value="6">6th Semester</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="description">Description</Label>

                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Provide a brief description of the content, topics covered, etc."
                      className="mt-2 min-h-24"
                    />
                  </div>



                  {/* Guidelines */}
                  <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <CardTitle className="text-sm text-blue-900 dark:text-blue-100">
                            Upload Guidelines
                          </CardTitle>
                          <div className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                            <ul className="space-y-1 list-disc list-inside">
                              <li>Only upload notes and documents that you created or are authorized to share</li>
                              <li>Make sure your PDF is clear, readable, and contains accurate content</li>
                              <li>Uploading copyrighted textbooks, premium resources, or pirated material is strictly prohibited</li>
                              <li>Do not upload harmful, offensive, misleading, or inappropriate content</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Error Message */}
                  {uploadError && (
                    <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                      <CardHeader className="pb-3 pt-3">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <CardTitle className="text-sm text-red-900 dark:text-red-100">
                              Upload Failed
                            </CardTitle>
                            <CardDescription className="text-xs text-red-700 dark:text-red-300 mt-1">
                              {uploadError}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  )}

                  {/* Submit Button */}
                  <div className="flex flex-col sm:flex-row gap-4">

                    <div className="flex-1">
                      <Button
                        type="submit"
                        size="lg"
                        className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:opacity-90"
                        disabled={!file || isUploading}
                      >
                        <Upload className="w-5 h-5 mr-2" />
                        {isUploading ? "Uploading..." : "Upload Notes"}
                      </Button>
                    </div>

                    <Link to="/dashboard" className="flex-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className="w-full"
                      >
                        Cancel
                      </Button>
                    </Link>

                  </div>
                </form>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}

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

    // Check file size (10MB limit)
    if (selectedFile.size > 30 * 1024 * 1024) {
      toast.error("File is exceeding the upload criteria of 10MB limit.");
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
      toast.error(error.message || "Something went wrong");
      setUploadError(
        error.response?.data?.message ||
        error.message ||
        "An error occurred while uploading your note."
      );
    } finally {
      setIsUploading(false);
    }
  };

  //upload message
  const uploadMessages = [
    "Uploading your notes...",
    "This may take a few seconds...",
    "The server is waking up...",
    "Our backend is hosted on Render and may need a moment to start.",
    "Almost there..."
  ];

  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!isUploading) {
      setMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % uploadMessages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isUploading]);

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

            <Card className="border-0 shadow-xl">
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

                  {/* Upload Progress */}
                  {isUploading && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>

                      <Progress value={uploadProgress} className="h-2" />

                      <div className="h-6 overflow-hidden">
                        <AnimatePresence mode="wait">
                          <motion.p
                            key={messageIndex}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                            className="text-sm text-muted-foreground"
                          >
                            {uploadMessages[messageIndex]}
                          </motion.p>
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

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

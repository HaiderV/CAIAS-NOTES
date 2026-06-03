import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useTheme } from "next-themes";
import Footer from "../components/Footer";
import { useState, useEffect } from "react";
import { onAuthStateChanged, EmailAuthProvider, reauthenticateWithCredential, updatePassword, deleteUser, GoogleAuthProvider, reauthenticateWithPopup } from "firebase/auth";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, deleteDoc, arrayRemove } from "firebase/firestore";
import { auth, db } from "../../../backend/Auth/firebase";
import { toast } from "sonner";
import ConfirmationPopup from "../components/ui/Confirmation";
import axios from "axios";
import {
  ArrowLeft,
  User,
  Lock,
  Info,
  Cog,
  Moon,
  Sun,
  Loader2,
  Bug,
  X
} from "lucide-react";
import emailjs from "@emailjs/browser";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile Form States
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  //Password Reset
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Delete Account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  // Delete Notes
  const [showDeleteNotesConfirm, setShowDeleteNotesConfirm] = useState(false);
  const [isDeletingNotes, setIsDeletingNotes] = useState(false);

  //bug report 
  const [showBugReportForm, setShowBugReportForm] = useState(false);
  const [bugTitle, setBugTitle] = useState("");
  const [bugDescription, setBugDescription] = useState("");

  //bug report email function
  const user = auth.currentUser;
  const handleBugSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    try {
      setLoading(true);

      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          subject: bugTitle,
          description: bugDescription,
          user_name: user?.displayName || "Anonymous",
          user_email: user?.email || "Not provided",
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );

      toast.success("Bug Reported Successfully!");
      toast.info("Thank You for Reporting a Bug!");

      setBugTitle("");
      setBugDescription("");
      setShowBugReportForm(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to send bug report");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {

      setIsDeletingAccount(true);

      const user = auth.currentUser;

      if (!user) {
        toast.error("User not logged in");
        return;
      }

      // =========================
      // RE-AUTHENTICATE USER
      // =========================

      const provider = user.providerData[0]?.providerId;

      if (provider === "password") {
        if (!deletePassword) {
          toast.error("Password is required to delete your account");
          return;
        }

        const credential = EmailAuthProvider.credential(
          user.email || "",
          deletePassword
        );

        await reauthenticateWithCredential(user, credential);

      } else if (provider === "google.com") {

        const googleProvider = new GoogleAuthProvider();

        await reauthenticateWithPopup(user, googleProvider);
      }

      // =========================
      // DELETE USER NOTES
      // =========================

      const notesQuery = query(
        collection(db, "notes"),
        where("uploadedBy", "==", user.uid)
      );

      const snapshot = await getDocs(notesQuery);

      for (const noteDoc of snapshot.docs) {

        const noteData = noteDoc.data();

        try {

          // =========================
          // DELETE CLOUDINARY FILE
          // =========================

          if (noteData.publicId) {

            const response = await axios.post("http://localhost:5000/api/delete-note-file", {
              publicId: noteData.publicId,
            });

          }

          // =========================
          // DELETE FIRESTORE NOTE
          // =========================

          await deleteDoc(doc(db, "notes", noteDoc.id));

        } catch (error: any) {

          toast.error(error.message || "Failed to delete note");
        }
      }

      // =========================
      // DELETE USER PROFILE
      // =========================

      await deleteDoc(doc(db, "users", user.uid));

      // =========================
      // DELETE FIREBASE AUTH USER
      // =========================

      await deleteUser(user);

      toast.success("Account deleted successfully");

      setShowDeleteConfirm(false);
      navigate("/");

    } catch (error: any) {

      toast.error(error.message);

    } finally {

      setIsDeletingAccount(false);
    }
  };

  const handleDeleteNotes = async () => {
    //check
    try {
      setIsDeletingNotes(true);
      const user = auth.currentUser;
      if (!user) {
        toast.error("User not logged in");
        return;
      }

      const notesQuery = query(
        collection(db, "notes"),
        where("uploadedBy", "==", user.uid)
      );
      //check
      const snapshot = await getDocs(notesQuery);
      console.log("Found notes to delete:", snapshot.docs.length);

      //deleting instances from all other users uploadedNotes and downloadedNotes array
      for (const noteDoc of snapshot.docs) {
        const allUsersSnapshot = await getDocs(collection(db, "users"));

        const cleanupPromises = allUsersSnapshot.docs.map(async (userDoc) => {
          const userData = userDoc.data();

          const updates: any = {};

          if (userData.savedNotes?.includes(noteDoc.id)) {
            updates.savedNotes = arrayRemove(noteDoc.id);
          }

          if (userData.downloadedNotes?.includes(noteDoc.id)) {
            updates.downloadedNotes = arrayRemove(noteDoc.id);
          }

          if (Object.keys(updates).length > 0) {
            await updateDoc(userDoc.ref, updates);
          }
        });

        await Promise.all(cleanupPromises);
        const noteData = noteDoc.data();
        console.log("Deleting note:", noteDoc.id);
        //deleting cloudinary files related to the note
        try {
          if (noteData.publicId) {
            console.log("Deleting Cloudinary file:", noteData.publicId);
            const response = await axios.post("http://localhost:5000/api/delete-note-file", {
              publicId: noteData.publicId,
            });
            console.log("Cloudinary delete success:", response.data);
          }
          //deleting rating related to that note
          const ratingsRef = collection(db, "notes", noteDoc.id, "ratings");

          const ratingsSnapshot = await getDocs(ratingsRef);

          const ratingDeletePromises = ratingsSnapshot.docs.map((ratingDoc) =>
            deleteDoc(ratingDoc.ref)
          );

          await Promise.all(ratingDeletePromises);

          console.log(
            `Deleted ${ratingsSnapshot.docs.length} ratings for note ${noteDoc.id}`
          );
          //deleting the note document
          await deleteDoc(doc(db, "notes", noteDoc.id));
          console.log("Firestore note deleted:", noteDoc.id);

          const userRef = doc(db, "users", auth.currentUser?.uid || "");
          await updateDoc(userRef, {
            uploadedNotes: [],
          });
          console.log("Firestore uploadsCount updated:");
        } catch (error) {
          console.error("Error deleting note:", noteDoc.id, error);
        }
      }

      toast.success("All uploaded notes deleted successfully!");
      setShowDeleteNotesConfirm(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to delete notes");
    } finally {
      setIsDeletingNotes(false);
    }
  };

  const handlePasswordUpdate = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        toast.error("User not logged in");
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
      if (newPassword.length < 6) {
        toast.error("Password should be atleast 6 characters");
        return;
      }
      const credential = EmailAuthProvider.credential(
        user.email || "",
        currentPassword
      );

      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      toast.success("Password updated successfully!");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setEmail(user.email || "");
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            setFirstName(data.firstName || "");
            setLastName(data.lastName || "");
            setCourse(data.course?.toLowerCase() || "");
            setSemester(data.semester?.toString() || "");
            setBio(data.bio || "");
            setAvatarUrl(data.avatarUrl || user.photoURL || "");
          }
        } catch (err) {
          toast.error("Failed to load profile details");
        } finally {
          setPageLoading(false);
        }
      } else {
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleSaveChanges = async () => {
    if (!currentUser) return;
    if (!firstName.trim()) {
      toast.error("First name is required");
      return;
    }
    if (!lastName.trim()) {
      toast.error("Last name is required");
      return;
    }
    if (!course) {
      toast.error("Course selection is required");
      return;
    }
    if (!semester) {
      toast.error("Semester selection is required");
      return;
    }

    setSaving(true);
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        course: course.toUpperCase(),
        semester: parseInt(semester),
        bio: bio.trim(),
        avatarUrl: avatarUrl,
        updatedAt: new Date().toISOString(),
      });
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    if (firstName && lastName) {
      return (firstName[0] + lastName[0]).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase() || "U";
  };

  if (pageLoading) {
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
    <div className="min-h-screen bg-background">
      <ConfirmationPopup
        isOpen={showDeleteConfirm}
        title="Delete Account Permanently?"
        message="This action deletes all notes, uploads, and data. You cannot reverse this action."
        isLoading={isDeletingAccount}
        onConfirm={handleDeleteAccount}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeletePassword("");
        }}
      >
        <div className="space-y-2 pt-2">
          <Label htmlFor="deletePassword">
            Confirm Password
          </Label>

          <Input
            id="deletePassword"
            type="password"
            placeholder="Enter your password"
            value={deletePassword}
            onChange={(e) =>
              setDeletePassword(e.target.value)
            }
          />

          <p className="text-xs text-muted-foreground">
            Required to permanently delete your account.
          </p>
        </div>
      </ConfirmationPopup>

      <ConfirmationPopup
        isOpen={showDeleteNotesConfirm}
        title="Delete All Uploaded Notes?"
        message="This action permanently deletes all notes you have uploaded. You cannot reverse this action."
        isLoading={isDeletingNotes}
        onConfirm={handleDeleteNotes}
        onCancel={() => setShowDeleteNotesConfirm(false)}
      />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full max-w-xl grid-cols-4 gap-2 p-1">

            <TabsTrigger
              value="profile"
              className="px-2 justify-center text-xs sm:text-sm overflow-hidden"
            >
              <User className="w-4 h-4 sm:mr-2 shrink-0" />
              <span className="hidden sm:inline truncate">Profile</span>
            </TabsTrigger>

            <TabsTrigger
              value="security"
              className="px-2 justify-center text-xs sm:text-sm overflow-hidden"
            >
              <Lock className="w-4 h-4 sm:mr-2 shrink-0" />
              <span className="hidden sm:inline truncate">Security</span>
            </TabsTrigger>

            <TabsTrigger
              value="about"
              className="px-2 justify-center text-xs sm:text-sm overflow-hidden"
            >
              <Info className="w-4 h-4 sm:mr-2 shrink-0" />
              <span className="hidden sm:inline truncate">About</span>
            </TabsTrigger>

            <TabsTrigger
              value="general"
              className="px-2 justify-center text-xs sm:text-sm overflow-hidden"
            >
              <Cog className="w-4 h-4 sm:mr-2 shrink-0" />
              <span className="hidden sm:inline truncate">General</span>
            </TabsTrigger>

          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details and bio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="size-20 shrink-0 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div className="size-20 shrink-0 rounded-full bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                      {getInitials()}
                    </div>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="mt-2 opacity-70 bg-accent/30 cursor-not-allowed"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="course">Course</Label>
                    <Select value={course} onValueChange={setCourse}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select Course" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bca">BCA</SelectItem>
                        <SelectItem value="bba">BBA</SelectItem>
                        <SelectItem value="bcom">BCOM</SelectItem>
                        <SelectItem value="bsc">BSC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="semester">Semester</Label>
                    <Select value={semester} onValueChange={setSemester}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select Semester" />
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

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    className="mt-2 min-h-24"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <Link to="/dashboard">
                    <Button variant="outline">Cancel</Button>
                  </Link>
                  <Button
                    onClick={handleSaveChanges}
                    disabled={saving}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 min-w-[120px]"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <div className="space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your password to keep your account secure</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" className="mt-2" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" className="mt-2" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" className="mt-2" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  </div>
                  <div className="flex justify-end">
                    <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90" onClick={handlePasswordUpdate} disabled={loading}>
                      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Update Password"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* About Settings */}
          <TabsContent value="about">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>About CAIAS NOTES</CardTitle>

                <CardDescription>
                  Learn more about the platform, our mission, and the college community
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">

                <div className="space-y-4">

                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      Helping Students Learn Together
                    </h3>

                    <p className="text-muted-foreground leading-relaxed">
                      CAIAS NOTES is a collaborative platform designed for students
                      to upload, discover, and share academic notes with others.
                      Our goal is to make learning more accessible, organized,
                      and community-driven for every student.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">

                    <div className="rounded-xl border p-4">
                      <h4 className="font-medium mb-2">
                        📚 Easy Note Sharing
                      </h4>

                      <p className="text-sm text-muted-foreground">
                        Upload your notes in seconds and help fellow students
                        prepare better for exams, assignments, and projects.
                      </p>
                    </div>

                    <div className="rounded-xl border p-4">
                      <h4 className="font-medium mb-2">
                        🔍 Smart Discovery
                      </h4>

                      <p className="text-sm text-muted-foreground">
                        Find notes by subject, course, semester, and tags
                        with an organized and user-friendly experience.
                      </p>
                    </div>

                    <div className="rounded-xl border p-4">
                      <h4 className="font-medium mb-2">
                        🤝 Student Community
                      </h4>

                      <p className="text-sm text-muted-foreground">
                        Built to encourage collaborative learning and resource
                        sharing among students across departments.
                      </p>
                    </div>

                    <div className="rounded-xl border p-4">
                      <h4 className="font-medium mb-2">
                        🚀 Built for Simplicity
                      </h4>

                      <p className="text-sm text-muted-foreground">
                        Designed with a clean, responsive, and modern interface
                        focused on speed and ease of use.
                      </p>
                    </div>

                  </div>

                  {/* College Information */}
                  <div className="rounded-2xl border p-5 space-y-4">

                    <div>
                      <h3 className="font-semibold text-lg">
                        About CAIAS
                      </h3>

                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                        Christ Academy Institute for Advanced Studies (CAIAS)
                        is a Bengaluru-affiliated institution focused on academic excellence,
                        value-based education, and holistic student development.
                        The institution offers undergraduate and postgraduate programs
                        across multiple disciplines.
                      </p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 text-sm">

                      <div>
                        <p className="font-medium">📍 Location</p>

                        <p className="text-muted-foreground mt-1">
                          Christ Nagar, Hullahalli, Begur – Koppa Road,
                          Bengaluru, Karnataka
                        </p>
                      </div>

                      <div>
                        <p className="font-medium">🌐 Official Website</p>

                        <a
                          href="https://caias.in"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline mt-1 inline-block"
                        >
                          https://caias.in
                        </a>
                      </div>

                    </div>

                  </div>

                  {/* Developer Information */}
                  <div className="rounded-2xl border p-5 space-y-4">

                    <div>
                      <h3 className="font-semibold text-lg">
                        About the Developer
                      </h3>

                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                        CAIAS NOTES was designed and developed by Haider S Vadgamwala, a student
                        passionate about web development and AI & ML, UI/UX design, and building
                        practical platforms that solve real world problems.
                      </p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 text-sm">

                      <div>
                        <p className="font-medium">💻 Technologies Used</p>

                        <p className="text-muted-foreground mt-1">
                          React, TypeScript, Tailwind CSS, Firebase,
                          Framer Motion, and Shadcn UI
                        </p>
                      </div>

                      <div>
                        <p className="font-medium">🚀 Purpose of the Platform</p>

                        <p className="text-muted-foreground mt-1">
                          Built to simplify note sharing, improve collaboration,
                          and create a better academic experience for students.
                        </p>
                      </div>

                    </div>

                  </div>

                  <div className="rounded-xl bg-muted p-4">
                    <p className="text-sm text-muted-foreground">
                      Thank you for being part of the CAIAS NOTES community
                      and helping students learn smarter together.
                    </p>
                  </div>

                </div>

              </CardContent>
            </Card>
          </TabsContent>

          {/* General Settings */}
          <TabsContent value="general">
            <div className="space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Customize how CAIAS NOTES looks</CardDescription>
                </CardHeader>
                <CardContent>
                  <Label className="mb-3 block">Theme</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setTheme("light")}
                      className={`p-4 rounded-lg border-2 transition-colors ${theme === "light"
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/20"
                        : "border-border hover:border-indigo-400"
                        }`}
                    >
                      <Sun className="w-6 h-6 mx-auto mb-2" />
                      <p className="text-sm font-medium">Light</p>
                    </button>
                    <button
                      onClick={() => setTheme("dark")}
                      className={`p-4 rounded-lg border-2 transition-colors ${theme === "dark"
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/20"
                        : "border-border hover:border-indigo-400"
                        }`}
                    >
                      <Moon className="w-6 h-6 mx-auto mb-2" />
                      <p className="text-sm font-medium">Dark</p>
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Bug Report Section */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-4">
                  <div className="flex flex-col gap-2">
                    <CardTitle>Support</CardTitle>
                    <CardDescription>Help us improve CAIAS NOTES</CardDescription>
                  </div>
                  {/* Close/Cancel cross button visible only when form is open */}
                  {showBugReportForm && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-4 right-4 h-8 w-8 rounded-full"
                      onClick={() => setShowBugReportForm(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {!showBugReportForm ? (
                    // Initial Action Button
                    <Button
                      onClick={() => setShowBugReportForm(true)}
                      className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2"
                    >
                      <Bug className="w-4 h-4" />
                      Report a Bug
                    </Button>
                  ) : (
                    // Dropdown / Form Content
                    <form
                      onSubmit={handleBugSubmit}
                      className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="bug-title">Subject</Label>
                        <Input
                          id="bug-title"
                          value={bugTitle}
                          onChange={(e) => setBugTitle(e.target.value)}
                          placeholder="Short subject of the bug issue"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bug-description">Description</Label>
                        <Textarea
                          id="bug-description"
                          value={bugDescription}
                          onChange={(e) => setBugDescription(e.target.value)}
                          placeholder="Brief summary of the issue..."
                          rows={4}
                          required
                        />
                      </div>
                      <div className="flex justify-end gap-3 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowBugReportForm(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={loading}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          {loading ? "Sending..." : "Submit Bug"}
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>


              <Card className="border-0 shadow-lg border-l-4 border-l-red-500">
                <CardHeader>
                  <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                  <CardDescription>Irreversible actions for your account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Delete All Uploads</p>
                      <p className="text-sm text-muted-foreground">
                        Permanently remove all your uploaded notes
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowDeleteNotesConfirm(true)}
                    >
                      Delete Uploads
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Delete Account</p>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your account and all data
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}

import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut, updatePassword } from "firebase/auth";
import { auth, db } from "../../../backend/Auth/firebase";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { GraduationCap, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function DataPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Auth provider state
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");
  const [bio, setBio] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        const googleProvider = user.providerData.some(
          (provider) => provider.providerId === "google.com"
        );
        setIsGoogleUser(googleProvider);

        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const data = userDoc.data();
            // Check if profile is complete/onboarded
            if (!data.isOnboarded) {
              // Pre-populate with existing data
              setFirstName(data.firstName || "");
              setLastName(data.lastName || "");
              setCourse(data.course?.toLowerCase() || "");
              setSemester(data.semester?.toString() || "");
              setBio(data.bio || "");
              setIsOpen(true);
            } else {
              setIsOpen(false);
            }
          } else {
            // User doc doesn't exist in Firestore, needs onboarding
            const displayName = user.displayName || "";
            const parts = displayName.trim().split(/\s+/);
            setFirstName(parts[0] || "");
            setLastName(parts.slice(1).join(" ") || "");
            setIsOpen(true);
          }
        } catch (err) {
          if (err instanceof Error) {
            toast.error(err.message);
          } else {
            toast.error("Something went wrong");
          }
        } finally {
          setFetching(false);
        }
      } else {
        setUserId(null);
        setIsOpen(false);
        setIsGoogleUser(false);
        setFetching(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (!firstName.trim()) {
      toast.error("First name is required");
      return;
    }
    if (!lastName.trim()) {
      toast.error("Last name is required");
      return;
    }
    if (!course) {
      toast.error("Please select your course");
      return;
    }
    if (!semester) {
      toast.error("Please select your semester");
      return;
    }

    if (isGoogleUser) {
      if (!password) {
        toast.error("Password is required to secure your local login");
        return;
      }
      if (password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
    }

    setLoading(true);
    try {
      // 1. Update/set password in Firebase Auth if user signed in with Google
      if (isGoogleUser && auth.currentUser) {
        await updatePassword(auth.currentUser, password);
      }

      // 2. Save user profile details in Firestore
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      const updateData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        course: course.toUpperCase(),
        semester: parseInt(semester),
        bio: bio.trim(),
        isOnboarded: true,
        updatedAt: new Date().toISOString(),
      };

      if (userDoc.exists()) {
        await updateDoc(userDocRef, updateData);
      } else {
        await setDoc(userDocRef, {
          ...updateData,
          email: auth.currentUser?.email || "",
          avatarUrl: auth.currentUser?.photoURL || "",
          createdAt: new Date().toISOString(),
          uploadsCount: 0,
          downloadsCount: 0,
          reputationRating: 5.0
        });
      }

      // 3. Save public profile details in Firestore
      const publicDocRef = doc(db, "publicProfiles", userId);
      const uploaderAvatar = userDoc.exists()
        ? (userDoc.data().avatarUrl || auth.currentUser?.photoURL || "")
        : (auth.currentUser?.photoURL || "");
      const uploaderReputation = userDoc.exists()
        ? (userDoc.data().reputationRating ?? 5.0)
        : 5.0;

      await setDoc(publicDocRef, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        avatarUrl: uploaderAvatar,
        course: course.toUpperCase(),
        semester: parseInt(semester),
        reputationRating: uploaderReputation,
      }, { merge: true });

      toast.success("Profile setup complete! Welcome to CAIAS NOTES.");
      setIsOpen(false);

      // Reload page to refresh all navbar states smoothly
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsOpen(false);
      toast.info("Logged out successfully");
    } catch (err: any) {
      toast.error(err.message || "Logout error during onBoarding");
    }
  };

  if (fetching || !isOpen) return null;

  return (
    <AnimatePresence>
      <div className="pt-70 fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-lg overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full max-w-lg my-8"
        >
          <Card className="border-border shadow-2xl bg-card/90 border relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-blue-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-purple-500/20 rounded-full blur-2xl pointer-events-none" />

            <CardHeader className="text-center pt-8 pb-4">
              <div className="mx-auto w-12 h-12 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Complete Your Profile
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                Please provide your details to personalize your CAIAS NOTES experience. This is required to access notes.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-6 pb-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="popup-firstName">First Name</Label>
                    <Input
                      id="popup-firstName"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="bg-background/50 border-border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="popup-lastName">Last Name</Label>
                    <Input
                      id="popup-lastName"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="bg-background/50 border-border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="popup-course">Course</Label>
                    <Select value={course} onValueChange={setCourse}>
                      <SelectTrigger id="popup-course" className="bg-background/50 border-border">
                        <SelectValue placeholder="Select Course" />
                      </SelectTrigger>
                      <SelectContent className="z-[110]">
                        <SelectItem value="bca">BCA</SelectItem>
                        <SelectItem value="bba">BBA</SelectItem>
                        <SelectItem value="bcom">BCOM</SelectItem>
                        <SelectItem value="bsc">BSC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="popup-semester">Semester</Label>
                    <Select value={semester} onValueChange={setSemester}>
                      <SelectTrigger id="popup-semester" className="bg-background/50 border-border">
                        <SelectValue placeholder="Select Semester" />
                      </SelectTrigger>
                      <SelectContent className="z-[110]">
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

                {isGoogleUser && (
                  <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                    <div className="space-y-2 col-span-2 mb-2">
                      <Label className="text-indigo-600 dark:text-indigo-400 font-semibold text-xs uppercase tracking-wider block">
                        Secure Local Password Setup
                      </Label>
                      <p className="text-xs text-muted-foreground leading-normal">
                        Since you signed in via Google, please choose a password to allow standard email/password logins in the future.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="popup-password">Password</Label>
                      <Input
                        id="popup-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-background/50 border-border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="popup-confirmPassword">Confirm Password</Label>
                      <Input
                        id="popup-confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="bg-background/50 border-border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="popup-bio">Short Bio (Optional)</Label>
                  <Textarea
                    id="popup-bio"
                    placeholder="Tell us a bit about yourself..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="min-h-[80px] resize-none bg-background/50 border-border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:opacity-90 transition-all shadow-md shadow-indigo-500/10 h-11"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving Profile...
                      </>
                    ) : (
                      "Save and Continue"
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out / Switch account
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Eye, EyeOff, Mail, Lock, User as UserIcon, GraduationCap, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import registerUser from "../../../backend/Auth/registerUser";
import googleSignIn from "../../../backend/Auth/googleSignIn";
import { auth, db } from "../../../backend/Auth/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { toast } from "sonner";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!course) {
      toast.error("Please select a course");
      return;
    }
    if (!semester) {
      toast.error("Please select a semester");
      return;
    }

    setIsLoading(true);

    const parts = fullName.trim().split(/\s+/);
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ") || "";

    try {
      const result = await registerUser(email, password);

      if (result.error) {
        toast.error(result.error);
        setIsLoading(false);
        return;
      }

      const user = result.user;
      if (user) {
        // Create user doc in Firestore
        await setDoc(doc(db, "users", user.uid), {
          firstName,
          lastName,
          email: user.email,
          course: course.toUpperCase(),
          semester: parseInt(semester),
          bio: "",
          avatarUrl: "",
          isOnboarded: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          downloadedNotes: [],
          ratingSum: 0,
          ratingCount: 0,
          savedNotes: [],
          uploadedNotes: [],
        });

        // Sign out the user so they are not automatically logged in
        await signOut(auth);

        toast.success("Account created successfully! Please log in.");
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      }
    } catch (err: any) {
      toast.error(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await googleSignIn();
      if (result.error) {
        toast.error(result.error);
        setIsLoading(false);
        return;
      }

      const user = result.user;
      if (user) {
        // Check if user exists in Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          const parts = (user.name || "Student").split(" ");
          const firstName = parts[0] || "Student";
          const lastName = parts.slice(1).join(" ") || "";

          await setDoc(userDocRef, {
            firstName,
            lastName,
            email: user.email,
            course: "",
            semester: 1,
            bio: "",
            avatarUrl: user.profilePic || "",
            isOnboarded: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            uploadsCount: 0,
            downloadsCount: 0,
            reputationRating: 5.0,
            savedNotes: 0,
          });
          toast.success("Welcome! Please complete your profile details.");
        } else {
          toast.success(`Welcome, ${user.name}!`);
        }

        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      }
    } catch (err: any) {
      toast.error(err.message || "Google sign-in failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-6 left-6 z-30">
        <Link to="/">
          <Button variant="ghost" size="sm" className="px-2 sm:px-3 text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>

      <div className="min-h-screen grid lg:grid-cols-2">
        {/* Left Side - Illustration */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-12 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-grid-white/10" />
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

          <div className="relative z-10 text-white text-center max-w-md">
            <GraduationCap className="w-24 h-24 mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-4">Start Your Journey</h2>
            <p className="text-lg text-white/90 mb-8">
              Create your account and join a community of students helping each other succeed.
              Upload your notes, access quality study materials, and collaborate with peers.
            </p>
            <div className="space-y-4 text-left">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm">✓</span>
                </div>
                <div>
                  <div className="font-semibold">Access Premium Notes</div>
                  <div className="text-sm text-white/80">Download notes from top students across courses</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm">✓</span>
                </div>
                <div>
                  <div className="font-semibold">Share & Earn Recognition</div>
                  <div className="text-sm text-white/80">Upload your notes and build your academic profile</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm">✓</span>
                </div>
                <div>
                  <div className="font-semibold">Previous Year Papers</div>
                  <div className="text-sm text-white/80">Access comprehensive question paper archives</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side - Form */}
        <div className="flex items-center justify-center px-4 py-12">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md"
          >
            <div className="mb-8 flex flex-col items-center md:items-start">

              <Link
                to="/"
                className="flex items-center space-x-2 mb-6 mt-6"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">N</span>
                </div>

                <span className="font-bold text-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  CAIAS NOTES
                </span>
              </Link>

              <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold mb-2">
                  Create Your Account
                </h1>

                <p className="text-muted-foreground">
                  Join CAIAS Notes and start sharing Knowledge
                </p>
              </div>
            </div>

            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Sign up for free</CardTitle>
                <CardDescription>Get started with NoteSphere today</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        className="pl-10"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="student@caias.in"
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="course">Course</Label>
                      <Select value={course} onValueChange={setCourse} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bca">BCA</SelectItem>
                          <SelectItem value="bba">BBA</SelectItem>
                          <SelectItem value="bcom">BCOM</SelectItem>
                          <SelectItem value="bsc">BSC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="semester">Semester</Label>
                      <Select value={semester} onValueChange={setSemester} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1st</SelectItem>
                          <SelectItem value="2">2nd</SelectItem>
                          <SelectItem value="3">3rd</SelectItem>
                          <SelectItem value="4">4th</SelectItem>
                          <SelectItem value="5">5th</SelectItem>
                          <SelectItem value="6">6th</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        className="pl-10 pr-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    By creating an account, you agree to our{" "}
                    <a href="#" className="text-indigo-600 hover:underline">Terms of Service</a>
                    {" "}and{" "}
                    <a href="#" className="text-indigo-600 hover:underline">Privacy Policy</a>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:opacity-90"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-card px-2 text-muted-foreground">Or sign up with</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google
                  </Button>
                </div>

                <p className="text-center text-sm text-muted-foreground mt-6">
                  Already have an account?{" "}
                  <Link to="/login" className="text-indigo-600 hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

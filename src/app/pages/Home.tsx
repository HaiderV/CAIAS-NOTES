import { Link } from "react-router";
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../backend/Auth/firebase";
import { useAuth } from "./AuthContext";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import Navbar from "../components/Navbar";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  Download,
  FolderTree,
  FileQuestion,
  Shield,
  User,
  Search,
  BookOpen,
  X,
  Share,
  Smartphone,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Footer from "../components/Footer";
import { useIsMobile } from "../components/ui/use-mobile";

const features = [
  {
    icon: Upload,
    title: "Upload Notes",
    description: "Easily upload your study materials and notes in PDF format with a simple drag-and-drop interface.",
  },
  {
    icon: FileText,
    title: "Preview PDFs",
    description: "View PDFs directly in your browser before downloading. No need for external applications.",
  },
  {
    icon: Download,
    title: "Download Instantly",
    description: "Download notes and materials with a single click. Access resources anytime, anywhere.",
  },
  {
    icon: FolderTree,
    title: "Semester-wise Organization",
    description: "Notes are organized by semester and subject for easy navigation and discovery.",
  },
  {
    icon: FileQuestion,
    title: "Previous Year Papers",
    description: "Access a comprehensive collection of previous year question papers for exam preparation.",
  },
  {
    icon: Shield,
    title: "Secure Authentication",
    description: "Your data is protected with industry-standard security and authentication protocols.",
  },
  {
    icon: User,
    title: "Student Profiles",
    description: "Create your profile, track contributions, and build your academic reputation.",
  },
  {
    icon: Search,
    title: "Search & Filters",
    description: "Advanced search and filtering options to find exactly what you're looking for.",
  },
];

const courses = [
  {
    name: "BCA",
    fullName: "Bachelor of Computer Applications",
    semesters: 6,
    materials: 234,
    color: "from-blue-500 to-cyan-500",
  },
  {
    name: "BBA",
    fullName: "Bachelor of Business Administration",
    semesters: 6,
    materials: 189,
    color: "from-purple-500 to-pink-500",
  },
  {
    name: "BCOM",
    fullName: "Bachelor of Commerce",
    semesters: 6,
    materials: 312,
    color: "from-orange-500 to-red-500",
  },
  {
    name: "BSC",
    fullName: "Bachelor of Science",
    semesters: 6,
    materials: 276,
    color: "from-green-500 to-emerald-500",
  },
];


export default function Home() {
  const [coursesData, setCoursesData] = useState(courses);
  const { user } = useAuth();

  const isMobile = useIsMobile();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isDeviceIOS = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isDeviceIOS);

    // Check if the application is running in standalone mode (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsInstalled(isStandalone);

    // Check if user has previously dismissed the banner
    const isDismissed = localStorage.getItem("caias_pwa_dismissed") === "true";

    // Show the banner only on mobile devices, if not already installed, and if not dismissed
    if (isMobile && !isStandalone && !isDismissed) {
      if (isDeviceIOS) {
        // iOS does not trigger beforeinstallprompt, so we can display it directly
        setShowBanner(true);
      } else {
        // Check if event was captured on window level during app load
        if ((window as any).deferredPrompt) {
          setDeferredPrompt((window as any).deferredPrompt);
          setShowBanner(true);
        }

        // Also listen for event in case it fires now
        const handleBeforeInstallPrompt = (e: Event) => {
          e.preventDefault();
          setDeferredPrompt(e);
          setShowBanner(true);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
          window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
      }
    }
  }, [isMobile]);

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || (window as any).deferredPrompt;
    if (!promptEvent) {
      if (isIOS) {
        toast("To install, tap Safari Share (📤) and select 'Add to Home Screen'.", { duration: 6000 });
      } else {
        toast("To install, tap browser menu (⋮) and select 'Add to Home screen' or 'Install'.", { duration: 6000 });
      }
      setShowBanner(false);
      return;
    }

    // Show the native browser install prompt
    promptEvent.prompt();

    // Wait for the user's choice
    try {
      const choiceResult = await promptEvent.userChoice;
      if (choiceResult.outcome === 'accepted') {
        toast.success("Thank you for installing CAIAS Notes!");
        setShowBanner(false);
        setIsInstalled(true);
      }
    } catch (err) {
      console.error("Install prompt error:", err);
    } finally {
      // Clear the prompt event
      setDeferredPrompt(null);
      (window as any).deferredPrompt = null;
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("caias_pwa_dismissed", "true");
    setShowBanner(false);
  };

  const handleInlineInstallClick = async () => {
    const promptEvent = deferredPrompt || (window as any).deferredPrompt;
    if (!promptEvent) {
      if (isIOS) {
        toast("To install, tap Safari Share (📤) and select 'Add to Home Screen'.", { duration: 6000 });
      } else {
        toast("To install, tap browser menu (⋮) and select 'Add to Home screen' or 'Install'.", { duration: 6000 });
      }
      return;
    }

    promptEvent.prompt();

    try {
      const choiceResult = await promptEvent.userChoice;
      if (choiceResult.outcome === 'accepted') {
        toast.success("Thank you for installing CAIAS Notes!");
        setIsInstalled(true);
      }
    } catch (err) {
      console.error("Install prompt error:", err);
    } finally {
      setDeferredPrompt(null);
      (window as any).deferredPrompt = null;
    }
  };

  useEffect(() => {
    const fetchMaterialCounts = async () => {
      try {
        // Try backend API first
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/notes/counts`);
        if (response.data && response.data.success && response.data.counts) {
          const counts = response.data.counts;
          setCoursesData((prevCourses) =>
            prevCourses.map((course) => ({
              ...course,
              materials: counts[course.name.toUpperCase()] ?? course.materials,
            }))
          );
          return;
        }
      } catch (apiError) {
        console.warn("Failed to fetch counts from backend API, trying fallback...", apiError);
      }

      // Fallback: If logged in, fetch from client-side Firestore
      if (user) {
        try {
          const querySnapshot = await getDocs(collection(db, "notes"));
          const counts: Record<string, number> = {
            BCA: 0,
            BBA: 0,
            BCOM: 0,
            BSC: 0,
          };

          querySnapshot.forEach((doc) => {
            const data = doc.data();
            const courseName = (data.course || "").toUpperCase().trim();
            if (courseName in counts) {
              counts[courseName] += 1;
            }
          });

          setCoursesData((prevCourses) =>
            prevCourses.map((course) => ({
              ...course,
              materials: counts[course.name.toUpperCase()] ?? course.materials,
            }))
          );
        } catch (fsError) {
          console.error("Fallback client-side fetch failed:", fsError);
        }
      }
    };

    fetchMaterialCounts();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-blue-950/20" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-purple-300 dark:bg-purple-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-blue-300 dark:bg-blue-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute top-40 left-1/2 w-72 h-72 bg-indigo-300 dark:bg-indigo-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center text-center lg:items-start lg:text-left w-full"
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                One Place For All Your{" "}
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  College Notes
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl">
                Upload, access, and share notes, previous year question papers, and study materials.
                Built by students, for students. Make your college journey easier with organized resources at your fingertips.
              </p>
              <div className="flex flex-row flex-wrap justify-center lg:justify-start gap-4 w-full">
                <Link to="/browse">
                  <Button className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:opacity-90 h-10 px-5 sm:h-12 sm:px-8 text-sm sm:text-base w-auto font-medium shadow-md transition-all">
                    <BookOpen className="w-4.5 h-4.5 mr-2" />
                    Explore Notes
                  </Button>
                </Link>
                <Link to="/upload">
                  <Button variant="outline" className="h-10 px-5 sm:h-12 sm:px-8 text-sm sm:text-base w-auto font-medium transition-all">
                    <Upload className="w-4.5 h-4.5 mr-2" />
                    Upload Notes
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 rounded-3xl transform rotate-3 opacity-20" />
                <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-2xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-xl flex items-center justify-center">
                      <FileText className="w-16 h-16 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="h-24 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50 rounded-xl flex items-center justify-center">
                      <Download className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="h-24 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-xl flex items-center justify-center">
                      <Upload className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* About CAIAS Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50/50 via-purple-50/50 to-blue-50/50 dark:from-indigo-950/10 dark:via-purple-950/10 dark:to-blue-950/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Image Column */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative order-last lg:order-first w-full max-w-lg lg:max-w-none mx-auto"
            >
              <div className="relative group overflow-hidden rounded-3xl shadow-2xl border border-border bg-card">
                <img
                  src="https://caias.in/wp-content/uploads/2025/04/caias.webp"
                  alt="Christ Academy Institute for Advanced Studies"
                  className="w-full aspect-[16/10] sm:aspect-[16/9] lg:aspect-auto lg:h-[380px] object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/45 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />
              </div>
            </motion.div>

            {/* Text Content Column */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-6 flex flex-col items-center text-center lg:items-start lg:text-left w-full"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-sm font-semibold">
                <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse"></span>
                Christ Academy
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
                Built for{" "}
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  CAIAS Students
                </span>
              </h2>

              <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
                <p>
                  A centralized academic platform created to simplify the way CAIAS students access and share study materials. From class notes and previous year papers to assignments and semester resources, everything is organized in one place for a smoother learning experience.
                </p>
                <p>
                  Designed to support collaboration and productivity, the platform helps students stay connected with academic resources anytime, anywhere.
                </p>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need to{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Excel in Your Studies
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A comprehensive platform designed to make studying easier and more collaborative.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
                  <CardHeader>
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Course Categories Section */}
      <section className="pt-20 pb-10 sm:pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-blue-950/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-7">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Browse by{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Course
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Find notes and materials specific to your course and semester.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {coursesData.map((course, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Link to={`/browse?course=${encodeURIComponent(course.name)}`}>
                  <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer overflow-hidden group">
                    <div className={`h-2 bg-gradient-to-r ${course.color}`} />
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <CardTitle className="text-2xl">{course.name}</CardTitle>
                        <div className={`w-12 h-12 bg-gradient-to-br ${course.color} rounded-lg flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform`}>
                          {course.name[0]}
                        </div>
                      </div>
                      <CardDescription className="text-sm">{course.fullName}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Materials</span>
                          <span className="font-semibold">{course.materials}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Inline PWA Install Banner for Mobile (Visible only on small screens after Course Categories Section) */}
      {!isInstalled && (
        <section className="block md:hidden py-10 px-4 bg-gradient-to-b from-indigo-50/30 to-background dark:from-indigo-950/10 dark:to-background animate-fade-in">
          <div className="max-w-md mx-auto bg-gradient-to-br from-indigo-900 via-indigo-950 to-purple-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
            {/* Background decorative patterns */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/15 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/15 rounded-full blur-2xl" />
            
            <div className="relative flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                <Smartphone className="w-8 h-8 text-indigo-300 animate-pulse" />
              </div>
              
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold tracking-tight">CAIAS Notes Mobile App</h3>
                <p className="text-xs text-indigo-200/90 max-w-sm leading-relaxed">
                  Install the shortcut directly on your home screen for instant previews & offline support.
                </p>
              </div>

              <Button
                onClick={handleInlineInstallClick}
                className="w-full bg-white text-indigo-950 hover:bg-white/90 font-semibold shadow-md active:scale-[0.98] transition-transform h-10 px-6 rounded-xl text-xs"
              >
                Install App
              </Button>
            </div>
          </div>
        </section>
      )}

      <Footer />

      {/* PWA Install Banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-4 flex flex-col gap-3.5 select-none"
          >
            {/* Header / Info Section */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3 items-center">
                <img
                  src="/logo.png"
                  alt="CAIAS Notes Logo"
                  className="w-12 h-12 rounded-xl object-cover shadow-md border border-gray-100 dark:border-gray-800"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/src/assets/logo-cn.png";
                  }}
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-955 dark:text-gray-100 text-sm leading-tight">
                    Install CAIAS Notes
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-normal">
                    Add shortcut to your Home Screen for faster access & notes preview.
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Dismiss install banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Actions Section */}
            <div className="flex gap-2 justify-end items-center mt-1 border-t border-gray-150 dark:border-gray-800 pt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 h-8"
              >
                Not Now
              </Button>
              <Button
                size="sm"
                onClick={handleInstallClick}
                className="text-xs bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:opacity-90 text-white font-medium shadow-md transition-all h-8 px-4"
              >
                Install App
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

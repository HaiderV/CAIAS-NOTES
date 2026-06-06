import { Link } from "react-router";
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../backend/Auth/firebase";
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
} from "lucide-react";
import { motion } from "motion/react";
import Footer from "../components/Footer";

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

  useEffect(() => {
    const fetchMaterialCounts = async () => {
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
            materials: counts[course.name.toUpperCase()] || 0,
          }))
        );
      } catch (error: any) {
        //toast.error(error.message || "Error in fetching notes counts for courses!");
      }
    };

    fetchMaterialCounts();
  }, []);

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
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-blue-950/20">
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

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-10">
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
      <Footer />
    </div>
  );
}

import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import Footer from "../components/Footer";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../../../backend/Auth/firebase";
import { useParams } from "react-router-dom";
import {
  ArrowLeft,
  Settings,
  Award,
  Upload,
  Download,
  Star,
  TrendingUp,
  Bookmark,
  CalendarDays,
  Mail,
} from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadCount, setUploadCount] = useState<any>(0);
  const [savedCount, setSavedCount] = useState<any>(0);
  const [totalRatingSum, setTotalRatingSum] = useState(0);
  const [totalRatingCount, setTotalRatingCount] = useState(0);
  const [isCurrentUser, setIsCurrentUser] = useState(false);

  const { profileId } = useParams();

  const defaultAvatar = "https://api.dicebear.com/7.x/initials/svg?seed=Student";

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Profile Details
  useEffect(() => {
    const fetchProfile = async () => {
      if (!profileId) return;

      try {
        const activeUser = auth.currentUser;
        const isCurrent = activeUser?.uid === profileId;
        setIsCurrentUser(isCurrent);

        const collectionName = isCurrent ? "users" : "publicProfiles";
        const userDocRef = doc(db, collectionName, profileId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const profileData: any = userDoc.data();
          setUserData({
            id: userDoc.id,
            ...profileData,
          });

          // Fetch upload count dynamically from the notes collection
          const notesQuery = query(
            collection(db, "notes"),
            where("uploadedBy", "==", profileId)
          );
          const notesSnap = await getDocs(notesQuery);
          setUploadCount(notesSnap.size);

          if (isCurrent) {
            setSavedCount(profileData?.savedNotes?.length || 0);
          } else {
            setSavedCount(0);
          }

          // Compute ratings from actual uploaded notes
          let ratingSum = 0;
          let ratingCount = 0;
          notesSnap.docs.forEach((noteDoc) => {
            const data = noteDoc.data();
            ratingSum += data.ratingSum || 0;
            ratingCount += data.ratingCount || 0;
          });

          setTotalRatingSum(ratingSum);
          setTotalRatingCount(ratingCount);

        } else {
          // Fallback if profile not found
          setUserData({
            id: profileId,
            firstName: "Student",
            lastName: "",
            avatarUrl: defaultAvatar,
            course: "Student",
            semester: 1,
          });
          setUploadCount(0);
          setSavedCount(0);
          setTotalRatingSum(0);
          setTotalRatingCount(0);
        }
      } catch (err: any) {
        toast.error(err.message || "Error loading user profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [profileId, currentUser]);

  const averageRating =
    totalRatingCount > 0
      ? (totalRatingSum / totalRatingCount).toFixed(1)
      : (userData?.reputationRating !== undefined ? userData.reputationRating.toFixed(1) : "5.0");

  // Get initials if no url
  const getInitials = () => {
    const firstName = userData?.firstName || "Student";
    const lastName = userData?.lastName || "";
    if (firstName && lastName) {
      return (firstName[0] + lastName[0]).toUpperCase();
    }
    return firstName.slice(0, 2).toUpperCase() || "S";
  };

  // Semester suffix
  const getSemesterSuffix = (sem: any) => {
    const s = parseInt(sem);
    if (isNaN(s)) return "";
    if (s === 1) return "st";
    if (s === 2) return "nd";
    if (s === 3) return "rd";
    return "th";
  };

  // Date format
  const getJoinedDate = () => {
    if (!userData?.createdAt) return "Recently";

    return new Date(userData.createdAt).toLocaleDateString(
      "en-US",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  };

  // Loading
  const loadingMessages = [
    "Finding your notes...",
    "Organizing notebooks...",
    "Removing coffee stains...",
    "Sharpening virtual pencils...",
    "Looking for page 42...",
    "Summoning forgotten formulas...",
    "Making your notes look smarter...",
    "Loading knowledge..."
  ];

  const [loadingText, setLoadingText] = useState(0);

  useEffect(() => {
    if (!loading) return;

    const interval = setInterval(() => {
      setLoadingText((prev) => (prev + 1) % loadingMessages.length);
    }, 2200);

    return () => clearInterval(interval);
  }, [loading]);


  if (loading) {
    return (
      <div className="relative min-h-screen bg-background flex items-center justify-center overflow-hidden select-none">

        {/* Background Glow */}
        <div className="absolute inset-0">
          <div className="absolute -top-32 -left-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl animate-pulse [animation-delay:1s]" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-8">

          {/* Book */}
          <div className="relative w-24 h-20 flex items-center justify-center animate-[float_2.8s_ease-in-out_infinite] drop-shadow-[0_10px_25px_rgba(99,102,241,0.25)]">

            {/* Spine */}
            <div className="absolute w-1 h-16 bg-indigo-600 rounded-full opacity-40" />

            {/* Covers */}
            <div className="absolute right-1/2 w-10 h-14 border-2 border-r-0 border-indigo-600 rounded-l-md bg-background" />

            <div className="absolute left-1/2 w-10 h-14 border-2 border-l-0 border-indigo-600 rounded-r-md bg-background" />

            {/* Pages */}
            {[0, 180, 360, 540].map((delay) => (
              <div
                key={delay}
                className="absolute right-1/2 w-9 h-13 border-y border-l border-indigo-400 rounded-l-sm bg-background origin-right"
                style={{
                  animation: `pageFlip 1.6s infinite`,
                  animationDelay: `${delay}ms`,
                }}
              />
            ))}

            {/* Bookmark */}
            <div className="absolute top-[78%] left-1/2 -translate-x-1/2 w-1 h-5 bg-indigo-500 rounded-b-sm animate-[bookmark_2s_ease-in-out_infinite]" />
          </div>

          {/* Text */}
          <div className="text-center space-y-2">

            <h2 className="font-semibold text-lg text-foreground">
              CAIAS Notes
            </h2>

            <p
              key={loadingText}
              className="text-sm text-muted-foreground animate-[fadeIn_0.5s]"
            >
              {loadingMessages[loadingText]}
            </p>

          </div>

          {/* Loading Bar */}
          <div className="w-56 h-1 rounded-full bg-muted overflow-hidden">

            <div className="h-full w-20 rounded-full bg-indigo-500 animate-[loadingBar_1.8s_infinite]" />

          </div>

        </div>

        <style>{`
      
      @keyframes float{
        0%,100%{
          transform:translateY(0px);
        }
        50%{
          transform:translateY(-8px);
        }
      }

      @keyframes pageFlip{

        0%{
          transform:rotateY(0deg);
          opacity:1;
        }

        70%{
          transform:rotateY(-180deg);
          opacity:.8;
        }

        100%{
          transform:rotateY(-180deg);
          opacity:0;
        }

      }

      @keyframes loadingBar{

        0%{
          transform:translateX(-120%);
        }

        100%{
          transform:translateX(340%);
        }

      }

      @keyframes bookmark{

        0%,100%{
          transform:translateX(-50%) rotate(0deg);
        }

        50%{
          transform:translateX(-50%) rotate(6deg);
        }

      }

      @keyframes fadeIn{

        from{
          opacity:0;
          transform:translateY(6px);
        }

        to{
          opacity:1;
          transform:translateY(0);
        }

      }

      `}</style>

      </div>
    );
  }

  // Stats
  const stats = [
    { label: "Total Uploads", value: uploadCount, icon: Upload, change: "Shared notes" },
    ...(isCurrentUser ? [
      { label: "Total Downloads", value: userData?.downloadsCount?.toString() || "0", icon: Download, change: "Retrieved notes" },
      { label: "Total SavedNotes", value: savedCount.toString(), icon: Bookmark, change: "Saved notes" },
    ] : []),
    { label: "Average Rating", value: averageRating.toString(), icon: Star, change: "Reputation score" },
  ];

  // Image url
  const imageUrl =
    userData?.avatarUrl &&
      userData.avatarUrl !== "null" &&
      userData.avatarUrl.trim() !== ""
      ? userData.avatarUrl
      : defaultAvatar;

  const displayName = userData?.firstName
    ? `${userData.firstName} ${userData.lastName || ""}`.trim()
    : (isCurrentUser && (currentUser?.displayName || currentUser?.email?.split("@")[0])) || "Student";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>

            {isCurrentUser && (
              <Link to="/settings">
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        {/* Profile Header */}
        <Card className="border-0 shadow-lg sm:shadow-xl mb-6 sm:mb-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-blue-950/20">
          <CardContent className="p-5 sm:p-8 pt-6 sm:pt-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Avatar"
                  className="w-18 h-18 sm:w-24 sm:h-24 rounded-full object-cover border border-border shadow-md sm:shadow-lg shrink-0"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="w-18 h-18 sm:w-24 sm:h-24 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-xl sm:text-3xl font-bold shadow-md sm:shadow-lg shrink-0">
                  {getInitials()}
                </div>
              )}

              <div className="flex-1 text-center sm:text-left min-w-0 w-full">
                <h1 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2 truncate text-foreground">
                  {displayName}
                </h1>

                <p className="text-xs sm:text-base text-muted-foreground font-medium truncate">
                  {userData?.course || "Student"}
                  {userData?.semester &&
                    ` • ${userData.semester}${getSemesterSuffix(
                      userData.semester
                    )} Semester`}
                </p>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-3 text-xs sm:text-sm text-muted-foreground justify-center sm:justify-start">
                  {isCurrentUser && userData?.email && (
                    <div className="flex items-center gap-1.5 justify-center sm:justify-start min-w-0">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{userData.email}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 justify-center sm:justify-start min-w-0">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Joined {getJoinedDate()}</span>
                  </div>
                </div>

                {isCurrentUser && userData?.bio && (
                  <p className="text-xs sm:text-sm max-w-2xl mt-3 sm:mt-4 leading-relaxed text-muted-foreground break-words">
                    {userData.bio}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 pb-0 sm:pb-37">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className=" border-0 shadow-lg cursor-pointer transition-all duration-300 ease-out hover:-translate-y-2 hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98] active:translate-y-0 grou "
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">{stat.label}</CardTitle>
                <stat.icon
                  className=" w-4 h-4 text-muted-foreground transition-all duration-300 group-hover:text-primary group-hover:scale-125 group-hover:rotate-6"
                />
              </CardHeader>
              <CardContent>
                <div
                  className=" text-2xl font-bold transition-colors duration-300 group-hover:text-primary"
                >
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}

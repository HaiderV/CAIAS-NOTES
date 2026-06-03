import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import Footer from "../components/Footer";
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../backend/Auth/firebase";
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

  const { profileId } = useParams();

  //fetch current profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!profileId) return;

      try {
        const userDocRef = doc(db, "users", profileId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const profileData: any = userDoc.data();
          setUserData({
            id: userDoc.id,
            ...profileData,
          });
          setUploadCount(profileData?.uploadedNotes?.length || 0);
          setSavedCount(profileData?.savedNotes?.length || 0);

          const uploadedNotes = profileData?.uploadedNotes || [];

          let ratingSum = 0;
          let ratingCount = 0;

          const notePromises = uploadedNotes.map(async (noteId: string) => {
            console.log("Note ID:", noteId);

            const noteSnap = await getDoc(doc(db, "notes", noteId));

            console.log("Exists:", noteSnap.exists());

            if (noteSnap.exists()) {
              console.log("Data:", noteSnap.data());

              ratingSum += noteSnap.data().ratingSum || 0;
              ratingCount += noteSnap.data().ratingCount || 0;
            }
          });

          await Promise.all(notePromises);

          setTotalRatingSum(ratingSum);
          setTotalRatingCount(ratingCount);

        } else {
          toast.error("Profile not found");
        }
      } catch (err: any) {
        toast.error(err.message || "Error loading user profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [profileId]);

  const averageRating =
    totalRatingCount > 0
      ? (totalRatingSum / totalRatingCount).toFixed(1)
      : "0.0";

  //get initials if no url
  const getInitials = () => {
    if (userData?.firstName && userData?.lastName) {
      return (userData.firstName[0] + userData.lastName[0]).toUpperCase();
    }
    return currentUser?.email?.slice(0, 2).toUpperCase() || "U";
  };

  // semester suffix
  const getSemesterSuffix = (sem: any) => {
    const s = parseInt(sem);
    if (isNaN(s)) return "";
    if (s === 1) return "st";
    if (s === 2) return "nd";
    if (s === 3) return "rd";
    return "th";
  };

  //date format
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

  // loading
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm font-medium animate-pulse">Loading profile...</p>
        </div>
      </div>
    );
  }

  //stats
  const stats = [
    { label: "Total Uploads", value: uploadCount, icon: Upload, change: "Shared notes" },
    { label: "Total Downloads", value: userData?.downloadsCount?.toString() || "0", icon: Download, change: "Retrieved notes" },
    { label: "Total SavedNotes", value: savedCount.toString(), icon: Bookmark, change: "Saved notes" },
    { label: "Average Rating", value: averageRating.toString(), icon: Star, change: "Reputation score" },
  ];

  //image url
  const imageUrl =
    userData?.avatarUrl &&
      userData.avatarUrl !== "null" &&
      userData.avatarUrl.trim() !== ""
      ? userData.avatarUrl
      : currentUser?.photoURL;

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

            <Link to="/settings">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </Link>
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
                  {userData?.firstName && userData?.lastName
                    ? `${userData.firstName} ${userData.lastName}`
                    : currentUser?.displayName ||
                    currentUser?.email?.split("@")[0]}
                </h1>

                <p className="text-xs sm:text-base text-muted-foreground font-medium truncate">
                  {userData?.course || "Student"}
                  {userData?.semester &&
                    ` • ${userData.semester}${getSemesterSuffix(
                      userData.semester
                    )} Semester`}
                </p>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-3 text-xs sm:text-sm text-muted-foreground justify-center sm:justify-start">
                  <div className="flex items-center gap-1.5 justify-center sm:justify-start min-w-0">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{userData?.email}</span>
                  </div>

                  <div className="flex items-center gap-1.5 justify-center sm:justify-start min-w-0">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Joined {getJoinedDate()}</span>
                  </div>
                </div>

                {userData?.bio && (
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

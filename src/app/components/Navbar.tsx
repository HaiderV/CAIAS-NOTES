import { Link, useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Moon, Sun, Menu, User, Settings, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../../backend/Auth/firebase";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const navigate = useNavigate();
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } catch (err: any) {
          toast.error(err.message || "Error while fetching user data?")
        }
      } else {
        setCurrentUser(null);
        setUserData(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      navigate("/", { replace: true });
      await signOut(auth);
      toast.success("Logged Out successfully!")
    } catch (err: any) {
      toast.error(err.message || "Error while logging out?")
    }
  };

  const user = auth.currentUser;
  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">N</span>
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              CAIAS NOTES
            </span>
          </Link>
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-foreground/70 hover:text-foreground transition-colors">
              Home
            </Link>
            <Link to="/browse" className="text-foreground/70 hover:text-foreground transition-colors">
              Browse
            </Link>
            <Link to="/dashboard" className="text-foreground/70 hover:text-foreground transition-colors">
              Dashboard
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>

            {currentUser && !currentUser.isAnonymous ? (
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <Link to={`/profile/${user?.uid}`} className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full">
                  {userData?.avatarUrl || currentUser.photoURL ? (
                    <img
                      src={userData?.avatarUrl || currentUser.photoURL || ""}
                      alt="User Profile"
                      className="w-8 h-8 rounded-full object-cover border border-border hover:opacity-85 transition-opacity"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold hover:opacity-85 transition-opacity">
                      {getInitials(
                        userData?.firstName && userData?.lastName
                          ? `${userData.firstName} ${userData.lastName}`
                          : currentUser.displayName || currentUser.email || "U"
                      )}
                    </div>
                  )}
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="px-2 sm:px-3 gap-1 items-center shrink-0 hidden sm:flex hover:bg-accent/50"
                    >
                      <span className="truncate max-w-[120px] font-medium text-foreground">
                        {userData?.firstName && userData?.lastName
                          ? `${userData.firstName} ${userData.lastName}`
                          : currentUser?.displayName || currentUser?.email?.split('@')[0] || "Guest"}
                      </span>
                      <svg className="w-4 h-4 text-muted-foreground ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56"
                  >
                    <DropdownMenuLabel>
                      My Account
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        to={`/profile/${user?.uid}`}
                        className="cursor-pointer flex items-center w-full"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        to="/settings"
                        className="cursor-pointer flex items-center w-full"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() =>
                        setTheme(
                          theme === "dark" ? "light" : "dark"
                        )
                      }
                      className="cursor-pointer"
                    >
                      {theme === "dark"
                        ? "Light"
                        : "Dark"}{" "}
                      Mode
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 cursor-pointer flex items-center w-full"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:opacity-90">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-background"
          >
            <div className="px-4 py-4 space-y-3">
              <Link
                to="/"
                className="block py-2 text-foreground/70 hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/browse"
                className="block py-2 text-foreground/70 hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Browse
              </Link>
              <Link
                to="/dashboard"
                className="block py-2 text-foreground/70 hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>

              <div className="pt-4 border-t border-border">
                {currentUser && !currentUser.isAnonymous ? (
                  <Link
                    to={`/profile/${currentUser?.uid}`}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {userData?.avatarUrl || currentUser.photoURL ? (
                      <img
                        src={userData?.avatarUrl || currentUser.photoURL || ""}
                        alt="User Profile"
                        className="w-10 h-10 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {getInitials(
                          userData?.firstName && userData?.lastName
                            ? `${userData.firstName} ${userData.lastName}`
                            : currentUser.displayName || currentUser.email || "U"
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-foreground">
                        {userData?.firstName && userData?.lastName
                          ? `${userData.firstName} ${userData.lastName}`
                          : currentUser.displayName || currentUser.email}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">View Profile</p>
                    </div>
                  </Link>
                ) : (
                  <div className="space-y-3">
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block"
                    >
                      <Button variant="outline" className="w-full">
                        Login
                      </Button>
                    </Link>

                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block"
                    >
                      <Button className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600">
                        Get Started
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
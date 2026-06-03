import { Link } from "react-router";
import {
    Github,
    Globe,
    Linkedin,
} from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-gray-950 dark:bg-black text-white px-4 sm:px-6 lg:px-8 pt-14 pb-6">
            <div className="max-w-6xl mx-auto">

                {/* Top Section */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10 border-b border-gray-800">

                    {/* Brand */}
                    <div className="md:col-span-2 flex flex-col items-center md:items-start text-center md:text-left">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                                <span className="text-white font-bold text-lg">
                                    N
                                </span>
                            </div>

                            <span className="font-bold text-2xl tracking-wide">
                                CAIAS NOTES
                            </span>
                        </div>

                        <p className="text-gray-400 text-sm leading-relaxed max-w-md">
                            A centralized academic platform designed for CAIAS
                            students to access, share, and organize study
                            materials with ease.
                        </p>
                    </div>

                    {/* Quick Links + Legal */}
                    <div className="flex gap-14 justify-center md:justify-start text-center md:text-left">

                        {/* Quick Links */}
                        <div>
                            <h4 className="font-semibold mb-4 text-white">
                                Quick Links
                            </h4>

                            <ul className="space-y-2 text-sm text-gray-400">
                                <li>
                                    <Link
                                        to="/"
                                        className="hover:text-white transition-colors"
                                    >
                                        Home
                                    </Link>
                                </li>

                                <li>
                                    <Link
                                        to="/browse"
                                        className="hover:text-white transition-colors"
                                    >
                                        Browse Notes
                                    </Link>
                                </li>

                                <li>
                                    <Link
                                        to="/dashboard"
                                        className="hover:text-white transition-colors"
                                    >
                                        Dashboard
                                    </Link>
                                </li>

                                <li>
                                    <Link
                                        to="/upload"
                                        className="hover:text-white transition-colors"
                                    >
                                        Upload
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Legal */}
                        <div>
                            <h4 className="font-semibold mb-4 text-white">
                                Legal
                            </h4>

                            <ul className="space-y-2 text-sm text-gray-400">
                                <li>
                                    <a
                                        href="/settings"
                                        className="hover:text-white transition-colors"
                                    >
                                        About Us
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="/settings"
                                        className="hover:text-white transition-colors"
                                    >
                                        Privacy Policy
                                    </a>
                                </li>

                                <li>
                                    <a
                                        href="/settings"
                                        className="hover:text-white transition-colors"
                                    >
                                        Terms of Service
                                    </a>
                                </li>

                                <li>
                                    <a
                                        href="/settings"
                                        className="hover:text-white transition-colors"
                                    >
                                        Contact
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Developer */}
                    <div className="text-center md:text-right">
                        <h4 className="font-semibold mb-3 text-white">
                            Developed by Haider
                        </h4>

                        <p className="text-sm text-gray-400 leading-relaxed mb-5 max-w-xs mx-auto md:mx-0 md:ml-auto">
                            BCA Student, Frontend Developer, and AI/ML Enthusiast.
                        </p>

                        <div className="flex justify-center md:justify-end gap-3">

                            {/* GitHub */}
                            <a
                                href="https://github.com/HaiderV"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-all duration-300"
                            >
                                <Github className="w-5 h-5" />
                            </a>

                            {/* LinkedIn */}
                            <a
                                href="https://www.linkedin.com/in/haider-vadgamwala-220728281/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-all duration-300"
                            >
                                <Linkedin className="w-5 h-5" />
                            </a>

                            {/* Portfolio */}
                            <a
                                href="https://front-end-project-7-portfolio.vercel.app/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-all duration-300"
                            >
                                <Globe className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom */}
                <div className="pt-6 text-center text-sm text-gray-500">
                    <p>
                        &copy; 2026 CAIAS NOTES. Crafted with ❤️ for the student community.
                    </p>
                </div>
            </div>
        </footer>
    );
}
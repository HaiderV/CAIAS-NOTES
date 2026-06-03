// ErrorPage.tsx
import { useRouteError, isRouteErrorResponse, Link } from "react-router-dom";

export default function ErrorPage() {
    const error = useRouteError();

    let title = "Something went wrong";
    let message = "An unexpected error occurred.";

    if (isRouteErrorResponse(error)) {
        title = `${error.status}`;
        message = error.statusText;

        if (error.status === 404) {
            title = "404";
            message = "Page not found";
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4 sm:px-6 lg:px-8 selection:bg-neutral-800 selection:text-white">
            {/* Clean, spacious card container */}
            <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl p-8 sm:p-12 md:p-16 shadow-2xl transition-all duration-300">
                <div className="flex flex-col items-center text-center max-w-xl mx-auto">

                    {/* Tag / Status Indicator */}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-red-950/50 text-red-400 border border-red-900/40 mb-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        Attention Required
                    </span>

                    {/* Title - Balanced typography scale */}
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-100">
                        {title}
                    </h1>

                    {/* Divider line */}
                    <div className="w-12 h-px bg-neutral-800 my-6" />

                    {/* Message - highly readable layout */}
                    <p className="text-sm sm:text-base text-neutral-400 font-normal leading-relaxed text-balance">
                        {message}
                    </p>

                    {/* Action Area */}
                    <div className="mt-8 sm:mt-10 w-full sm:w-auto">
                        <Link
                            to="/"
                            className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 text-neutral-900 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 focus:ring-offset-neutral-900"
                        >
                            Return to Home Page
                        </Link>
                    </div>

                </div>
            </div>
        </div>

    );
}
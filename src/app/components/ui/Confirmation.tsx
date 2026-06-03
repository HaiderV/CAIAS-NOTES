import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Loader2, AlertTriangle } from "lucide-react";

interface ConfirmationPopupProps {
    isOpen: boolean;
    title?: string;
    message?: string;
    isLoading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    children?: React.ReactNode;
}

export default function ConfirmationPopup({
    isOpen,
    title = "Are you absolutely sure?",
    message = "This action is critical and cannot be undone. Please confirm to proceed.",
    isLoading = false,
    onConfirm,
    onCancel,
    children,
}: ConfirmationPopupProps) {
    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div
                className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/80 backdrop-blur-lg"
                // Prevent click-outside closure to ensure mandatory action
                onClick={(e) => e.stopPropagation()}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="w-full max-w-sm" // Smaller constraint specialized for quick decisions
                >
                    <Card className="border-border shadow-2xl bg-card/90 border relative overflow-hidden">
                        {/* Visual ambient anchors identical to references */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-red-500/20 via-orange-500/20 to-yellow-500/20 rounded-full blur-2xl pointer-events-none" />
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br from-orange-500/20 via-red-500/20 to-amber-500/20 rounded-full blur-2xl pointer-events-none" />

                        <CardHeader className="text-center pt-6 pb-2">
                            {/* Dynamic warning graphic layout */}
                            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-red-600 via-orange-600 to-amber-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-red-500/20">
                                <AlertTriangle className="w-5 h-5 text-white" />
                            </div>
                            <CardTitle className="text-xl font-bold bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 bg-clip-text text-transparent">
                                {title}
                            </CardTitle>
                            <CardDescription className="text-sm text-muted-foreground mt-2 px-2 text-center">
                                {message}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="px-6 pb-6 pt-2">
                            {children && <div className="mb-4">{children}</div>}
                            
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onCancel}
                                    disabled={isLoading}
                                    className="w-full font-medium"
                                >
                                    No
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={onConfirm}
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-medium shadow-md shadow-red-500/10"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : null}
                                    Yes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}

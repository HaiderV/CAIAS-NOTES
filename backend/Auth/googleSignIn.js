import {
    GoogleAuthProvider,
    signInWithPopup,
    fetchSignInMethodsForEmail,
    EmailAuthProvider,
    linkWithCredential,
    deleteUser,
    signOut,
} from "firebase/auth";

import { auth } from "./firebase";

const googleProvider = new GoogleAuthProvider();

// Optional: show only caias accounts in popup
googleProvider.setCustomParameters({
    hd: "caias.in",
});

const googleSignIn = async (password = null) => {
    try {
        const result = await signInWithPopup(auth, googleProvider);

        const user = result.user;

        // Strict college email check
        const collegeRegex = /^\d{2}[a-zA-Z]{3}\d{3}@caias\.in$/;

        if (!collegeRegex.test(user.email)) {

            // Delete unauthorized account from Firebase
            await deleteUser(user);

            // Sign out user
            await signOut(auth);

            return {
                error: "Only valid college emails are allowed",
            };
        }

        // Existing login methods
        const methods = await fetchSignInMethodsForEmail(
            auth,
            user.email
        );

        // Link password if needed
        if (password && !methods.includes("password")) {
            const credential = EmailAuthProvider.credential(
                user.email,
                password
            );

            await linkWithCredential(user, credential);
        }

        return {
            user: {
                uid: user.uid,
                name: user.displayName,
                email: user.email,
                profilePic: user.photoURL,
            },
        };

    } catch (error) {
        return {
            error: error.message,
        };
    }
};

export default googleSignIn;
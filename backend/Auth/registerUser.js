import {
    createUserWithEmailAndPassword,
    fetchSignInMethodsForEmail,
} from "firebase/auth";

import { auth } from "./firebase";

const registerUser = async (email, password) => {
    try {
        // College email restriction
        const collegeEmailRegex = /^[a-zA-Z0-9]+@caias\.in$/;

        if (!collegeEmailRegex.test(email)) {
            return {
                error: "Only college emails (@caias.in) are allowed",
            };
        }

        // Check if account already exists
        const methods = await fetchSignInMethodsForEmail(auth, email);

        if (methods.length > 0) {
            return {
                error: "Account already exists",
            };
        }

        // Create account
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

        return {
            user: userCredential.user,
        };
    } catch (error) {
        return {
            error: error.message,
        };
    }
};

export default registerUser;
import { auth } from "./firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

const loginUser = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        return {
            user: userCredential.user,
        };

    } catch (error) {
        return {
            error: error.code,
        };
    }
};

export default loginUser;
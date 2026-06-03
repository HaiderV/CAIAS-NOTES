import { signOut } from "firebase/auth";
import { auth } from "./firebase";

const logoutUser = async () => {
    try {
        await signOut(auth);
        console.log("Logged out successfully");
    } catch (error) {
        console.log("Error:", error.message);
    }
};

export default logoutUser;
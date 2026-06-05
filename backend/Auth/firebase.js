import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCmwnGTWg8OGcIFl-7Z5jn9wb1dbEf7cJ8",
    authDomain: "caias-notes-6b1a7.firebaseapp.com",
    projectId: "caias-notes-6b1a7",
    storageBucket: "caias-notes-6b1a7.firebasestorage.app",
    messagingSenderId: "380060752690",
    appId: "1:380060752690:web:266982f0f987a50906152b",
    measurementId: "G-4MWN03TZ21"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };

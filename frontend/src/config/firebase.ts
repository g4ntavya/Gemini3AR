// Firebase configuration for RemindAR frontend
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyCVaiwKJLoqjLm2TNtW41z1-LjsU2YAAhs",
    authDomain: "geminiar-dedba.firebaseapp.com",
    projectId: "geminiar-dedba",
    storageBucket: "geminiar-dedba.firebasestorage.app",
    messagingSenderId: "1014489462180",
    appId: "1:1014489462180:web:546dec46b9b71a5bbc7d31",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

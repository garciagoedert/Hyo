// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDHAxBVMI1YUSZMFrK70GYLNGGsiLkf3lc",
  authDomain: "hyo-sys.firebaseapp.com",
  projectId: "hyo-sys",
  storageBucket: "hyo-sys.firebasestorage.app",
  messagingSenderId: "136410381815",
  appId: "1:136410381815:web:1fdad8534d09cae70502f2",
  measurementId: "G-VTP5BXSHXP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Exporta os serviços para que outros módulos possam usá-los
export { auth, db, analytics };

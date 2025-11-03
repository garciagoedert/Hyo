// Importa as funções necessárias do SDK do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

// A configuração do seu aplicativo da web do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAnT0uQWjpXPx8kcPMcY7hIkdvdxUpl9tw",
  authDomain: "hyoassociation.firebaseapp.com",
  projectId: "hyoassociation",
  storageBucket: "hyoassociation.firebasestorage.app",
  messagingSenderId: "411001890013",
  appId: "1:411001890013:web:27b7b4e752d31120646734",
  measurementId: "G-91HB3D1Z9N"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Exporta os serviços para que outros módulos possam usá-los
export { auth, db };

import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = signupForm['signup-email'].value;
        const password = signupForm['signup-password'].value;
        const fullname = signupForm['fullname'].value;
        const birthdate = signupForm['birthdate'].value;
        const escolaId = document.getElementById('escolaId-hidden').value || signupForm['escola'].value;

        if (!escolaId) {
            alert("Por favor, selecione uma escola.");
            return;
        }

        try {
            // 1. Criar usuário no Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const userId = userCredential.user.uid;
            console.log("Usuário criado no Auth com UID:", userId);

            // 2. Criar documento na coleção 'users'
            const userDocRef = doc(db, 'users', userId);
            await setDoc(userDocRef, {
                email: email,
                role: 'aluno',
                escolaId: escolaId,
                profileId: userId
            });
            console.log("Documento 'users' criado com sucesso.");

            // 3. Criar documento na coleção 'perfis'
            const profileDocRef = doc(db, 'perfis', userId);
            await setDoc(profileDocRef, {
                nomeCompleto: fullname,
                dataNascimento: birthdate,
                escolaId: escolaId,
                historicoGraduacao: []
            });
            console.log("Documento 'perfis' criado com sucesso.");

            alert("Cadastro realizado com sucesso! Você será redirecionado para o painel.");
            // O onAuthStateChanged no script.js irá lidar com o redirecionamento
        } catch (error) {
            console.error("Erro durante o processo de cadastro: ", error);
            alert(`Erro no cadastro: ${error.message}`);
        }
    });
});

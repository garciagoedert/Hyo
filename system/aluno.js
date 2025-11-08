import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const profileForm = document.getElementById('profile-form');
    const fullnameInput = document.getElementById('fullname');
    const birthdateInput = document.getElementById('birthdate');
    const emailInput = document.getElementById('profile-email');
    const escolaInput = document.getElementById('escola');

    let currentUser;

    onAuthStateChanged(auth, user => {
        if (user) {
            currentUser = user;
            document.getElementById('user-email').textContent = user.email;
            const userRef = doc(db, 'users', user.uid);
            getDoc(userRef).then(docSnap => {
                if (docSnap.exists() && docSnap.data().role === 'aluno') {
                    loadProfileData(user.uid);
                } else {
                    window.location.href = 'index.html';
                }
            });
        } else {
            window.location.href = 'index.html';
        }
    });

    async function loadProfileData(uid) {
        const profileRef = doc(db, 'perfis', uid);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
            const profile = profileSnap.data();
            fullnameInput.value = profile.nomeCompleto || '';
            birthdateInput.value = profile.dataNascimento || '';
            emailInput.value = currentUser.email;

            if (profile.escolaId) {
                const escolaRef = doc(db, 'escolas', profile.escolaId);
                const escolaSnap = await getDoc(escolaRef);
                if (escolaSnap.exists()) {
                    escolaInput.value = escolaSnap.data().nome;
                }
            }
        }
    }

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const profileRef = doc(db, 'perfis', currentUser.uid);
        
        try {
            await updateDoc(profileRef, {
                nomeCompleto: fullnameInput.value,
                dataNascimento: birthdateInput.value
            });
            alert("Perfil atualizado com sucesso!");
        } catch (error) {
            console.error("Erro ao atualizar perfil: ", error);
            alert("Ocorreu um erro ao atualizar seu perfil.");
        }
    });

    // Lógica de Logout
    const logoutButton = document.querySelector('.btn-logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            signOut(auth).then(() => {
                console.log('Usuário deslogado com sucesso.');
                window.location.href = 'index.html';
            }).catch((error) => {
                console.error('Erro ao fazer logout:', error);
                alert('Erro ao tentar sair.');
            });
        });
    }
});

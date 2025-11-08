import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    // Função para redirecionar o usuário com base no seu papel (role)
    async function redirectUser(uid) {
        const userRef = doc(db, 'users', uid);

        try {
            const docSnap = await getDoc(userRef);
            if (docSnap.exists()) {
                const userData = docSnap.data();
                const role = userData.role;

                console.log(`Usuário ${uid} tem o papel: ${role}`);

                // Lógica de Roteamento por Papel
                switch (role) {
                    case 'admin-hyo':
                        window.location.href = 'admin-hyo-dashboard.html';
                        break;
                    case 'admin-escola':
                        window.location.href = 'admin-escola-dashboard.html';
                        break;
                    case 'aluno':
                        window.location.href = 'aluno-dashboard.html';
                        break;
                    default:
                        console.error('Papel do usuário não reconhecido:', role);
                        await signOut(auth);
                }
            } else {
                console.error("Documento do usuário não encontrado no Firestore!");
                await signOut(auth);
            }
        } catch (error) {
            console.error("Erro ao buscar dados do usuário:", error);
            await signOut(auth);
        }
    }

    // Monitora o estado de autenticação do usuário
    onAuthStateChanged(auth, user => {
        const path = window.location.pathname;
        // Considera qualquer página que contenha 'dashboard' como protegida
        const isProtectedPage = path.includes('dashboard');

        if (user) {
            // Usuário está logado
            console.log('Usuário está logado:', user.uid);
            // Se estiver em uma página pública (que não seja de dashboard), redireciona para o dashboard correto
            if (!isProtectedPage) {
                redirectUser(user.uid);
            }
        } else {
            // Usuário não está logado
            console.log('Nenhum usuário logado.');
            // Se estiver em uma página protegida, redireciona para o login
            if (isProtectedPage) {
                window.location.href = 'index.html';
            }
        }
    });

    // Lida com o envio do formulário de login
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const email = loginForm.email.value;
            const password = loginForm.password.value;

            // --- INÍCIO: LÓGICA HARDCODED APENAS PARA TESTE ---
            // ATENÇÃO: Remova este bloco de código antes de colocar em produção.
            if (email === 'admin@hyo.com' && password === 'admin123') {
                console.log('Login de teste (hardcoded) bem-sucedido! Redirecionando...');
                // Adiciona um parâmetro para indicar o modo de teste
                window.location.href = 'admin-hyo-dashboard.html?testmode=true';
                return; // Impede a execução do login normal via Firebase
            }
            // --- FIM: LÓGICA HARDCODED PARA TESTE ---

            // Lógica normal de login via Firebase para outros usuários
            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    console.log('Login via Firebase bem-sucedido!', userCredential.user);
                    // O onAuthStateChanged irá lidar com o redirecionamento automático
                })
                .catch((error) => {
                    console.error('Erro no login via Firebase:', error);
                    alert(`Erro ao fazer login: ${error.message}`);
                });
        });
    }

    // Lógica de Logout
    const logoutButtons = document.querySelectorAll('.btn-logout');
    logoutButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            signOut(auth).catch((error) => {
                console.error('Erro ao fazer logout:', error);
            });
        });
    });
});

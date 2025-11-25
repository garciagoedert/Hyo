import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const loginForm = document.getElementById('login-form');
const togglePasswordBtn = document.getElementById('toggle-password');
const passwordInput = document.getElementById('password');

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

// Toggle Password Visibility
if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent any default button behavior
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);

        // Toggle icons - Scoped to the button to avoid finding wrong elements
        const eyeIcon = togglePasswordBtn.querySelector('.eye-icon');
        const eyeOffIcon = togglePasswordBtn.querySelector('.eye-off-icon');

        if (eyeIcon && eyeOffIcon) {
            eyeIcon.classList.toggle('hidden');
            eyeOffIcon.classList.toggle('hidden');
        }
    });
}

// Error Display Function
function showError(message) {
    const errorContainer = document.getElementById('login-error');
    if (!errorContainer) return;

    const errorText = errorContainer.querySelector('.error-text');
    if (errorText) {
        errorText.textContent = message;
    }

    errorContainer.classList.remove('hidden');

    // Shake animation reset
    errorContainer.style.animation = 'none';
    errorContainer.offsetHeight; /* trigger reflow */
    errorContainer.style.animation = null;
}

// Lida com o envio do formulário de login
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = loginForm.email.value;
        const password = loginForm.password.value;
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        // Disable button during processing
        submitBtn.disabled = true;
        const originalBtnContent = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span>Entrando...</span>';

        // --- INÍCIO: LÓGICA HARDCODED APENAS PARA TESTE ---
        // ATENÇÃO: Remova este bloco de código antes de colocar em produção.
        if (email === 'admin@hyo.com' && password === 'admin123') {
            console.log('Login de teste (hardcoded) bem-sucedido! Redirecionando...');
            window.location.href = 'admin-hyo-dashboard.html?testmode=true';
            return;
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

                let errorMessage = 'Ocorreu um erro ao fazer login. Tente novamente.';

                console.log('Error code:', error.code); // Debug log

                switch (error.code) {
                    case 'auth/invalid-email':
                        errorMessage = 'O email informado é inválido.';
                        break;
                    case 'auth/user-disabled':
                        errorMessage = 'Este usuário foi desativado.';
                        break;
                    case 'auth/user-not-found':
                        errorMessage = 'Email não cadastrado.';
                        break;
                    case 'auth/wrong-password':
                        errorMessage = 'Senha incorreta.';
                        break;
                    case 'auth/invalid-credential':
                        errorMessage = 'Email ou senha incorretos.';
                        break;
                    case 'auth/network-request-failed':
                        errorMessage = 'Erro de conexão. Verifique sua internet.';
                        break;
                }

                console.log('Final error message:', errorMessage); // Debug log
                showError(errorMessage);

                // Re-enable button
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnContent;
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

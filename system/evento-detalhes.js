import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const eventoId = urlParams.get('id');

    onAuthStateChanged(auth, user => {
        if (user) {
            document.getElementById('user-email').textContent = user.email;
            checkUserRole(user.uid, eventoId);
        } else {
            window.location.href = 'index.html';
        }
    });

    async function checkUserRole(uid, eventoId) {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const user = userSnap.data();
            if (user.role === 'admin-hyo' || user.role === 'admin-escola') {
                document.getElementById('admin-view').style.display = 'block';
            } else {
                document.getElementById('aluno-view').style.display = 'block';
            }
            loadEventDetails(eventoId);
        }
    }

    async function loadEventDetails(id) {
        const eventoRef = doc(db, 'eventos', id);
        const eventoSnap = await getDoc(eventoRef);

        if (eventoSnap.exists()) {
            const evento = eventoSnap.data();
            document.getElementById('evento-nome').textContent = evento.nome;
            document.getElementById('evento-data').textContent = `Data: ${evento.data}`;
        } else {
            console.error("Evento não encontrado!");
        }
    }

    const inscricaoForm = document.getElementById('inscricao-form');
    if (inscricaoForm) {
        inscricaoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const categoria = document.getElementById('categoria').value;
            // Lógica de pagamento a ser implementada
            alert(`Inscrição na categoria ${categoria} registrada. Redirecionando para pagamento...`);
        });
    }

    const roundForm = document.getElementById('round-form');
    if (roundForm) {
        roundForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Lógica para criar o round
            alert('Round criado com sucesso!');
        });

        const searchInput = document.getElementById('round-alunos-search');
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const options = document.querySelectorAll('#round-alunos option');
            options.forEach(option => {
                const shouldShow = option.textContent.toLowerCase().includes(searchTerm);
                option.style.display = shouldShow ? '' : 'none';
            });
        });
    }
});

import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    // Elementos da interface
    const userEmailSpan = document.getElementById('user-email');
    const logoutButton = document.querySelector('.btn-logout');
    const faixaAtualNome = document.getElementById('faixa-atual-nome');
    const xpBar = document.getElementById('xp-bar');
    const progressoPercentual = document.getElementById('progresso-percentual');
    const tecnicasListAluno = document.getElementById('tecnicas-list-aluno');
    const displayFullname = document.getElementById('display-fullname');
    const displayEscola = document.getElementById('display-escola');
    const displayEmail = document.getElementById('display-email');

    let currentUser;

    onAuthStateChanged(auth, user => {
        if (user) {
            currentUser = user;
            userEmailSpan.textContent = user.email;
            displayEmail.textContent = user.email;
            loadAlunoData(user.uid);
        } else {
            window.location.href = 'index.html';
        }
    });

    async function loadAlunoData(uid) {
        const perfilRef = doc(db, 'perfis', uid);
        const perfilSnap = await getDoc(perfilRef);

        if (!perfilSnap.exists()) {
            console.error("Perfil do aluno não encontrado.");
            return;
        }

        const perfil = perfilSnap.data();
        displayFullname.textContent = perfil.nomeCompleto;
        
        if (perfil.escolaId) {
            const escolaRef = doc(db, 'escolas', perfil.escolaId);
            const escolaSnap = await getDoc(escolaRef);
            if (escolaSnap.exists()) {
                displayEscola.textContent = escolaSnap.data().nome;
            }
        }

        const faixaId = perfil.faixaId || 'branca';
        faixaAtualNome.textContent = faixaId.replace('-', ' ');

        loadJornadaEProgresso(uid, faixaId);
    }

    async function loadJornadaEProgresso(alunoId, faixaId) {
        // 1. Buscar o currículo da faixa
        const curriculoRef = doc(db, 'curriculo', faixaId);
        const curriculoSnap = await getDoc(curriculoRef);

        if (!curriculoSnap.exists()) {
            tecnicasListAluno.innerHTML = '<p>Currículo não disponível.</p>';
            return;
        }
        const curriculo = curriculoSnap.data();
        const totalTecnicas = curriculo.tecnicas.length;

        // 2. Buscar o progresso do aluno
        const progressoRef = doc(db, 'progresso_alunos', `${alunoId}_${faixaId}`);
        const progressoSnap = await getDoc(progressoRef);
        const progresso = progressoSnap.exists() ? progressoSnap.data().tecnicas : {};

        // 3. Renderizar técnicas e calcular progresso
        tecnicasListAluno.innerHTML = '';
        let tecnicasDominadas = 0;
        curriculo.tecnicas.forEach(tecnica => {
            const isDominada = progresso[tecnica] === 'dominado';
            if (isDominada) {
                tecnicasDominadas++;
            }
            const item = `
                <div class="tecnica-aluno-item ${isDominada ? 'dominada' : ''}">
                    <span class="status-icon">${isDominada ? '✓' : ''}</span>
                    <span>${tecnica}</span>
                </div>
            `;
            tecnicasListAluno.innerHTML += item;
        });

        // 4. Atualizar a barra de progresso
        const percentual = totalTecnicas > 0 ? Math.round((tecnicasDominadas / totalTecnicas) * 100) : 0;
        progressoPercentual.textContent = `${percentual}%`;
        xpBar.style.width = `${percentual}%`;
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            signOut(auth).then(() => {
                window.location.href = 'index.html';
            }).catch((error) => {
                console.error('Erro ao fazer logout:', error);
            });
        });
    }
});

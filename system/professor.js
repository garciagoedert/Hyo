import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { collection, query, where, getDocs, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const turmaForm = document.getElementById('turma-form');
    const alunosListSection = document.getElementById('alunos-list-section');
    const alunosTableBody = document.querySelector('#alunos-table tbody');
    const saveAttendanceBtn = document.getElementById('save-attendance-btn');
    const avaliacaoModal = document.getElementById('avaliacao-modal');
    const closeModalButton = avaliacaoModal.querySelector('.close-button');
    const alunoNomeModal = document.getElementById('aluno-nome-modal');
    const alunoFaixaModal = document.getElementById('aluno-faixa-modal');
    const alunoCurriculoModal = document.getElementById('aluno-curriculo-modal');
    const salvarAvaliacaoBtn = document.getElementById('salvar-avaliacao-btn');

    let currentUser = null;
    let professorId = null;
    let escolaId = null;
    let currentAlunoId = null;

    onAuthStateChanged(auth, user => {
        if (user) {
            currentUser = user;
            const userRef = doc(db, 'users', user.uid);
            getDoc(userRef).then(docSnap => {
                if (docSnap.exists() && docSnap.data().role === 'professor') {
                    professorId = user.uid;
                    escolaId = docSnap.data().escolaId;
                    // Carregar turmas do professor, etc.
                } else {
                    window.location.href = 'index.html';
                }
            });
        } else {
            window.location.href = 'index.html';
        }
    });

    turmaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const turmaId = document.getElementById('turma').value;
        if (!turmaId) return;

        // Lógica para carregar alunos da turma selecionada do Firestore
        // Esta é uma simplificação. A estrutura real pode envolver uma coleção 'turmas'
        const q = query(collection(db, "perfis"), where("escolaId", "==", escolaId), where("turmaId", "==", turmaId));
        const querySnapshot = await getDocs(q);
        
        alunosTableBody.innerHTML = '';
        querySnapshot.forEach(doc => {
            const aluno = doc.data();
            const row = `
                <tr data-id="${doc.id}">
                    <td>${aluno.nomeCompleto}</td>
                    <td><input type="checkbox" class="presenca-check"></td>
                    <td><button class="btn btn-secondary btn-sm btn-avaliar">Avaliar Progresso</button></td>
                </tr>
            `;
            alunosTableBody.innerHTML += row;
        });
        alunosListSection.style.display = 'block';
    });

    alunosTableBody.addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-avaliar')) {
            const row = e.target.closest('tr');
            currentAlunoId = row.dataset.id;
            openAvaliacaoModal(currentAlunoId);
        }
    });

    async function openAvaliacaoModal(alunoId) {
        const perfilRef = doc(db, 'perfis', alunoId);
        const perfilSnap = await getDoc(perfilRef);
        if (!perfilSnap.exists()) return;

        const perfil = perfilSnap.data();
        const faixaId = perfil.faixaId || 'branca'; // Ex: 'branca', 'ponta-amarela'

        alunoNomeModal.textContent = perfil.nomeCompleto;
        alunoFaixaModal.textContent = faixaId.replace('-', ' ');

        // Carregar currículo da faixa
        const curriculoRef = doc(db, 'curriculo', faixaId);
        const curriculoSnap = await getDoc(curriculoRef);

        // Carregar progresso do aluno
        const progressoRef = doc(db, 'progresso_alunos', `${alunoId}_${faixaId}`);
        const progressoSnap = await getDoc(progressoRef);
        const progresso = progressoSnap.exists() ? progressoSnap.data().tecnicas : {};

        alunoCurriculoModal.innerHTML = '';
        if (curriculoSnap.exists()) {
            const curriculo = curriculoSnap.data();
            curriculo.tecnicas.forEach(tecnica => {
                const isDominada = progresso[tecnica] === 'dominado';
                const item = `
                    <div class="tecnica-avaliacao-item">
                        <label>
                            <input type="checkbox" data-tecnica="${tecnica}" ${isDominada ? 'checked' : ''}>
                            ${tecnica}
                        </label>
                    </div>
                `;
                alunoCurriculoModal.innerHTML += item;
            });
        } else {
            alunoCurriculoModal.innerHTML = '<p>Currículo para esta faixa não encontrado.</p>';
        }

        avaliacaoModal.style.display = 'block';
    }

    salvarAvaliacaoBtn.addEventListener('click', async () => {
        const faixaId = alunoFaixaModal.textContent.replace(' ', '-');
        const progressoRef = doc(db, 'progresso_alunos', `${currentAlunoId}_${faixaId}`);
        
        const tecnicasProgresso = {};
        const checkboxes = alunoCurriculoModal.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
            tecnicasProgresso[cb.dataset.tecnica] = cb.checked ? 'dominado' : 'em_pratica';
        });

        try {
            await setDoc(progressoRef, { tecnicas: tecnicasProgresso }, { merge: true });
            alert('Progresso salvo com sucesso!');
            avaliacaoModal.style.display = 'none';
        } catch (error) {
            console.error("Erro ao salvar progresso: ", error);
            alert('Erro ao salvar o progresso.');
        }
    });

    closeModalButton.addEventListener('click', () => {
        avaliacaoModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target == avaliacaoModal) {
            avaliacaoModal.style.display = 'none';
        }
    });
});

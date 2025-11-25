import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { collection, query, where, getDocs, addDoc, doc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const professoresTableBody = document.querySelector('#professores-table tbody');
    const alunosTableBody = document.querySelector('#alunos-table tbody');

    const addProfessorBtn = document.getElementById('add-professor-btn');
    const addProfessorModal = document.getElementById('add-professor-modal');
    const addProfessorForm = document.getElementById('add-professor-form');

    const addAlunoBtn = document.getElementById('add-aluno-btn');
    const addAlunoModal = document.getElementById('add-aluno-modal');
    const addAlunoForm = document.getElementById('add-aluno-form');

    const closeButtons = document.querySelectorAll('.close-button');
    const logoutButton = document.querySelector('.btn-logout');

    let currentEscolaId = null;

    // Auth Check
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(userRef);

            if (docSnap.exists() && docSnap.data().role === 'admin-escola') {
                console.log("Admin Escola autenticado.");
                // Assuming the admin-escola user document has an 'escolaId' field
                // If not, we might need to query the 'escolas' collection to find which school they manage
                const userData = docSnap.data();

                if (userData.escolaId) {
                    currentEscolaId = userData.escolaId;
                    loadDashboardData();
                } else {
                    // Fallback: Query schools to find where this user is the admin
                    const escolasQuery = query(collection(db, 'escolas'), where('adminResponsavelId', '==', user.uid));
                    const escolasSnap = await getDocs(escolasQuery);
                    if (!escolasSnap.empty) {
                        currentEscolaId = escolasSnap.docs[0].id;
                        loadDashboardData();
                    } else {
                        console.error("Este admin não está associado a nenhuma escola.");
                        alert("Erro: Você não está associado a nenhuma escola.");
                    }
                }
            } else {
                window.location.href = 'index.html';
            }
        } else {
            window.location.href = 'index.html';
        }
    });

    function loadDashboardData() {
        loadProfessores();
        loadAlunos();
    }

    // --- PROFESSORES ---

    async function loadProfessores() {
        if (!currentEscolaId) return;

        professoresTableBody.innerHTML = '<tr><td colspan="4">Carregando...</td></tr>';

        const q = query(collection(db, 'users'), where('role', '==', 'professor'), where('escolaId', '==', currentEscolaId));
        const querySnapshot = await getDocs(q);

        professoresTableBody.innerHTML = '';

        if (querySnapshot.empty) {
            professoresTableBody.innerHTML = '<tr><td colspan="4">Nenhum professor cadastrado.</td></tr>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const prof = doc.data();
            const row = `
                <tr>
                    <td>${prof.displayName || prof.nome || 'Sem Nome'}</td>
                    <td>${prof.email}</td>
                    <td>${prof.faixa || '-'}</td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="deleteUser('${doc.id}', 'professor')">Remover</button>
                    </td>
                </tr>
            `;
            professoresTableBody.innerHTML += row;
        });
    }

    addProfessorBtn.addEventListener('click', () => {
        addProfessorModal.style.display = 'block';
    });

    addProfessorForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nome = document.getElementById('prof-nome').value;
        const email = document.getElementById('prof-email').value;
        const password = document.getElementById('prof-password').value; // In a real app, we'd use this to create Auth
        const faixa = document.getElementById('prof-faixa').value;

        try {
            // 1. Create User in Firestore (Simulating Auth creation for now)
            // In a real scenario with Cloud Functions, we would call a function here.
            // For this local emulator demo, we will just add the doc to 'users'.
            // NOTE: The user won't be able to actually login unless we create them in Auth.
            // Since we can't easily create a secondary user without logging out, 
            // we will assume a Cloud Function trigger would handle the Auth creation, 
            // OR we just store the data for display purposes.

            // To make it functional for the demo, we'll just add to Firestore.
            // The 'password' field shouldn't be stored in plain text in a real app.

            await addDoc(collection(db, 'users'), {
                displayName: nome,
                email: email,
                role: 'professor',
                escolaId: currentEscolaId,
                faixa: faixa,
                createdAt: new Date()
            });

            alert('Professor adicionado com sucesso! (Nota: Em produção, um email de convite seria enviado)');
            addProfessorModal.style.display = 'none';
            addProfessorForm.reset();
            loadProfessores();

        } catch (error) {
            console.error("Erro ao adicionar professor:", error);
            alert("Erro ao adicionar professor.");
        }
    });

    // --- ALUNOS ---

    async function loadAlunos() {
        if (!currentEscolaId) return;

        alunosTableBody.innerHTML = '<tr><td colspan="4">Carregando...</td></tr>';

        const q = query(collection(db, 'users'), where('role', '==', 'aluno'), where('escolaId', '==', currentEscolaId));
        const querySnapshot = await getDocs(q);

        alunosTableBody.innerHTML = '';

        if (querySnapshot.empty) {
            alunosTableBody.innerHTML = '<tr><td colspan="4">Nenhum aluno cadastrado.</td></tr>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const aluno = doc.data();
            const row = `
                <tr>
                    <td>${aluno.displayName || aluno.nome || 'Sem Nome'}</td>
                    <td>${aluno.email}</td>
                    <td>${aluno.faixa || '-'}</td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="deleteUser('${doc.id}', 'aluno')">Remover</button>
                    </td>
                </tr>
            `;
            alunosTableBody.innerHTML += row;
        });
    }

    addAlunoBtn.addEventListener('click', () => {
        addAlunoModal.style.display = 'block';
    });

    addAlunoForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nome = document.getElementById('aluno-nome').value;
        const email = document.getElementById('aluno-email').value;
        const password = document.getElementById('aluno-password').value;
        const faixa = document.getElementById('aluno-faixa').value;

        try {
            await addDoc(collection(db, 'users'), {
                displayName: nome,
                email: email,
                role: 'aluno',
                escolaId: currentEscolaId,
                faixa: faixa,
                createdAt: new Date(),
                xp: 0 // Initial XP
            });

            alert('Aluno adicionado com sucesso!');
            addAlunoModal.style.display = 'none';
            addAlunoForm.reset();
            loadAlunos();

        } catch (error) {
            console.error("Erro ao adicionar aluno:", error);
            alert("Erro ao adicionar aluno.");
        }
    });

    // --- GLOBAL UTILS ---

    window.deleteUser = async (id, type) => {
        if (confirm(`Tem certeza que deseja remover este ${type}?`)) {
            try {
                await deleteDoc(doc(db, 'users', id));
                alert(`${type.charAt(0).toUpperCase() + type.slice(1)} removido com sucesso.`);
                if (type === 'professor') loadProfessores();
                if (type === 'aluno') loadAlunos();
            } catch (error) {
                console.error("Erro ao remover usuário:", error);
                alert("Erro ao remover usuário.");
            }
        }
    };

    // Modal Close Logic
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            addProfessorModal.style.display = 'none';
            addAlunoModal.style.display = 'none';
        });
    });

    window.addEventListener('click', (event) => {
        if (event.target == addProfessorModal) addProfessorModal.style.display = 'none';
        if (event.target == addAlunoModal) addAlunoModal.style.display = 'none';
    });

    // Logout
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            signOut(auth).then(() => {
                window.location.href = 'index.html';
            });
        });
    }
});

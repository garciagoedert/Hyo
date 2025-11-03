import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { collection, onSnapshot, doc, getDoc, deleteDoc, addDoc } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
// Importe a função httpsCallable para chamar a Cloud Function
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-functions.js";

document.addEventListener('DOMContentLoaded', () => {
    const escolasTableBody = document.querySelector('#escolas-table tbody');
    const addEscolaBtn = document.querySelector('#add-escola-btn');
    const createAdminForm = document.getElementById('create-admin-escola-form');
    const championshipsTableBody = document.querySelector('#championships-table tbody');
    const createChampionshipForm = document.getElementById('create-championship-form');

    const urlParams = new URLSearchParams(window.location.search);
    const isTestMode = urlParams.get('testmode') === 'true';

    if (isTestMode) {
        console.warn("MODO DE TESTE ATIVADO. A verificação de autenticação foi ignorada.");
        // No modo de teste, não podemos carregar dados reais do Firestore
        // pois não há usuário. Apenas deixamos a página ser exibida.
        // Você pode adicionar dados falsos aqui se quiser visualizar a tabela.
    } else {
        onAuthStateChanged(auth, user => {
            if (user) {
                const userRef = doc(db, 'users', user.uid);
                getDoc(userRef).then(docSnap => {
                if (docSnap.exists() && docSnap.data().role === 'admin-hyo') {
                    console.log("Admin Hyo autenticado. Carregando dados...");
                    loadEscolas();
                    loadChampionships();
                } else {
                        console.log("Usuário não é Admin Hyo. Redirecionando...");
                        window.location.href = 'index.html';
                    }
                });
            } else {
                console.log("Nenhum usuário logado. Redirecionando...");
                window.location.href = 'index.html';
            }
        });
    }

    function loadChampionships() {
        const championshipsCollection = collection(db, 'eventos');
        onSnapshot(championshipsCollection, snapshot => {
            championshipsTableBody.innerHTML = '';
            if (snapshot.empty) {
                championshipsTableBody.innerHTML = `<tr><td colspan="3">Nenhum campeonato encontrado.</td></tr>`;
                return;
            }
            snapshot.forEach(doc => {
                const champ = doc.data();
                const row = `
                    <tr>
                        <td>${champ.nome}</td>
                        <td>${champ.data}</td>
                        <td>
                            <button class="btn btn-danger" data-id="${doc.id}">Excluir</button>
                        </td>
                    </tr>
                `;
                championshipsTableBody.innerHTML += row;
            });
        });
    }

    function loadEscolas() {
        const escolasCollection = collection(db, 'escolas');
        onSnapshot(escolasCollection, snapshot => {
            escolasTableBody.innerHTML = '';
            if (snapshot.empty) {
                escolasTableBody.innerHTML = `<tr><td colspan="4">Nenhuma escola encontrada.</td></tr>`;
                return;
            }
            snapshot.forEach(doc => {
                const escola = doc.data();
                const row = `
                    <tr>
                        <td>${escola.nome}</td>
                        <td>${escola.cidade}</td>
                        <td>${escola.adminResponsavelId || 'Não definido'}</td>
                        <td>
                            <button class="btn btn-secondary" data-id="${doc.id}">Editar</button>
                            <button class="btn btn-danger" data-id="${doc.id}">Excluir</button>
                        </td>
                    </tr>
                `;
                escolasTableBody.innerHTML += row;
            });
        }, error => {
            console.error("Erro ao carregar escolas: ", error);
        });
    }

    escolasTableBody.addEventListener('click', async (e) => {
        const target = e.target;
        const id = target.dataset.id;

        if (target.classList.contains('btn-danger')) {
            const table = target.closest('table');
            if (table.id === 'escolas-table') {
                if (confirm(`Tem certeza que deseja excluir a escola com ID: ${id}?`)) {
                    try {
                        await deleteDoc(doc(db, 'escolas', id));
                        console.log("Escola excluída com sucesso!");
                    } catch (error) {
                        console.error("Erro ao excluir escola: ", error);
                    }
                }
            }
        }
        if (target.classList.contains('btn-secondary')) {
            alert(`Funcionalidade de edição para o ID ${id} a ser implementada com um modal.`);
        }
    });

    addEscolaBtn.addEventListener('click', async () => {
        const nome = prompt("Digite o nome da nova escola:");
        const cidade = prompt("Digite a cidade da nova escola:");

        if (nome && cidade) {
            try {
                const docRef = await addDoc(collection(db, 'escolas'), {
                    nome: nome,
                    cidade: cidade,
                    adminResponsavelId: null
                });
                console.log("Escola adicionada com ID: ", docRef.id);
            } catch (error) {
                console.error("Erro ao adicionar escola: ", error);
            }
        } else {
            alert("Nome e cidade são obrigatórios.");
        }
    });

    createAdminForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = createAdminForm['admin-email'].value;
        const password = createAdminForm['admin-password'].value;
        const escolaId = createAdminForm['escola-assoc'].value;

        if (!email || !password || !escolaId) {
            alert("Todos os campos são obrigatórios para criar um admin.");
            return;
        }

        const functions = getFunctions();
        const createAdminEscola = httpsCallable(functions, 'createAdminEscola');
        
        try {
            const result = await createAdminEscola({ email, password, escolaId });
            console.log("Resultado da Cloud Function:", result.data);
            alert(result.data.message);
            createAdminForm.reset();
        } catch (error) {
            console.error("Erro ao chamar a Cloud Function:", error);
            alert(`Erro: ${error.message}`);
        }
    });

    createChampionshipForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = createChampionshipForm['championship-name'].value;
        const data = createChampionshipForm['championship-date'].value;

        if (nome && data) {
            try {
                await addDoc(collection(db, 'eventos'), {
                    nome: nome,
                    data: data,
                    tipo: 'campeonato' // Tipo fixo para este formulário
                });
                console.log("Campeonato adicionado com sucesso!");
                createChampionshipForm.reset();
            } catch (error) {
                console.error("Erro ao criar campeonato: ", error);
                alert("Erro ao criar campeonato.");
            }
        }
    });

    championshipsTableBody.addEventListener('click', async (e) => {
        const target = e.target;
        if (target.classList.contains('btn-danger')) {
            const id = target.dataset.id;
            if (confirm(`Tem certeza que deseja excluir o campeonato com ID: ${id}?`)) {
                try {
                    await deleteDoc(doc(db, 'eventos', id));
                    console.log("Campeonato excluído com sucesso!");
                } catch (error) {
                    console.error("Erro ao excluir campeonato: ", error);
                }
            }
        }
    });
});

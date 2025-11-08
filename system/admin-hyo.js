import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { collection, onSnapshot, doc, getDoc, deleteDoc, addDoc, query, where, getDocs, updateDoc, orderBy, limit } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
// Importe a função httpsCallable para chamar a Cloud Function
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-functions.js";

document.addEventListener('DOMContentLoaded', () => {
    const escolasTableBody = document.querySelector('#escolas-table tbody');
    const addEscolaBtn = document.querySelector('#add-escola-btn');
    const createAdminForm = document.getElementById('create-admin-escola-form');
    const championshipsTableBody = document.querySelector('#championships-table tbody');
    const createChampionshipForm = document.getElementById('create-championship-form');
    const editEscolaModal = document.getElementById('edit-escola-modal');
    const editEscolaForm = document.getElementById('edit-escola-form');
    const closeModalButton = document.querySelector('.close-button');
    const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
    const editChampionshipModal = document.getElementById('edit-championship-modal');
    const editChampionshipForm = document.getElementById('edit-championship-form');
    const contentSections = document.querySelectorAll('.dashboard-main-content .card');

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
                document.getElementById('user-email').textContent = user.email;
                const userRef = doc(db, 'users', user.uid);
                getDoc(userRef).then(docSnap => {
                if (docSnap.exists() && docSnap.data().role === 'admin-hyo') {
                    console.log("Admin Hyo autenticado. Carregando dados...");
                    loadEscolas();
                    loadChampionships();
                    loadMetrics();
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

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);

            document.querySelectorAll('.dashboard-main-content > .container > .card').forEach(section => {
                section.style.display = section.id === targetId ? 'block' : 'none';
            });

            sidebarLinks.forEach(navLink => {
                navLink.parentElement.classList.remove('active');
            });
            link.parentElement.classList.add('active');
        });
    });

    function loadActivityFeed() {
        const feedList = document.getElementById('activity-feed-list');
        const activitiesCollection = collection(db, 'activities');
        const q = query(activitiesCollection, orderBy('timestamp', 'desc'), limit(10));

        onSnapshot(q, (snapshot) => {
            feedList.innerHTML = '';
            if (snapshot.empty) {
                feedList.innerHTML = '<li>Nenhuma atividade recente.</li>';
                return;
            }
            snapshot.forEach(doc => {
                const activity = doc.data();
                const item = document.createElement('li');
                const time = activity.timestamp ? activity.timestamp.toDate().toLocaleString('pt-BR') : 'agora';
                item.innerHTML = `<strong>${activity.user}</strong> ${activity.action} - <em>${time}</em>`;
                feedList.appendChild(item);
            });
        });
    }
    loadActivityFeed();

    async function loadMetrics() {
        // Total de Escolas
        const escolasCollection = collection(db, 'escolas');
        const escolasSnapshot = await getDocs(escolasCollection);
        document.getElementById('total-escolas').textContent = escolasSnapshot.size;

        // Total de Alunos
        const alunosQuery = query(collection(db, 'users'), where('role', '==', 'aluno'));
        const alunosSnapshot = await getDocs(alunosQuery);
        document.getElementById('total-alunos').textContent = alunosSnapshot.size;

        // Total de Faixas Pretas (Exemplo, a lógica real pode variar)
        // Esta é uma consulta mais complexa e pode exigir uma estrutura de dados diferente
        // Por enquanto, vamos simular, mas a ideia é filtrar perfis
        document.getElementById('total-faixas-pretas').textContent = 'N/A'; // Simulado

        // Total de Eventos
        const eventosCollection = collection(db, 'eventos');
        const eventosSnapshot = await getDocs(eventosCollection);
        document.getElementById('total-eventos').textContent = eventosSnapshot.size;

        renderMetricsChart(escolasSnapshot.size, alunosSnapshot.size, 0, eventosSnapshot.size);
    }

    function renderMetricsChart(escolas, alunos, faixasPretas, eventos) {
        const ctx = document.getElementById('metrics-chart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Escolas', 'Alunos', 'Faixas Pretas', 'Eventos'],
                datasets: [{
                    label: 'Visão Geral',
                    data: [escolas, alunos, faixasPretas, eventos],
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(255, 206, 86, 0.2)',
                        'rgba(75, 192, 192, 0.2)'
                    ],
                    borderColor: [
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                responsive: true,
                maintainAspectRatio: false
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
                        <td><a href="evento-detalhes.html?id=${doc.id}">${champ.nome}</a></td>
                        <td>${champ.data}</td>
                        <td>
                            <button class="btn btn-secondary btn-edit-championship" data-id="${doc.id}">Editar</button>
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
        const button = target.closest('button[data-id]');

        if (!button) {
            return;
        }

        const id = button.dataset.id;

        if (button.classList.contains('btn-danger')) {
            const table = button.closest('table');
            if (table && table.id === 'escolas-table') {
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
        if (button.classList.contains('btn-secondary')) {
            openEditModal(id);
        }
    });

    async function openEditModal(escolaId) {
        const escolaRef = doc(db, 'escolas', escolaId);
        const escolaSnap = await getDoc(escolaRef);
        if (!escolaSnap.exists()) {
            console.error("Escola não encontrada!");
            return;
        }
        const escola = escolaSnap.data();

        document.getElementById('edit-escola-id').value = escolaId;
        document.getElementById('edit-escola-nome').value = escola.nome;
        document.getElementById('edit-escola-cidade').value = escola.cidade;

        const adminSelect = document.getElementById('edit-admin-responsavel');
        adminSelect.innerHTML = '<option value="">Nenhum</option>';

        const adminsQuery = query(collection(db, 'users'), where('role', '==', 'admin-escola'));
        const adminsSnapshot = await getDocs(adminsQuery);
        adminsSnapshot.forEach(adminDoc => {
            const admin = adminDoc.data();
            const option = new Option(`${admin.email} (ID: ${adminDoc.id})`, adminDoc.id);
            option.selected = adminDoc.id === escola.adminResponsavelId;
            adminSelect.add(option);
        });

        editEscolaModal.style.display = 'block';
    }

    closeModalButton.addEventListener('click', () => {
        editEscolaModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target == editEscolaModal) {
            editEscolaModal.style.display = 'none';
        }
    });

    editEscolaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const escolaId = document.getElementById('edit-escola-id').value;
        const nome = document.getElementById('edit-escola-nome').value;
        const cidade = document.getElementById('edit-escola-cidade').value;
        const adminResponsavelId = document.getElementById('edit-admin-responsavel').value;

        const escolaRef = doc(db, 'escolas', escolaId);
        try {
            await updateDoc(escolaRef, {
                nome: nome,
                cidade: cidade,
                adminResponsavelId: adminResponsavelId || null
            });
            console.log("Escola atualizada com sucesso!");
            editEscolaModal.style.display = 'none';
        } catch (error) {
            console.error("Erro ao atualizar escola: ", error);
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
        const button = target.closest('button[data-id]');

        if (!button) return;

        const id = button.dataset.id;

        if (button.classList.contains('btn-danger')) {
            if (confirm(`Tem certeza que deseja excluir o campeonato com ID: ${id}?`)) {
                try {
                    await deleteDoc(doc(db, 'eventos', id));
                    console.log("Campeonato excluído com sucesso!");
                } catch (error) {
                    console.error("Erro ao excluir campeonato: ", error);
                }
            }
        } else if (button.classList.contains('btn-edit-championship')) {
            openEditChampionshipModal(id);
        }
    });

    async function openEditChampionshipModal(championshipId) {
        const championshipRef = doc(db, 'eventos', championshipId);
        const championshipSnap = await getDoc(championshipRef);
        if (!championshipSnap.exists()) {
            console.error("Campeonato não encontrado!");
            return;
        }
        const championship = championshipSnap.data();

        document.getElementById('edit-championship-id').value = championshipId;
        document.getElementById('edit-championship-name').value = championship.nome;
        document.getElementById('edit-championship-date').value = championship.data;

        editChampionshipModal.style.display = 'block';
    }

    editChampionshipForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const championshipId = document.getElementById('edit-championship-id').value;
        const nome = document.getElementById('edit-championship-name').value;
        const data = document.getElementById('edit-championship-date').value;

        const championshipRef = doc(db, 'eventos', championshipId);
        try {
            await updateDoc(championshipRef, {
                nome: nome,
                data: data
            });
            console.log("Campeonato atualizado com sucesso!");
            editChampionshipModal.style.display = 'none';
        } catch (error) {
            console.error("Erro ao atualizar campeonato: ", error);
        }
    });

    document.querySelectorAll('.modal .close-button').forEach(button => {
        button.addEventListener('click', (e) => {
            e.target.closest('.modal').style.display = 'none';
        });
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

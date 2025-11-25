import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut, updateProfile, updatePassword } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { collection, onSnapshot, doc, getDoc, deleteDoc, addDoc, query, where, getDocs, updateDoc, orderBy, limit, setDoc } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-functions.js";


const init = () => {
    console.log("Admin Hyo Dashboard initialized");

    // --- DOM ELEMENTS DEFINITIONS ---
    const escolasTableBody = document.querySelector('#escolas-table tbody');
    const addEscolaBtn = document.querySelector('#add-escola-btn');
    const sidebarLinks = document.querySelectorAll('.sidebar-nav a, .sidebar-link');

    // Modals & Forms
    const editEscolaModal = document.getElementById('edit-escola-modal');
    const editEscolaForm = document.getElementById('edit-escola-form');
    const createAdminForm = document.getElementById('create-admin-form');
    const createChampionshipForm = document.getElementById('create-championship-form');
    const editChampionshipModal = document.getElementById('edit-championship-modal');
    const editChampionshipForm = document.getElementById('edit-championship-form');
    const profileForm = document.getElementById('profile-form');

    // Tables & Lists
    const championshipsTableBody = document.querySelector('#championships-table tbody');
    const tecnicasList = document.getElementById('tecnicas-list');

    // Inputs & Buttons
    const novaTecnicaInput = document.getElementById('nova-tecnica-input');
    const salvarCurriculoBtn = document.getElementById('salvar-curriculo-btn');
    const faixaSelect = document.getElementById('faixa-select');
    const addTecnicaBtn = document.getElementById('add-tecnica-btn');

    // Logout
    const logoutButton = document.querySelector('.btn-logout');

    let curriculoData = {};
    let faixas = ["branca", "ponta-amarela", "amarela", "ponta-verde", "verde", "ponta-azul", "azul", "ponta-vermelha", "vermelha", "ponta-preta", "preta"];

    // --- AUTHENTICATION CHECK ---
    const urlParams = new URLSearchParams(window.location.search);
    const isTestMode = urlParams.get('testmode') === 'true';

    if (isTestMode) {
        console.warn("MODO DE TESTE ATIVADO.");
    } else {
        onAuthStateChanged(auth, user => {
            if (user) {
                const userEmailEl = document.getElementById('user-email');
                if (userEmailEl) userEmailEl.textContent = user.email;

                const userRef = doc(db, 'users', user.uid);
                getDoc(userRef).then(docSnap => {
                    if (docSnap.exists() && docSnap.data().role === 'admin-hyo') {
                        console.log("Admin Hyo autenticado.");
                        loadEscolas();
                        loadChampionships();
                        loadMetrics();
                        initCurriculo();
                    } else {
                        console.log("Acesso negado.");
                        window.location.href = 'index.html';
                    }
                });
            } else {
                window.location.href = 'index.html';
            }
        });
    }

    // --- GLOBAL USERS LOGIC ---
    async function loadAllUsers() {
        const usersTableBody = document.querySelector('#global-users-table tbody');
        if (!usersTableBody) return;

        usersTableBody.innerHTML = '<tr><td colspan="5">Carregando usuários...</td></tr>';

        try {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            usersTableBody.innerHTML = '';

            if (usersSnapshot.empty) {
                usersTableBody.innerHTML = '<tr><td colspan="5">Nenhum usuário encontrado.</td></tr>';
                return;
            }

            const escolasSnapshot = await getDocs(collection(db, 'escolas'));
            const escolasMap = {};
            escolasSnapshot.forEach(doc => {
                escolasMap[doc.id] = doc.data().nome;
            });

            usersSnapshot.forEach(doc => {
                const user = doc.data();
                const escolaNome = user.escolaId ? (escolasMap[user.escolaId] || 'ID: ' + user.escolaId) : '-';

                const row = `
                    <tr>
                        <td>${user.displayName || user.nome || 'Sem Nome'}</td>
                        <td>${user.email}</td>
                        <td>${user.role}</td>
                        <td>${escolaNome}</td>
                        <td>
                            <button class="btn btn-secondary btn-sm">Editar</button>
                        </td>
                    </tr>
                `;
                usersTableBody.innerHTML += row;
            });
        } catch (error) {
            console.error("Erro ao carregar usuários:", error);
            usersTableBody.innerHTML = '<tr><td colspan="5">Erro ao carregar usuários.</td></tr>';
        }
    }

    // --- SIDEBAR NAVIGATION ---
    // --- SIDEBAR NAVIGATION ---
    if (sidebarLinks) {
        sidebarLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                // Ignore links with href="#" (like logout) or empty
                if (!href || href === '#') return;

                e.preventDefault();
                const targetId = href.substring(1);

                // Hide all sections
                document.querySelectorAll('.dashboard-main-content > .container > .card, .dashboard-main-content > .container > section.card').forEach(section => {
                    section.style.display = 'none';
                });

                // Show target section
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    targetSection.style.display = 'block';
                } else if (targetId === 'admin-hyo-dashboard.html') {
                    // Show dashboard widgets
                    const metrics = document.querySelector('.metrics-grid');
                    const feed = document.querySelector('#activity-feed');
                    const charts = document.querySelector('#charts-section');
                    if (metrics) metrics.style.display = 'grid';
                    if (feed) feed.style.display = 'block';
                    if (charts) charts.style.display = 'block';
                }

                // Load specific data
                if (targetId === 'gerenciar-alunos') {
                    loadAllUsers();
                } else if (targetId === 'perfil') {
                    loadProfileData();
                }

                // Update Active State
                sidebarLinks.forEach(navLink => {
                    // Remove active from LI parents
                    if (navLink.parentElement.tagName === 'LI') {
                        navLink.parentElement.classList.remove('active');
                    }
                    // Remove active from link itself (for footer links)
                    navLink.classList.remove('active');
                });

                if (link.parentElement.tagName === 'LI') {
                    link.parentElement.classList.add('active');
                } else {
                    link.classList.add('active');
                }
            });
        });
    }

    // --- SIDEBAR TOGGLE LOGIC ---
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.dashboard-main-content');
    const sidebarCollapseBtn = document.getElementById('sidebar-collapse-btn');
    const mobileMenuToggle = document.getElementById('sidebar-toggle');

    if (sidebarCollapseBtn) {
        sidebarCollapseBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            if (mainContent) {
                mainContent.classList.toggle('expanded');
            }
        });
    }

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (sidebar && !sidebar.contains(e.target) && mobileMenuToggle && !mobileMenuToggle.contains(e.target) && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
            }
        }
    });

    // --- ACTIVITY FEED ---
    function loadActivityFeed() {
        const feedList = document.getElementById('activity-feed-list');
        if (!feedList) return;

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

    // --- METRICS ---
    async function loadMetrics() {
        try {
            const escolasSnapshot = await getDocs(collection(db, 'escolas'));
            const totalEscolasEl = document.getElementById('total-escolas');
            if (totalEscolasEl) totalEscolasEl.textContent = escolasSnapshot.size;

            const alunosQuery = query(collection(db, 'users'), where('role', '==', 'aluno'));
            const alunosSnapshot = await getDocs(alunosQuery);
            const totalAlunosEl = document.getElementById('total-alunos');
            if (totalAlunosEl) totalAlunosEl.textContent = alunosSnapshot.size;

            const totalFaixasEl = document.getElementById('total-faixas-pretas');
            if (totalFaixasEl) totalFaixasEl.textContent = 'N/A';

            const eventosSnapshot = await getDocs(collection(db, 'eventos'));
            const totalEventosEl = document.getElementById('total-eventos');
            if (totalEventosEl) totalEventosEl.textContent = eventosSnapshot.size;

            renderMetricsChart(escolasSnapshot.size, alunosSnapshot.size, 0, eventosSnapshot.size);
        } catch (e) {
            console.error("Erro ao carregar métricas:", e);
        }
    }

    function renderMetricsChart(escolas, alunos, faixasPretas, eventos) {
        const canvas = document.getElementById('metrics-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Escolas', 'Alunos', 'Faixas Pretas', 'Eventos'],
                datasets: [{
                    label: 'Visão Geral',
                    data: [escolas, alunos, faixasPretas, eventos],
                    backgroundColor: ['rgba(54, 162, 235, 0.2)', 'rgba(255, 99, 132, 0.2)', 'rgba(255, 206, 86, 0.2)', 'rgba(75, 192, 192, 0.2)'],
                    borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)', 'rgba(255, 206, 86, 1)', 'rgba(75, 192, 192, 1)'],
                    borderWidth: 1
                }]
            },
            options: {
                scales: { y: { beginAtZero: true } },
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    // --- CHAMPIONSHIPS ---
    function loadChampionships() {
        if (!championshipsTableBody) return;

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

    // --- SCHOOLS ---
    function loadEscolas() {
        if (!escolasTableBody) return;

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

    // --- EVENT LISTENERS (With Null Checks) ---

    if (escolasTableBody) {
        escolasTableBody.addEventListener('click', async (e) => {
            const target = e.target;
            const button = target.closest('button[data-id]');
            if (!button) return;

            const id = button.dataset.id;

            if (button.classList.contains('btn-danger')) {
                if (confirm(`Tem certeza que deseja excluir a escola com ID: ${id}?`)) {
                    try {
                        await deleteDoc(doc(db, 'escolas', id));
                        console.log("Escola excluída.");
                    } catch (error) {
                        console.error("Erro ao excluir escola: ", error);
                    }
                }
            }
            if (button.classList.contains('btn-secondary')) {
                openEditModal(id);
            }
        });
    }

    async function openEditModal(escolaId) {
        if (!editEscolaModal) return;

        const escolaRef = doc(db, 'escolas', escolaId);
        const escolaSnap = await getDoc(escolaRef);
        if (!escolaSnap.exists()) return;

        const escola = escolaSnap.data();

        document.getElementById('edit-escola-id').value = escolaId;
        document.getElementById('edit-escola-nome').value = escola.nome;
        document.getElementById('edit-escola-cidade').value = escola.cidade;

        const adminSelect = document.getElementById('edit-admin-responsavel');
        if (adminSelect) {
            adminSelect.innerHTML = '<option value="">Nenhum</option>';
            const adminsQuery = query(collection(db, 'users'), where('role', '==', 'admin-escola'));
            const adminsSnapshot = await getDocs(adminsQuery);
            adminsSnapshot.forEach(adminDoc => {
                const admin = adminDoc.data();
                const option = new Option(`${admin.email} (ID: ${adminDoc.id})`, adminDoc.id);
                option.selected = adminDoc.id === escola.adminResponsavelId;
                adminSelect.add(option);
            });
        }

        editEscolaModal.style.display = 'block';
    }

    // Generic Modal Close Logic
    document.querySelectorAll('.modal .close-button').forEach(button => {
        button.addEventListener('click', (e) => {
            e.target.closest('.modal').style.display = 'none';
        });
    });

    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });

    if (editEscolaForm) {
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
                editEscolaModal.style.display = 'none';
            } catch (error) {
                console.error("Erro ao atualizar escola: ", error);
            }
        });
    }

    if (addEscolaBtn) {
        addEscolaBtn.addEventListener('click', async () => {
            const nome = prompt("Digite o nome da nova escola:");
            const cidade = prompt("Digite a cidade da nova escola:");

            if (nome && cidade) {
                try {
                    await addDoc(collection(db, 'escolas'), {
                        nome: nome,
                        cidade: cidade,
                        adminResponsavelId: null
                    });
                } catch (error) {
                    console.error("Erro ao adicionar escola: ", error);
                }
            }
        });
    }

    if (createAdminForm) {
        createAdminForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = createAdminForm['admin-email'].value;
            const password = createAdminForm['admin-password'].value;
            const escolaId = createAdminForm['escola-assoc'].value;

            if (!email || !password || !escolaId) {
                alert("Todos os campos são obrigatórios.");
                return;
            }

            const functions = getFunctions();
            const createAdminEscola = httpsCallable(functions, 'createAdminEscola');

            try {
                const result = await createAdminEscola({ email, password, escolaId });
                alert(result.data.message);
                createAdminForm.reset();
            } catch (error) {
                console.error("Erro:", error);
                alert(`Erro: ${error.message}`);
            }
        });
    }

    if (createChampionshipForm) {
        createChampionshipForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nome = createChampionshipForm['championship-name'].value;
            const data = createChampionshipForm['championship-date'].value;

            if (nome && data) {
                try {
                    await addDoc(collection(db, 'eventos'), {
                        nome: nome,
                        data: data,
                        tipo: 'campeonato'
                    });
                    createChampionshipForm.reset();
                } catch (error) {
                    console.error("Erro ao criar campeonato: ", error);
                }
            }
        });
    }

    if (championshipsTableBody) {
        championshipsTableBody.addEventListener('click', async (e) => {
            const target = e.target;
            const button = target.closest('button[data-id]');
            if (!button) return;

            const id = button.dataset.id;

            if (button.classList.contains('btn-danger')) {
                if (confirm(`Tem certeza que deseja excluir o campeonato com ID: ${id}?`)) {
                    try {
                        await deleteDoc(doc(db, 'eventos', id));
                    } catch (error) {
                        console.error("Erro ao excluir campeonato: ", error);
                    }
                }
            } else if (button.classList.contains('btn-edit-championship')) {
                openEditChampionshipModal(id);
            }
        });
    }

    async function openEditChampionshipModal(championshipId) {
        if (!editChampionshipModal) return;

        const championshipRef = doc(db, 'eventos', championshipId);
        const championshipSnap = await getDoc(championshipRef);
        if (!championshipSnap.exists()) return;

        const championship = championshipSnap.data();

        document.getElementById('edit-championship-id').value = championshipId;
        document.getElementById('edit-championship-name').value = championship.nome;
        document.getElementById('edit-championship-date').value = championship.data;

        editChampionshipModal.style.display = 'block';
    }

    if (editChampionshipForm) {
        editChampionshipForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const championshipId = document.getElementById('edit-championship-id').value;
            const nome = document.getElementById('edit-championship-name').value;
            const data = document.getElementById('edit-championship-date').value;

            const championshipRef = doc(db, 'eventos', championshipId);
            try {
                await updateDoc(championshipRef, { nome, data });
                editChampionshipModal.style.display = 'none';
            } catch (error) {
                console.error("Erro ao atualizar campeonato: ", error);
            }
        });
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

    // --- PROFILE LOGIC ---
    function loadProfileData() {
        const user = auth.currentUser;
        if (user) {
            const nameInput = document.getElementById('profile-name');
            const emailInput = document.getElementById('profile-email');

            if (nameInput) nameInput.value = user.displayName || '';
            if (emailInput) emailInput.value = user.email || '';
        }
    }

    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newName = document.getElementById('profile-name').value;
            const newPassword = document.getElementById('profile-password').value;
            const user = auth.currentUser;

            if (!user) return;

            try {
                const updates = [];
                if (newName && newName !== user.displayName) {
                    // Update Auth Profile
                    updates.push(updateProfile(user, { displayName: newName }));
                    // Update Firestore User Document
                    const userRef = doc(db, 'users', user.uid);
                    updates.push(updateDoc(userRef, { displayName: newName, nome: newName }));
                }

                if (newPassword) {
                    updates.push(updatePassword(user, newPassword));
                }

                await Promise.all(updates);
                alert('Perfil atualizado com sucesso!');
                document.getElementById('profile-password').value = ''; // Clear password field

                // Update header name if changed
                const headerName = document.querySelector('.dashboard-header h1');
                if (headerName && newName) {
                    headerName.textContent = `Bem-vindo, ${newName}`;
                }

            } catch (error) {
                console.error("Erro ao atualizar perfil:", error);
                alert(`Erro ao atualizar perfil: ${error.message}`);
            }
        });
    }

    // --- CURRICULUM LOGIC ---
    async function initCurriculo() {
        if (!faixaSelect || !tecnicasList) return;

        faixas.forEach(faixa => {
            const option = new Option(faixa.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()), faixa);
            faixaSelect.add(option);
        });

        await loadCurriculoData();
        renderCurriculoEditor(faixaSelect.value);

        faixaSelect.addEventListener('change', (e) => {
            renderCurriculoEditor(e.target.value);
        });

        if (addTecnicaBtn) {
            addTecnicaBtn.addEventListener('click', () => {
                const novaTecnica = novaTecnicaInput.value.trim();
                if (novaTecnica) {
                    const faixaAtual = faixaSelect.value;
                    if (!curriculoData[faixaAtual]) {
                        curriculoData[faixaAtual] = { tecnicas: [] };
                    }
                    curriculoData[faixaAtual].tecnicas.push(novaTecnica);
                    renderCurriculoEditor(faixaAtual);
                    novaTecnicaInput.value = '';
                }
            });
        }

        if (salvarCurriculoBtn) {
            salvarCurriculoBtn.addEventListener('click', async () => {
                const faixaAtual = faixaSelect.value;
                if (curriculoData[faixaAtual]) {
                    const docRef = doc(db, 'curriculo', faixaAtual);
                    try {
                        await setDoc(docRef, curriculoData[faixaAtual], { merge: true });
                        alert(`Currículo salvo!`);
                    } catch (error) {
                        console.error("Erro ao salvar currículo: ", error);
                    }
                }
            });
        }
    }

    async function loadCurriculoData() {
        const curriculoCollection = collection(db, 'curriculo');
        const snapshot = await getDocs(curriculoCollection);
        snapshot.forEach(doc => {
            curriculoData[doc.id] = doc.data();
        });
    }

    function renderCurriculoEditor(faixa) {
        if (!tecnicasList) return;
        tecnicasList.innerHTML = '';
        const data = curriculoData[faixa];
        if (data && data.tecnicas) {
            data.tecnicas.forEach((tecnica, index) => {
                const item = document.createElement('div');
                item.className = 'tecnica-item';
                item.innerHTML = `
                    <span>${tecnica}</span>
                    <button class="btn btn-danger btn-sm" data-index="${index}">Remover</button>
                `;
                tecnicasList.appendChild(item);
            });
        } else {
            tecnicasList.innerHTML = '<p>Nenhuma técnica cadastrada.</p>';
        }
    }

    if (tecnicasList) {
        tecnicasList.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-danger')) {
                const index = parseInt(e.target.dataset.index, 10);
                const faixaAtual = faixaSelect.value;
                if (curriculoData[faixaAtual] && curriculoData[faixaAtual].tecnicas) {
                    curriculoData[faixaAtual].tecnicas.splice(index, 1);
                    renderCurriculoEditor(faixaAtual);
                }
            }
        });
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

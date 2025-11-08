// Lógica para o painel do professor
document.addEventListener('DOMContentLoaded', () => {
    const attendanceForm = document.getElementById('attendance-form');
    const alunosListSection = document.getElementById('alunos-list-section');
    const alunosTableBody = document.querySelector('#alunos-table tbody');
    const saveAttendanceBtn = document.getElementById('save-attendance-btn');

    attendanceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // Lógica para carregar alunos da turma selecionada
        // Por enquanto, vamos adicionar dados de exemplo
        alunosTableBody.innerHTML = `
            <tr>
                <td>Carlos Santana</td>
                <td><input type="checkbox" checked></td>
            </tr>
            <tr>
                <td>Maria Joaquina</td>
                <td><input type="checkbox"></td>
            </tr>
        `;
        alunosListSection.style.display = 'block';
    });

    saveAttendanceBtn.addEventListener('click', () => {
        // Lógica para salvar as presenças no banco de dados
        alert('Presenças salvas com sucesso!');
    });
});

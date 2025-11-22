document.addEventListener('DOMContentLoaded', function() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.dashboard-main-content');

    if (sidebarToggle && sidebar && mainContent) {
        sidebarToggle.addEventListener('click', function() {
            // Toggle classes for desktop
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');

            // Toggle classes for mobile
            sidebar.classList.toggle('active');
        });
    }
});

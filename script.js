document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('header');
    const logo = document.getElementById('main-logo');
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('nav > ul');

    // Cria o overlay dinamicamente dentro do header
    const overlay = document.createElement('div');
    overlay.classList.add('menu-overlay');
    header.appendChild(overlay);

    // Efeito de scroll no header
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
            logo.src = 'imgs/hyo-horizontal-logo.svg';
        } else {
            header.classList.remove('scrolled');
            logo.src = 'imgs/hyo-white.png';
        }
    });

    function openMenu() {
        nav.classList.add('active');
        overlay.classList.add('active');
    }

    function closeMenu() {
        nav.classList.remove('active');
        overlay.classList.remove('active');
    }

    // Lógica para abrir o menu
    menuToggle.addEventListener('click', openMenu);

    // Lógica para fechar o menu ao clicar no overlay
    overlay.addEventListener('click', closeMenu);

    // Lógica de clique dentro do menu de navegação (delegação de eventos)
    nav.addEventListener('click', function(e) {
        // Verifica se o clique foi no link do dropdown
        if (e.target.matches('.dropdown > a') && window.innerWidth <= 768) {
            e.preventDefault(); // Previne a navegação para abrir o submenu
            const submenu = e.target.nextElementSibling;
            if (submenu.style.display === 'block') {
                submenu.style.display = 'none';
            } else {
                submenu.style.display = 'block';
            }
        } else if (e.target.tagName === 'A') {
            // Se for qualquer outro link, fecha o menu (útil para navegação na mesma página)
            closeMenu();
        }
    });

});

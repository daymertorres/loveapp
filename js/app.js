// js/app.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Theme Management (Dark/Light mode)
    const initTheme = () => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        const themeToggle = document.getElementById('darkModeToggle');
        if (themeToggle) {
            themeToggle.checked = savedTheme === 'dark';
            themeToggle.addEventListener('change', (e) => {
                const newTheme = e.target.checked ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
            });
        }
    };
    initTheme();

    // 2. PWA Service Worker Registration
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            // Se asume que el sw.js estará en la raíz
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('SW registrado con éxito:', registration.scope);
                })
                .catch(err => {
                    console.log('Error al registrar SW:', err);
                });
        });
    }
    
    // 3. Control de Identidad (Sin Login)
    const enterAppBtn = document.getElementById('enterAppBtn');
    const identityModal = document.getElementById('identityModal');
    
    // Función global para establecer la identidad
    window.setIdentity = function(role) {
        localStorage.setItem('myRole', role);
        localStorage.setItem('partnerRole', role === 'userA' ? 'userB' : 'userA');
        window.location.href = 'home.html';
    };

    if (enterAppBtn) {
        enterAppBtn.addEventListener('click', () => {
            const role = localStorage.getItem('myRole');
            if (role) {
                // Ya tiene identidad, entra directo
                window.location.href = 'home.html';
            } else {
                // No tiene identidad, muestra el modal
                if(identityModal) identityModal.classList.add('active');
            }
        });
    }

    // Funciones útiles globales para acceder a los roles
    window.getMyId = () => localStorage.getItem('myRole') || 'userA';
    window.getPartnerId = () => localStorage.getItem('partnerRole') || 'userB';
    
    // 4. Botón "Te extraño" - Animación rápida

    const missYouBtn = document.getElementById('missYouBtn');
    if (missYouBtn) {
        missYouBtn.addEventListener('click', () => {
            missYouBtn.innerHTML = '<i class="fa-solid fa-heart-pulse"></i> ¡Enviado!';
            
            // Opcional: Escribir en Firebase un "zumbido"
            const role = window.getMyId();
            if(role) {
                import('./firebase.js').then(({rtdb}) => {
                    import("https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js").then(({ref, set, serverTimestamp}) => {
                        set(ref(rtdb, 'buzz/' + role), { timestamp: serverTimestamp() });
                    });
                });
            }

            setTimeout(() => {
                missYouBtn.innerHTML = '<i class="fa-solid fa-heart"></i> Te extraño';
            }, 2000);
        });
    }

    // 5. Configurar UI según rol
    const userNameEl = document.getElementById('userName');
    const myAvatarEl = document.getElementById('myAvatar');
    const chatPartnerName = document.getElementById('chatPartnerName');
    const profileName = document.querySelector('.profile-name');
    const profileEmail = document.querySelector('.profile-email');
    
    if(localStorage.getItem('myRole')) {
        const isA = localStorage.getItem('myRole') === 'userA';
        const myName = isA ? 'Persona A' : 'Persona B';
        const partnerName = isA ? 'Persona B' : 'Persona A';
        
        if (userNameEl) userNameEl.innerText = myName;
        if (myAvatarEl) myAvatarEl.innerText = isA ? 'A' : 'B';
        if (chatPartnerName) chatPartnerName.innerText = partnerName;
        if (profileName) profileName.innerText = myName;
        if (profileEmail) profileEmail.style.display = 'none'; // Ya no hay email
    }
});

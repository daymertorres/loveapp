// js/app.js
// ─────────────────────────────────────────────
// IMPORTANTE: Las funciones globales se definen
// INMEDIATAMENTE para que estén disponibles
// cuando los módulos ES se inicialicen.
// ─────────────────────────────────────────────

// 1. Funciones globales de identidad (fuera de DOMContentLoaded)
window.getMyId = () => localStorage.getItem('myRole') || 'userA';
window.getPartnerId = () => localStorage.getItem('partnerRole') || 'userB';

// 2. Tema (también inmediato para evitar flash of unstyled content)
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

// 3. Función global setIdentity
window.setIdentity = function(role) {
    localStorage.setItem('myRole', role);
    localStorage.setItem('partnerRole', role === 'userA' ? 'userB' : 'userA');
    window.location.href = 'home.html';
};

// ─────────────────────────────────────────────
// Esperar al DOM para manipulaciones de UI
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

    // 4. Sincronizar toggle de tema oscuro
    const themeToggle = document.getElementById('darkModeToggle');
    if (themeToggle) {
        themeToggle.checked = (localStorage.getItem('theme') === 'dark');
        themeToggle.addEventListener('change', (e) => {
            const newTheme = e.target.checked ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    // 5. Toggle de compartir ubicación (profile.html)
    const locationToggle = document.getElementById('locationToggle');
    if (locationToggle) {
        const sharingEnabled = localStorage.getItem('sharingLocation') !== 'false';
        locationToggle.checked = sharingEnabled;
        locationToggle.addEventListener('change', (e) => {
            localStorage.setItem('sharingLocation', e.target.checked ? 'true' : 'false');
        });
    }

    // 6. PWA Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('[SW] Registrado:', reg.scope))
            .catch(err => console.warn('[SW] Error:', err));
    }

    // 7. Botón "Entrar" en splash screen (index.html)
    const enterAppBtn = document.getElementById('enterAppBtn');
    const identityModal = document.getElementById('identityModal');
    if (enterAppBtn) {
        enterAppBtn.addEventListener('click', () => {
            const role = localStorage.getItem('myRole');
            if (role) {
                window.location.href = 'home.html';
            } else {
                if (identityModal) identityModal.classList.add('active');
            }
        });
    }

    // 8. Botón "Te extraño" (home.html)
    const missYouBtn = document.getElementById('missYouBtn');
    if (missYouBtn) {
        missYouBtn.addEventListener('click', () => {
            missYouBtn.innerHTML = '<i class="fa-solid fa-heart-pulse"></i> ¡Enviado!';
            missYouBtn.disabled = true;

            // Enviar buzz a Firebase si está disponible
            import('./firebase.js').then(({ rtdb }) => {
                if (!rtdb) return;
                import("https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js")
                    .then(({ ref, set, serverTimestamp }) => {
                        set(ref(rtdb, 'buzz/' + window.getMyId()), {
                            timestamp: serverTimestamp()
                        }).catch(e => console.warn('[Buzz] Error:', e));
                    });
            });

            setTimeout(() => {
                missYouBtn.innerHTML = '<i class="fa-solid fa-heart"></i> Te extraño';
                missYouBtn.disabled = false;
            }, 3000);
        });
    }

    // 9. UI según rol activo
    const myRole = window.getMyId();
    const isA = myRole === 'userA';
    const myName = isA ? 'Persona A' : 'Persona B';
    const partnerName = isA ? 'Persona B' : 'Persona A';

    const userNameEl = document.getElementById('userName');
    const myAvatarEl = document.getElementById('myAvatar');
    const chatPartnerName = document.getElementById('chatPartnerName');
    const chatPartnerAvatar = document.getElementById('chatPartnerAvatar');
    const profileName = document.querySelector('.profile-name');
    const profileAvatar = document.querySelector('.profile-avatar');

    if (userNameEl) userNameEl.innerText = myName;
    if (myAvatarEl) myAvatarEl.innerText = isA ? 'A' : 'B';
    if (chatPartnerName) chatPartnerName.innerText = partnerName;
    if (chatPartnerAvatar) chatPartnerAvatar.innerText = isA ? 'B' : 'A';
    if (profileName) profileName.innerText = myName;
    if (profileAvatar) profileAvatar.innerText = isA ? 'A' : 'B';

    // 10. Días juntos (home.html)
    const daysTogether = document.getElementById('daysTogether');
    if (daysTogether) {
        const startDate = localStorage.getItem('relationshipStart');
        if (startDate) {
            const start = new Date(startDate);
            const now = new Date();
            const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
            daysTogether.innerText = diff;
        } else {
            daysTogether.innerText = '♡';
        }
    }

    // 11. Batería del dispositivo (solo mi batería como referencia)
    if ('getBattery' in navigator) {
        navigator.getBattery().then(battery => {
            const updateBattery = () => {
                const pct = Math.round(battery.level * 100);
                const myBatteryEl = document.getElementById('myBattery');
                if (myBatteryEl) myBatteryEl.innerText = pct + '%';
            };
            updateBattery();
            battery.addEventListener('levelchange', updateBattery);
        }).catch(() => {});
    }

    // 12. Configuración de fecha de inicio de relación (profile.html)
    const startDateInput = document.getElementById('startDateInput');
    if (startDateInput) {
        const stored = localStorage.getItem('relationshipStart');
        if (stored) startDateInput.value = stored;
        startDateInput.addEventListener('change', (e) => {
            localStorage.setItem('relationshipStart', e.target.value);
        });
    }

    // 13. Botón de cambiar identidad (profile.html)
    const changeIdentityBtn = document.getElementById('changeIdentityBtn');
    if (changeIdentityBtn) {
        changeIdentityBtn.addEventListener('click', () => {
            if (confirm('¿Quieres cambiar de identidad? Esto reiniciará tu sesión.')) {
                localStorage.removeItem('myRole');
                localStorage.removeItem('partnerRole');
                window.location.href = 'index.html';
            }
        });
    }

    // 14. Buzz listener - notificación de "Te extraño" (home.html)
    const partnerRole = window.getPartnerId();
    import('./firebase.js').then(({ rtdb }) => {
        if (!rtdb) return;
        import("https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js")
            .then(({ ref, onValue }) => {
                let firstLoad = true;
                onValue(ref(rtdb, 'buzz/' + partnerRole), (snapshot) => {
                    if (firstLoad) { firstLoad = false; return; }
                    const data = snapshot.val();
                    if (data) {
                        showBuzzNotification();
                    }
                });
            });
    }).catch(() => {});

    function showBuzzNotification() {
        const existing = document.getElementById('buzzToast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'buzzToast';
        toast.style.cssText = `
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            background: var(--gradient-primary); color: white;
            padding: 12px 24px; border-radius: 24px; font-weight: 600;
            box-shadow: 0 8px 32px rgba(255,75,114,0.4); z-index: 9999;
            animation: fadeIn 0.3s ease; font-size: 14px;
        `;
        toast.innerHTML = '💗 ¡Tu pareja te extraña!';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }
});

// js/chat.js
// Chat en tiempo real con Firebase Realtime Database

import { rtdb } from './firebase.js';
import {
    ref, push, onChildAdded, onValue, serverTimestamp, set, query, limitToLast
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

document.addEventListener('DOMContentLoaded', () => {
    const chatForm          = document.getElementById('chatForm');
    const messageInput      = document.getElementById('messageInput');
    const messagesContainer = document.getElementById('messagesContainer');
    const typingIndicator   = document.getElementById('typingIndicator');

    if (!chatForm || !messageInput || !messagesContainer) return;

    const myRole      = window.getMyId();
    const partnerRole = window.getPartnerId();

    // Limpiar mensajes de ejemplo
    messagesContainer.innerHTML = '';

    if (!rtdb) {
        messagesContainer.innerHTML = `
            <div style="text-align:center; padding:40px 20px; color:var(--text-muted);">
                <i class="fa-solid fa-wifi" style="font-size:40px;margin-bottom:16px;display:block;opacity:0.4;"></i>
                <p>Conectando con Firebase...</p>
                <small style="font-size:12px;">Asegúrate de haber habilitado Realtime Database<br>en la consola de Firebase</small>
            </div>`;
        return;
    }

    const chatRef     = ref(rtdb, 'chats');
    const recentQuery = query(chatRef, limitToLast(100));

    // Auto-scroll al fondo
    const scrollToBottom = () => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };

    // ── Escuchar mensajes nuevos ───────────────────────────
    onChildAdded(recentQuery, (snapshot) => {
        const msg = snapshot.val();
        if (!msg || !msg.text) return;

        const isMine = msg.sender === myRole;
        const time   = msg.timestamp
            ? new Date(msg.timestamp).toLocaleTimeString('es-MX', {
                hour: '2-digit', minute: '2-digit'
              })
            : '';

        const msgEl = document.createElement('div');
        msgEl.className = `message ${isMine ? 'sent' : 'received'}`;

        // Escapar HTML
        const safeText = (msg.text + '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        msgEl.innerHTML = `${safeText}<span class="message-time">${time}</span>`;
        messagesContainer.appendChild(msgEl);
        scrollToBottom();
    });

    // ── Escuchar indicador de "escribiendo" ────────────────
    onValue(ref(rtdb, 'typing/' + partnerRole), (snapshot) => {
        const isTyping = snapshot.val();
        if (typingIndicator) {
            typingIndicator.style.display = isTyping ? 'block' : 'none';
            if (isTyping) scrollToBottom();
        }
    });

    // ── Enviar mensaje ─────────────────────────────────────
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const text = messageInput.value.trim();
        if (!text) return;

        const sendBtn = document.getElementById('sendBtn');
        if (sendBtn) sendBtn.disabled = true;

        push(chatRef, {
            text:      text,
            sender:    myRole,
            timestamp: serverTimestamp()
        })
        .then(() => {
            messageInput.value = '';
            messageInput.style.height = 'auto';
            messageInput.focus();
            set(ref(rtdb, 'typing/' + myRole), false).catch(() => {});
        })
        .catch((err) => {
            console.error('[Chat] Error al enviar:', err);
            alert('Error al enviar. ¿Tienes conexión a internet?');
        })
        .finally(() => {
            if (sendBtn) sendBtn.disabled = false;
        });
    });

    // ── Indicador de "escribiendo" ─────────────────────────
    let typingTimeout = null;

    messageInput.addEventListener('input', () => {
        // Auto-resize del textarea
        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';

        set(ref(rtdb, 'typing/' + myRole), true).catch(() => {});
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            set(ref(rtdb, 'typing/' + myRole), false).catch(() => {});
        }, 2500);
    });

    // ── Enviar con Enter (sin Shift) en desktop ────────────
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && window.innerWidth >= 768) {
            e.preventDefault();
            chatForm.dispatchEvent(new Event('submit'));
        }
    });
});

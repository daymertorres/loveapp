// js/chat.js

import { rtdb } from './firebase.js';
import { ref, push, onChildAdded, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chatForm');
    const messageInput = document.getElementById('messageInput');
    const messagesContainer = document.getElementById('messagesContainer');
    const typingIndicator = document.getElementById('typingIndicator');

    if (chatForm && messageInput && messagesContainer) {
        
        // Auto-scroll al fondo
        const scrollToBottom = () => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        };
        scrollToBottom();


        
        const myRole = window.getMyId ? window.getMyId() : localStorage.getItem('myRole') || 'userA';
        const partnerRole = window.getPartnerId ? window.getPartnerId() : localStorage.getItem('partnerRole') || 'userB';
        const chatRef = ref(rtdb, 'chats');

        // Limpiar mensajes mock
        messagesContainer.innerHTML = '';
        
        // Escuchar mensajes entrantes
        onChildAdded(chatRef, (snapshot) => {
            const msg = snapshot.val();
            const timeString = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';
            
            const msgDiv = document.createElement('div');
            msgDiv.className = `message ${msg.sender === myRole ? 'sent' : 'received'}`;
            msgDiv.innerHTML = `
                ${msg.text}
                <span class="message-time">${timeString}</span>
            `;
            messagesContainer.appendChild(msgDiv);
            scrollToBottom();
        });

        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const text = messageInput.value.trim();
            if (!text) return;
            
            // Enviar a Firebase
            push(chatRef, {
                text: text,
                sender: myRole,
                timestamp: serverTimestamp()
            });
            
            messageInput.value = '';
        });
            

        });
        
        // Simular indicador de escribiendo
        messageInput.addEventListener('input', () => {
            // Aquí se enviaría el estado 'typing' a Firebase
        });
    }
});

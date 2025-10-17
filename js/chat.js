// Sistema de chat
let currentChat = null;
let chatListener = null;

// Carregar conversas
function loadChats() {
    const chatList = document.getElementById('chatList');
    
    const chatsRef = userRole === 'customer' 
        ? database.ref(`chats`).orderByChild('customerId').equalTo(currentUser.uid)
        : database.ref(`chats`);
    
    chatsRef.on('value', (snapshot) => {
        chatList.innerHTML = '';
        
        if (!snapshot.exists()) {
            chatList.innerHTML = '<p style="padding: 20px; text-align: center; color: var(--text-secondary);">Nenhuma conversa ainda.</p>';
            return;
        }
        
        const chats = [];
        snapshot.forEach((childSnapshot) => {
            chats.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        
        // Ordenar por última mensagem
        chats.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
        
        chats.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item';
            if (currentChat === chat.id) {
                chatItem.classList.add('active');
            }
            
            const displayName = userRole === 'customer' ? 'Atendimento' : chat.customerName;
            const displayAvatar = userRole === 'customer' 
                ? 'https://ui-avatars.com/api/?name=Atendimento&background=007AFF&color=fff'
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.customerName)}&background=007AFF&color=fff`;
            
            chatItem.innerHTML = `
                <img src="${displayAvatar}" alt="${displayName}" class="chat-item-avatar">
                <div class="chat-item-info">
                    <div class="chat-item-name">${displayName}</div>
                    <div class="chat-item-message">${chat.lastMessage || 'Sem mensagens'}</div>
                </div>
                <div class="chat-item-time">${chat.lastMessageTime ? formatTime(chat.lastMessageTime) : ''}</div>
            `;
            
            chatItem.addEventListener('click', () => {
                openChat(chat.id, chat);
            });
            
            chatList.appendChild(chatItem);
        });
        
        // Atualizar badge de notificações
        updateChatBadge(chats.length);
    });
}

// Abrir chat
function openChat(chatId, chatData) {
    currentChat = chatId;
    
    // Atualizar lista
    document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    // Atualizar header
    const displayName = userRole === 'customer' ? 'Atendimento' : chatData.customerName;
    const displayAvatar = userRole === 'customer' 
        ? 'https://ui-avatars.com/api/?name=Atendimento&background=007AFF&color=fff'
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(chatData.customerName)}&background=007AFF&color=fff`;
    
    document.getElementById('chatUserName').textContent = displayName;
    document.getElementById('chatUserAvatar').src = displayAvatar;
    document.getElementById('chatUserStatus').textContent = 'online';
    
    // Carregar mensagens
    loadMessages(chatId);
}

// Carregar mensagens
function loadMessages(chatId) {
    const chatMessages = document.getElementById('chatMessages');
    
    // Remover listener anterior
    if (chatListener) {
        chatListener.off();
    }
    
    chatListener = database.ref(`messages/${chatId}`);
    
    chatListener.on('value', (snapshot) => {
        chatMessages.innerHTML = '';
        
        if (!snapshot.exists()) {
            chatMessages.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Nenhuma mensagem ainda. Inicie a conversa!</p>';
            return;
        }
        
        snapshot.forEach((childSnapshot) => {
            const message = childSnapshot.val();
            addMessageToUI(message);
        });
        
        // Scroll para o final
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
}

// Adicionar mensagem na UI
function addMessageToUI(message) {
    const chatMessages = document.getElementById('chatMessages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.senderId === currentUser.uid ? 'sent' : 'received'}`;
    
    const avatar = message.senderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.senderName || 'User')}&background=007AFF&color=fff`;
    
    if (message.type === 'order') {
        // Mensagem de pedido
        const itemsList = message.items.map(item => 
            `<div style="display: flex; justify-content: space-between; padding: 5px 0;">
${item.quantity}x {item.name}R ${(item.price * item.quantity).toFixed(2)}
`
).join('');
messageDiv.innerHTML = `
        <img src="${avatar}" alt="User" class="message-avatar">
        <div class="message-content">
            <div class="message-bubble" style="max-width: 400px;">
                <strong>📋 Pedido</strong>
                <div style="margin: 10px 0; padding: 10px; background: rgba(0,0,0,0.05); border-radius: 8px;">
                    ${itemsList}
                </div>
                <div style="padding-top: 10px; border-top: 1px solid rgba(0,0,0,0.1); font-weight: 700;">
                    Total: R$ ${message.total.toFixed(2)}
                </div>
            </div>
            <div class="message-time">${formatTime(message.timestamp)}</div>
        </div>
    `;
} else {
    // Mensagem de texto
    messageDiv.innerHTML = `
        <img src="${avatar}" alt="User" class="message-avatar">
        <div class="message-content">
            <div class="message-bubble">${message.text}</div>
            <div class="message-time">${formatTime(message.timestamp)}</div>
        </div>
    `;
}

chatMessages.appendChild(messageDiv);
}
// Enviar mensagem
document.getElementById('sendMessageBtn').addEventListener('click', sendMessage);
document.getElementById('messageInput').addEventListener('keypress', (e) => {
if (e.key === 'Enter') {
sendMessage();
}
});
function sendMessage() {
const input = document.getElementById('messageInput');
const text = input.value.trim();
if (!text || !currentChat) return;

const message = {
    text: text,
    senderId: currentUser.uid,
    senderName: currentUser.displayName || currentUser.email,
    senderAvatar: currentUser.photoURL,
    timestamp: Date.now(),
    type: 'text'
};

database.ref(`messages/${currentChat}`).push(message);

// Atualizar última mensagem no chat
database.ref(`chats/${currentChat}`).update({
    lastMessage: text,
    lastMessageTime: Date.now()
});

input.value = '';
}
// Enviar pedido como mensagem
function sendOrderMessage(orderData) {
if (!currentChat) {
showToast('Nenhum chat selecionado', 'error');
return;
}
const message = {
    ...orderData,
    senderId: currentUser.uid,
    senderName: currentUser.displayName || currentUser.email,
    senderAvatar: currentUser.photoURL
};

database.ref(`messages/${currentChat}`).push(message);

// Atualizar última mensagem no chat
database.ref(`chats/${currentChat}`).update({
    lastMessage: '📋 Pedido enviado',
    lastMessageTime: Date.now()
});

showToast('Pedido enviado com sucesso!', 'success');
}
// Iniciar chat como cliente
function startCustomerChat() {
// Verificar se já existe um chat ativo
database.ref('chats').orderByChild('customerId').equalTo(currentUser.uid).once('value', async (snapshot) => {
if (snapshot.exists()) {
// Chat já existe, abrir
const chatId = Object.keys(snapshot.val())[0];
currentChat = chatId;
// Mudar para seção de chat
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        document.querySelector('[data-section="chat"]').classList.add('active');
        document.getElementById('chatSection').classList.add('active');
        
        // Abrir o chat
        setTimeout(() => {
            const chatItem = document.querySelector('.chat-item');
            if (chatItem) chatItem.click();
        }, 300);
        
    } else {
        // Criar novo chat
        try {
            showLoading();
            
            const newChatRef = await database.ref('chats').push({
                customerId: currentUser.uid,
                customerName: currentUser.displayName || currentUser.email,
                customerEmail: currentUser.email,
                createdAt: Date.now(),
                status: 'active'
            });
            
            currentChat = newChatRef.key;
            
            // Enviar mensagem inicial
            await database.ref(`messages/${currentChat}`).push({
                text: 'Olá! Gostaria de fazer um pedido.',
                senderId: currentUser.uid,
                senderName: currentUser.displayName || currentUser.email,
                senderAvatar: currentUser.photoURL,
                timestamp: Date.now(),
                type: 'text'
            });
            
            // Atualizar chat
            await database.ref(`chats/${currentChat}`).update({
                lastMessage: 'Olá! Gostaria de fazer um pedido.',
                lastMessageTime: Date.now()
            });
            
            // Mudar para seção de chat
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
            document.querySelector('[data-section="chat"]').classList.add('active');
            document.getElementById('chatSection').classList.add('active');
            
            showToast('Chat iniciado! Aguarde um atendente.', 'success');
            
        } catch (error) {
            showToast('Erro ao iniciar chat: ' + error.message, 'error');
        } finally {
            hideLoading();
        }
    }
});
}
// Formatar tempo
function formatTime(timestamp) {
const date = new Date(timestamp);
const now = new Date();
const diffMs = now - date;
const diffMins = Math.floor(diffMs / 60000);
const diffHours = Math.floor(diffMs / 3600000);
const diffDays = Math.floor(diffMs / 86400000);

if (diffMins < 1) return 'agora';
if (diffMins < 60) return `${diffMins}m`;
if (diffHours < 24) return `${diffHours}h`;
if (diffDays < 7) return `${diffDays}d`;

return date.toLocaleDateString('pt-BR');
}
// Atualizar badge de notificações
function updateChatBadge(count) {
const badge = document.getElementById('chatBadge');
badge.textContent = count;
badge.style.display = count > 0 ? 'block' : 'none';
}
// Buscar conversas
document.querySelector('.chat-search input').addEventListener('input', function(e) {
const searchTerm = e.target.value.toLowerCase();
document.querySelectorAll('.chat-item').forEach(item => {
    const name = item.querySelector('.chat-item-name').textContent.toLowerCase();
    const message = item.querySelector('.chat-item-message').textContent.toLowerCase();
    
    if (name.includes(searchTerm) || message.includes(searchTerm)) {
        item.style.display = 'flex';
    } else {
        item.style.display = 'none';
    }
});
});

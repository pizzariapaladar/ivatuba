// Configuração do Firebase
// IMPORTANTE: Substitua com suas credenciais do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyB5YEwExbRsHHezCCZxeBgj1IGb5m7Bwe8",
    authDomain: "pizzaria-paladar-tdc.firebaseapp.com",
    databaseURL: "https://console.firebase.google.com/u/0/project/pizzaria-paladar-tdc/firestore/databases/-default-/data?hl=pt-BR",
    projectId: "pizzaria-paladar-tdc",
    storageBucket: "pizzaria-paladar-tdc.firebasestorage.app",
    messagingSenderId: "1048440338619",
    appId: "1:1048440338619:web:283e088a2ff9252b46919e"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referências
const auth = firebase.auth();
const database = firebase.database();

// Contas de administrador
const ADMIN_EMAILS = [
    'pizzaria.paladar.tdc@gmail.com',
    'kartywillytdc@gmail.com'
];

// Verificar se é administrador
function isAdmin(email) {
    return ADMIN_EMAILS.includes(email.toLowerCase());
}

// Verificar se é funcionário
async function isEmployee(uid) {
    const snapshot = await database.ref(`employees/${uid}`).once('value');
    return snapshot.exists();
}

// Loading overlay
function showLoading() {
    document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}

// Toast notification
function showToast(message, type = 'info') {
    // Implementação simples de toast
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#34C759' : type === 'error' ? '#FF3B30' : '#007AFF'};
        color: white;
        border-radius: 10px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
          }

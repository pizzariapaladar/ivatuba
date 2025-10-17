let currentUser = null;
let userRole = null;

// Toggle password visibility
document.querySelectorAll('.toggle-password').forEach(icon => {
    icon.addEventListener('click', function() {
        const input = this.previousElementSibling;
        const type = input.type === 'password' ? 'text' : 'password';
        input.type = type;
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });
});

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const tab = this.dataset.tab;
        
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        
        this.classList.add('active');
        document.getElementById(`${tab}Form`).classList.add('active');
    });
});

// Login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        showLoading();
        await auth.signInWithEmailAndPassword(email, password);
        showToast('Login realizado com sucesso!', 'success');
    } catch (error) {
        showToast('Erro no login: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
});

// Register
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    if (password.length < 6) {
        showToast('A senha deve ter pelo menos 6 caracteres', 'error');
        return;
    }
    
    try {
        showLoading();
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // Atualizar perfil
        await userCredential.user.updateProfile({
            displayName: name
        });
        
        // Salvar dados do usuário no database
        await database.ref(`users/${userCredential.user.uid}`).set({
            name: name,
            email: email,
            createdAt: Date.now()
        });
        
        showToast('Conta criada com sucesso!', 'success');
    } catch (error) {
        showToast('Erro no cadastro: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
});

// Google Sign In
document.getElementById('googleSignIn').addEventListener('click', async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    try {
        showLoading();
        await auth.signInWithPopup(provider);
        showToast('Login com Google realizado!', 'success');
    } catch (error) {
        showToast('Erro no login com Google: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await auth.signOut();
        showToast('Logout realizado!', 'success');
    } catch (error) {
        showToast('Erro no logout: ' + error.message, 'error');
    }
});

// Auth state observer
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        
        // Determinar role do usuário
        if (isAdmin(user.email)) {
            userRole = 'admin';
        } else if (await isEmployee(user.uid)) {
            userRole = 'employee';
        } else {
            userRole = 'customer';
        }
        
        // Atualizar UI
        document.getElementById('loginScreen').classList.remove('active');
        document.getElementById('mainScreen').classList.add('active');
        
        document.getElementById('userName').textContent = user.displayName || user.email;
        document.getElementById('userAvatar').src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=007AFF&color=fff`;
        
        // Mostrar controles específicos por role
        if (userRole === 'admin') {
            document.getElementById('adminControls').style.display = 'block';
            document.getElementById('ordersLink').style.display = 'flex';
        } else if (userRole === 'employee') {
            document.getElementById('ordersLink').style.display = 'flex';
        }
        
        // Carregar dados
        loadProducts();
        loadMenuItems();
        if (userRole !== 'customer') {
            loadOrders();
        }
        loadChats();
        
    } else {
        currentUser = null;
        userRole = null;
        document.getElementById('loginScreen').classList.add('active');
        document.getElementById('mainScreen').classList.remove('active');
    }
});

// Gerenciamento do cardápio
let currentCategory = 'all';
const menuModal = document.getElementById('menuModal');
let cart = [];

// Navegação entre seções
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const section = this.dataset.section;
        
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        
        this.classList.add('active');
        document.getElementById(`${section}Section`).classList.add('active');
    });
});

// Botão de fazer pedido
document.getElementById('startOrderBtn').addEventListener('click', () => {
    if (userRole === 'customer') {
        // Cliente inicia chat com atendimento
        startCustomerChat();
    }
});

// Carregar itens do menu
function loadMenuItems() {
    const menuGrid = document.getElementById('menuGrid');
    
    database.ref('products').on('value', (snapshot) => {
        menuGrid.innerHTML = '';
        
        if (!snapshot.exists()) {
            menuGrid.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Nenhum produto no cardápio.</p>';
            return;
        }
        
        snapshot.forEach((childSnapshot) => {
            const productId = childSnapshot.key;
            const product = childSnapshot.val();
            
            // Filtrar por categoria
            if (currentCategory !== 'all' && product.category !== currentCategory) {
                return;
            }
            
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/300x200?text=Sem+Imagem'">
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    ${product.description ? `<p class="product-description">${product.description}</p>` : ''}
                    <p class="product-price">R$ ${product.price.toFixed(2)}</p>
                </div>
            `;
            
            menuGrid.appendChild(card);
        });
    });
}

// Filtro de categorias no menu
document.querySelectorAll('.menu-categories .category-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.menu-categories .category-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        currentCategory = this.dataset.category;
        loadMenuItems();
    });
});

// Modal de seleção de menu
document.getElementById('attachMenuBtn').addEventListener('click', () => {
    cart = [];
    updateCart();
    menuModal.classList.add('active');
    loadMenuSelection();
});

// Carregar produtos para seleção
function loadMenuSelection() {
    const menuSelectionGrid = document.getElementById('menuSelectionGrid');
    
    database.ref('products').once('value', (snapshot) => {
        menuSelectionGrid.innerHTML = '';
        
        snapshot.forEach((childSnapshot) => {
            const productId = childSnapshot.key;
            const product = childSnapshot.val();
            
            const card = document.createElement('div');
            card.className = 'menu-item-card';
            card.innerHTML = `
                <img src="${product.image}" alt="${product.name}" class="menu-item-image" onerror="this.src='https://via.placeholder.com/200x120?text=Sem+Imagem'">
                <div class="menu-item-info">
                    <div class="menu-item-name">${product.name}</div>
                    <div class="menu-item-price">R$ ${product.price.toFixed(2)}</div>
                </div>
            `;
            
            card.addEventListener('click', () => {
                addToCart(productId, product);
                card.classList.add('selected');
                setTimeout(() => card.classList.remove('selected'), 500);
            });
            
            menuSelectionGrid.appendChild(card);
        });
    });
}

// Adicionar ao carrinho
function addToCart(productId, product) {
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: productId,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }
    
    updateCart();
}

// Atualizar carrinho
function updateCart() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    cartItems.innerHTML = '';
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">R$ ${item.price.toFixed(2)}</div>
            </div>
            <div class="cart-item-quantity">
                <button class="qty-btn" onclick="updateCartQuantity('${item.id}', -1)">-</button>
                <span>${item.quantity}</span>
                <button class="qty-btn" onclick="updateCartQuantity('${item.id}', 1)">+</button>
            </div>
        `;
        
        cartItems.appendChild(cartItem);
    });
    
    cartTotal.textContent = `R$ ${total.toFixed(2)}`;
}

// Atualizar quantidade
function updateCartQuantity(productId, change) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        cart = cart.filter(i => i.id !== productId);
    }
    
    updateCart();
}

// Enviar carrinho
document.getElementById('sendCartBtn').addEventListener('click', () => {
    if (cart.length === 0) {
        showToast('Adicione pelo menos um item ao carrinho', 'error');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Criar mensagem com pedido
    const orderMessage = {
        type: 'order',
        items: cart,
        total: total,
        timestamp: Date.now()
    };
    
    // Enviar no chat atual
    sendOrderMessage(orderMessage);
    
    menuModal.classList.remove('active');
    cart = [];
});

// Filtro de categorias na seleção de menu
document.querySelectorAll('#menuModal .category-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const category = this.dataset.category;
        
        document.querySelectorAll('#menuModal .category-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        document.querySelectorAll('.menu-item-card').forEach(card => {
            if (category === 'all') {
                card.style.display = 'block';
            } else {
                // Implementar filtro por categoria
                card.style.display = 'block';
            }
        });
    });
});

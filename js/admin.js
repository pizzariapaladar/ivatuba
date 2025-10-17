// Gerenciamento de produtos
let currentEditingProduct = null;

// Modal controls
const productModal = document.getElementById('productModal');
const productForm = document.getElementById('productForm');
const employeesModal = document.getElementById('employeesModal');

// Abrir modal de adicionar produto
document.getElementById('addProductBtn')?.addEventListener('click', () => {
    currentEditingProduct = null;
    document.getElementById('modalTitle').textContent = 'Adicionar Produto';
    productForm.reset();
    productModal.classList.add('active');
});

// Fechar modais
document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', function() {
        this.closest('.modal').classList.remove('active');
    });
});

// Fechar modal ao clicar fora
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
});

// Salvar produto
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const productData = {
        name: document.getElementById('productName').value,
        category: document.getElementById('productCategory').value,
        price: parseFloat(document.getElementById('productPrice').value),
        image: document.getElementById('productImage').value,
        description: document.getElementById('productDescription').value || '',
        updatedAt: Date.now()
    };
    
    try {
        showLoading();
        
        if (currentEditingProduct) {
            // Atualizar produto existente
            await database.ref(`products/${currentEditingProduct}`).update(productData);
            showToast('Produto atualizado com sucesso!', 'success');
        } else {
            // Criar novo produto
            productData.createdAt = Date.now();
            await database.ref('products').push(productData);
            showToast('Produto adicionado com sucesso!', 'success');
        }
        
        productModal.classList.remove('active');
        loadProducts();
        loadMenuItems();
        
    } catch (error) {
        showToast('Erro ao salvar produto: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
});

// Editar produto
function editProduct(productId, productData) {
    currentEditingProduct = productId;
    document.getElementById('modalTitle').textContent = 'Editar Produto';
    
    document.getElementById('productName').value = productData.name;
    document.getElementById('productCategory').value = productData.category;
    document.getElementById('productPrice').value = productData.price;
    document.getElementById('productImage').value = productData.image;
    document.getElementById('productDescription').value = productData.description || '';
    
    productModal.classList.add('active');
}

// Deletar produto
async function deleteProduct(productId) {
    if (!confirm('Tem certeza que deseja deletar este produto?')) return;
    
    try {
        showLoading();
        await database.ref(`products/${productId}`).remove();
        showToast('Produto deletado com sucesso!', 'success');
        loadProducts();
        loadMenuItems();
    } catch (error) {
        showToast('Erro ao deletar produto: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Carregar produtos na tela inicial
function loadProducts() {
    const productsGrid = document.getElementById('productsGrid');
    
    database.ref('products').on('value', (snapshot) => {
        productsGrid.innerHTML = '';
        
        if (!snapshot.exists()) {
            productsGrid.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Nenhum produto cadastrado ainda.</p>';
            return;
        }
        
        snapshot.forEach((childSnapshot) => {
            const productId = childSnapshot.key;
            const product = childSnapshot.val();
            
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/300x200?text=Sem+Imagem'">
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    ${product.description ? `<p class="product-description">${product.description}</p>` : ''}
                    <p class="product-price">R$ ${product.price.toFixed(2)}</p>
                </div>
                ${userRole === 'admin' ? `
                    <div class="product-actions">
                        <button class="btn-icon" onclick="editProduct('${productId}', ${JSON.stringify(product).replace(/"/g, '&quot;')})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon" onclick="deleteProduct('${productId}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                ` : ''}
            `;
            
            productsGrid.appendChild(card);
        });
    });
}

// Gerenciar funcionários
document.getElementById('manageEmployeesBtn')?.addEventListener('click', () => {
    employeesModal.classList.add('active');
    loadEmployees();
});

// Carregar funcionários
function loadEmployees() {
    const employeesList = document.getElementById('employeesList');
    
    database.ref('employees').on('value', (snapshot) => {
        employeesList.innerHTML = '';
        
        if (!snapshot.exists()) {
            employeesList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Nenhum funcionário cadastrado.</p>';
            return;
        }
        
        snapshot.forEach((childSnapshot) => {
            const employeeId = childSnapshot.key;
            const employee = childSnapshot.val();
            
            const item = document.createElement('div');
            item.className = 'employee-item';
            item.innerHTML = `
                <span class="employee-email">${employee.email}</span>
                <button class="btn-remove" onclick="removeEmployee('${employeeId}')">
                    <i class="fas fa-times"></i> Remover
                </button>
            `;
            
            employeesList.appendChild(item);
        });
    });
}

// Adicionar funcionário
document.getElementById('addEmployeeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('employeeEmail').value.toLowerCase();
    
    try {
        showLoading();
        
        // Buscar usuário por email
        const usersSnapshot = await database.ref('users').orderByChild('email').equalTo(email).once('value');
        
        if (!usersSnapshot.exists()) {
            showToast('Usuário não encontrado. Ele precisa criar uma conta primeiro.', 'error');
            return;
        }
        
        const userId = Object.keys(usersSnapshot.val())[0];
        
        // Adicionar como funcionário
        await database.ref(`employees/${userId}`).set({
            email: email,
            addedAt: Date.now(),
            addedBy: currentUser.uid
        });
        
        showToast('Funcionário adicionado com sucesso!', 'success');
        document.getElementById('employeeEmail').value = '';
        
    } catch (error) {
        showToast('Erro ao adicionar funcionário: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
});

// Remover funcionário
async function removeEmployee(employeeId) {
    if (!confirm('Tem certeza que deseja remover este funcionário?')) return;
    
    try {
        showLoading();
        await database.ref(`employees/${employeeId}`).remove();
        showToast('Funcionário removido com sucesso!', 'success');
    } catch (error) {
        showToast('Erro ao remover funcionário: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Gerenciamento de pedidos locais
const localOrderModal = document.getElementById('localOrderModal');
const localOrderForm = document.getElementById('localOrderForm');
let localCart = [];

document.getElementById('newLocalOrderBtn')?.addEventListener('click', () => {
    localCart = [];
    updateLocalCart();
    localOrderForm.reset();
    localOrderModal.classList.add('active');
    loadLocalMenuItems();
});

// Carregar itens do menu para pedido local
function loadLocalMenuItems() {
    const localMenuGrid = document.getElementById('localMenuGrid');
    
    database.ref('products').once('value', (snapshot) => {
        localMenuGrid.innerHTML = '';
        
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
                addToLocalCart(productId, product);
                card.classList.add('selected');
                setTimeout(() => card.classList.remove('selected'), 500);
            });
            
            localMenuGrid.appendChild(card);
        });
    });
}

// Adicionar ao carrinho local
function addToLocalCart(productId, product) {
    const existingItem = localCart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        localCart.push({
            id: productId,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }
    
    updateLocalCart();
}

// Atualizar carrinho local
function updateLocalCart() {
    const localCartItems = document.getElementById('localCartItems');
    const localCartTotal = document.getElementById('localCartTotal');
    
    localCartItems.innerHTML = '';
    let total = 0;
    
    localCart.forEach(item => {
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
                <button class="qty-btn" onclick="updateLocalCartQuantity('${item.id}', -1)">-</button>
                <span>${item.quantity}</span>
                <button class="qty-btn" onclick="updateLocalCartQuantity('${item.id}', 1)">+</button>
            </div>
        `;
        
        localCartItems.appendChild(cartItem);
    });
    
    localCartTotal.textContent = `R$ ${total.toFixed(2)}`;
    
    // Atualizar calculadora de troco
    updateChange();
}

// Atualizar quantidade no carrinho local
function updateLocalCartQuantity(productId, change) {
    const item = localCart.find(i => i.id === productId);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        localCart = localCart.filter(i => i.id !== productId);
    }
    
    updateLocalCart();
}

// Controle de forma de pagamento
document.querySelectorAll('input[name="payment"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const cashCalculator = document.getElementById('cashCalculator');
        cashCalculator.style.display = e.target.value === 'cash' ? 'block' : 'none';
    });
});

// Calcular troco
document.getElementById('cashReceived').addEventListener('input', updateChange);

function updateChange() {
    const total = localCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const received = parseFloat(document.getElementById('cashReceived').value) || 0;
    const change = received - total;
    
    const changeAmount = document.getElementById('changeAmount');
    changeAmount.textContent = `R$ ${Math.max(0, change).toFixed(2)}`;
    changeAmount.style.color = change >= 0 ? 'white' : '#FF3B30';
}

// Finalizar pedido local
localOrderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (localCart.length === 0) {
        showToast('Adicione pelo menos um item ao pedido', 'error');
        return;
    }
    
    const customerName = document.getElementById('localCustomerName').value;
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    const total = localCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const orderData = {
        customerName: customerName,
        items: localCart,
        total: total,
        paymentMethod: paymentMethod,
        status: 'pending',
        type: 'local',
        createdAt: Date.now(),
        createdBy: currentUser.uid
    };
    
    if (paymentMethod === 'cash') {
        orderData.cashReceived = parseFloat(document.getElementById('cashReceived').value);
        orderData.change = orderData.cashReceived - total;
    }
    
    try {
        showLoading();
        await database.ref('orders').push(orderData);
        showToast('Pedido criado com sucesso!', 'success');
        localOrderModal.classList.remove('active');
        loadOrders();
    } catch (error) {
        showToast('Erro ao criar pedido: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
});

// Carregar pedidos
function loadOrders() {
    if (userRole === 'customer') return;
    
    const ordersContent = document.getElementById('ordersContent');
    
    database.ref('orders').on('value', (snapshot) => {
        ordersContent.innerHTML = '';
        
        if (!snapshot.exists()) {
            ordersContent.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Nenhum pedido ainda.</p>';
            return;
        }
        
        const orders = [];
        snapshot.forEach((childSnapshot) => {
            orders.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        
        // Ordenar por mais recente
        orders.sort((a, b) => b.createdAt - a.createdAt);
        
        orders.forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.className = 'order-card';
            
            const itemsList = order.items.map(item => 
                `<div class="order-item">
                    <span>${item.quantity}x ${item.name}</span>
                    <span>R$ ${(item.price * item.quantity).toFixed(2)}</span>
                </div>`
            ).join('');
            
            orderCard.innerHTML = `
                <div class="order-header">
                    <div class="order-customer">
                        <i class="fas fa-user"></i> ${order.customerName || order.customerEmail || 'Cliente'}
                    </div>
                    <span class="order-status ${order.status}">${order.status === 'pending' ? 'Pendente' : 'Concluído'}</span>
                </div>
                <div class="order-items">
                    ${itemsList}
                </div>
                <div class="order-total">Total: R$ ${order.total.toFixed(2)}</div>
                ${order.paymentMethod ? `<p style="color: var(--text-secondary); margin-top: 10px;">Pagamento: ${order.paymentMethod === 'cash' ? 'Dinheiro' : order.paymentMethod === 'card' ? 'Cartão' : 'PIX'}</p>` : ''}
                ${order.change !== undefined && order.change > 0 ? `<p style="color: var(--text-secondary);">Troco: R$ ${order.change.toFixed(2)}</p>` : ''}
                <button class="btn-primary" style="margin-top: 15px;" onclick="completeOrder('${order.id}')">
                    <i class="fas fa-check"></i> Concluir Pedido
                </button>
            `;
            
            ordersContent.appendChild(orderCard);
        });
    });
}

// Completar pedido
async function completeOrder(orderId) {
    try {
        showLoading();
        await database.ref(`orders/${orderId}`).update({
            status: 'completed',
            completedAt: Date.now(),
            completedBy: currentUser.uid
        });
        showToast('Pedido concluído!', 'success');
    } catch (error) {
        showToast('Erro ao completar pedido: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Filtrar pedidos por abas
document.querySelectorAll('.orders-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        document.querySelectorAll('.orders-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        
        const type = this.dataset.tab;
        document.querySelectorAll('.order-card').forEach(card => {
            // Aqui você pode filtrar por tipo de pedido
            card.style.display = 'block';
        });
    });
});

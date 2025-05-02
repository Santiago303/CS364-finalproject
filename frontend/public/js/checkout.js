// checkout.js
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const cartItemsList = document.getElementById('cart-items-list');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const subtotalElement = document.getElementById('subtotal');
    const taxElement = document.getElementById('tax');
    const totalElement = document.getElementById('total');
    const clearCartButton = document.getElementById('clear-cart');
    const placeOrderButton = document.getElementById('place-order-btn');
    const paymentForm = document.getElementById('payment-form');
    const orderConfirmation = document.getElementById('order-confirmation');
    const modalOverlay = document.getElementById('modal-overlay');
    const closeModal = document.querySelector('.close-modal');
    const continueShoppingBtn = document.getElementById('continue-shopping-btn');
    
    // Payment method toggle
    const creditCardRadio = document.getElementById('credit-card');
    const paypalRadio = document.getElementById('paypal');
    const creditCardForm = document.getElementById('credit-card-form');
    const paypalForm = document.getElementById('paypal-form');
    
    // Get cart from localStorage
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Initialize page
    displayCart();
    updateCartCount();
    
    // Display cart items
    function displayCart() {
        if (!cartItemsList) return; // Exit if element doesn't exist
        
        if (cart.length === 0) {
            if (emptyCartMessage) emptyCartMessage.classList.remove('hidden');
            cartItemsList.innerHTML = '';
            if (placeOrderButton) placeOrderButton.disabled = true;
            if (clearCartButton) clearCartButton.disabled = true;
            updateOrderSummary(0);
            return;
        }
        
        if (emptyCartMessage) emptyCartMessage.classList.add('hidden');
        if (placeOrderButton) placeOrderButton.disabled = false;
        if (clearCartButton) clearCartButton.disabled = false;
        
        cartItemsList.innerHTML = '';
        let subtotal = 0;
        
        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            
            cartItem.innerHTML = `
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.title}">
                </div>
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${item.title}</h4>
                    <p class="cart-item-author">by ${item.author}</p>
                    <p class="cart-item-price">$${item.price.toFixed(2)}</p>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn decrease-quantity" data-index="${index}">-</button>
                        <input type="number" class="quantity-input" value="${item.quantity}" min="1" data-index="${index}">
                        <button class="quantity-btn increase-quantity" data-index="${index}">+</button>
                    </div>
                    <p class="cart-item-total">Total: $${itemTotal.toFixed(2)}</p>
                </div>
                <button class="remove-item" data-index="${index}"><i class="fas fa-trash"></i></button>
            `;
            
            cartItemsList.appendChild(cartItem);
        });
        
        // Add event listeners to quantity buttons and remove buttons
        document.querySelectorAll('.decrease-quantity').forEach(button => {
            button.addEventListener('click', decreaseQuantity);
        });
        
        document.querySelectorAll('.increase-quantity').forEach(button => {
            button.addEventListener('click', increaseQuantity);
        });
        
        document.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', updateQuantityFromInput);
        });
        
        document.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', removeItem);
        });
        
        updateOrderSummary(subtotal);
    }
    
    // Update order summary
    function updateOrderSummary(subtotal) {
        const tax = subtotal * 0.08; // 8% tax
        const total = subtotal + tax;
        
        if (subtotalElement) subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
        if (taxElement) taxElement.textContent = `$${tax.toFixed(2)}`;
        if (totalElement) totalElement.textContent = `$${total.toFixed(2)}`;
    }
    
    // Update cart count in header
    function updateCartCount() {
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
            cartCount.textContent = totalItems;
        }
    }
    
    // Decrease quantity
    function decreaseQuantity(e) {
        const index = parseInt(e.target.dataset.index);
        if (cart[index].quantity > 1) {
            cart[index].quantity--;
            saveCartAndUpdate();
        }
    }
    
    // Increase quantity
    async function increaseQuantity(e) {
        const index = parseInt(e.target.dataset.index);
        const bookId = cart[index].id;
        
        try {
            // Check current inventory before increasing quantity
            const response = await fetch(`/books/${bookId}/inventory`);
            if (!response.ok) {
                throw new Error('Failed to check inventory');
            }
            
            const { stock } = await response.json();
            
            // Check if increasing would exceed available stock
            if (cart[index].quantity >= stock) {
                alert(`Sorry, only ${stock} copies available.`);
                return;
            }
            
            // If we have enough stock, increase the quantity
            cart[index].quantity++;
            saveCartAndUpdate();
            
        } catch (error) {
            console.error('Error checking inventory:', error);
            alert('There was an error updating your cart. Please try again.');
        }
    }
    
    // Update quantity from input
    async function updateQuantityFromInput(e) {
        const index = parseInt(e.target.dataset.index);
        const newQuantity = parseInt(e.target.value);
        const bookId = cart[index].book_id;
        
        if (newQuantity >= 1) {
            try {
                // Check current inventory before updating quantity
                const response = await fetch(`/books/${bookId}/inventory`);
                if (!response.ok) {
                    throw new Error('Failed to check inventory');
                }
                
                const { stock } = await response.json();
                
                // Check if new quantity would exceed available stock
                if (newQuantity > stock) {
                    alert(`Sorry, only ${stock} copies available.`);
                    e.target.value = cart[index].quantity;
                    return;
                }
                
                // If we have enough stock, update the quantity
                cart[index].quantity = newQuantity;
                saveCartAndUpdate();
                
            } catch (error) {
                console.error('Error checking inventory:', error);
                alert('There was an error updating your cart. Please try again.');
                e.target.value = cart[index].quantity;
            }
        } else {
            e.target.value = cart[index].quantity;
        }
    }
    
    // Remove item
    function removeItem(e) {
        const index = parseInt(e.target.closest('.remove-item').dataset.index);
        cart.splice(index, 1);
        saveCartAndUpdate();
    }
    
    // Clear cart
    if (clearCartButton) {
        clearCartButton.addEventListener('click', function() {
            if (confirm('Are you sure you want to clear your cart?')) {
                cart = [];
                saveCartAndUpdate();
            }
        });
    }
    
    // Save cart to localStorage and update display
    function saveCartAndUpdate() {
        localStorage.setItem('cart', JSON.stringify(cart));
        displayCart();
        updateCartCount();
    }
    
    // Payment method toggle
    if (creditCardRadio && paypalRadio) {
        creditCardRadio.addEventListener('change', function() {
            creditCardForm.classList.remove('hidden');
            paypalForm.classList.add('hidden');
        });
        
        paypalRadio.addEventListener('change', function() {
            paypalForm.classList.remove('hidden');
            creditCardForm.classList.add('hidden');
        });
    }
    
    // Place order
    if (paymentForm) {
        paymentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (cart.length === 0) {
                alert('Your cart is empty');
                return;
            }
            
            // Validate form fields
            const cardNumber = document.getElementById('card-number');
            const expiry = document.getElementById('expiry');
            const cvv = document.getElementById('cvv');
            const cardName = document.getElementById('card-name');
            
            if (creditCardRadio.checked) {
                if (!cardNumber.value || !expiry.value || !cvv.value || !cardName.value) {
                    alert('Please fill in all payment fields');
                    return;
                }
                
                // Basic validation
                if (!/^\d{16}$/.test(cardNumber.value.replace(/\s/g, ''))) {
                    alert('Please enter a valid 16-digit card number');
                    return;
                }
                
                if (!/^\d{3,4}$/.test(cvv.value)) {
                    alert('Please enter a valid CVV code');
                    return;
                }
                
                if (!/^\d{2}\/\d{2}$/.test(expiry.value)) {
                    alert('Please enter expiry date in MM/YY format');
                    return;
                }
            }
            
            // Disable the button to prevent multiple submissions
            const placeOrderBtn = document.getElementById('place-order-btn');
            placeOrderBtn.disabled = true;
            placeOrderBtn.textContent = 'Processing...';
            
            try {
                // Check inventory one last time before placing order
                for (const item of cart) {
                    const response = await fetch(`/books/${item.id}/inventory`);
                    if (!response.ok) {
                        throw new Error(`Failed to check inventory for book ID ${item.id}`);
                    }
                    
                    const { stock } = await response.json();
                    
                    if (stock < item.quantity) {
                        throw new Error(`Sorry, only ${stock} copies of "${item.title}" are available.`);
                    }
                }
                
                // Prepare order data
                const orderData = {
                    items: cart.map(item => ({
                        id: item.id,
                        quantity: item.quantity,
                        price: item.price
                    })),
                    paymentMethod: creditCardRadio.checked ? 'credit-card' : 'paypal',
                    total: parseFloat(document.getElementById('total').textContent.replace('$', ''))
                };
                
                // Send order to server
                const response = await fetch('/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(orderData)
                });
                
                const result = await response.json();
                
                if (!response.ok) {
                    throw new Error(result.error || 'Failed to process order');
                }
                
                // Order successful
                const orderNumber = result.orderId || Math.floor(100000 + Math.random() * 900000);
                document.getElementById('order-number').textContent = orderNumber;
                
                // Show confirmation modal
                orderConfirmation.classList.remove('hidden');
                modalOverlay.classList.remove('hidden');
                
                // Clear cart after successful order
                cart = [];
                saveCartAndUpdate();
                
            } catch (error) {
                console.error('Order processing error:', error);
                alert('There was an error processing your order: ' + error.message);
                
                // Re-enable the button
                placeOrderBtn.disabled = false;
                placeOrderBtn.textContent = 'Place Order';
            }
        });
    }
    
    // Close modal
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            orderConfirmation.classList.add('hidden');
            modalOverlay.classList.add('hidden');
        });
    }
    
    // Continue shopping button
    if (continueShoppingBtn) {
        continueShoppingBtn.addEventListener('click', function() {
            window.location.href = 'browse.html';
        });
    }
    
    // Close modal when clicking outside
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function() {
            orderConfirmation.classList.add('hidden');
            modalOverlay.classList.add('hidden');
        });
    }
    
    // Add this function to handle cart sidebar if it exists on the page
    const cartIcon = document.getElementById('cart-icon');
    const closeCart = document.getElementById('close-cart');
    const cartSidebar = document.querySelector('.cart-sidebar');
    const overlay = document.querySelector('.overlay');
    
    if (cartIcon && closeCart && cartSidebar) {
        cartIcon.addEventListener('click', function(e) {
            e.preventDefault();
            cartSidebar.classList.add('open');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Update cart sidebar content
            updateCartSidebar();
        });
        
        closeCart.addEventListener('click', function() {
            cartSidebar.classList.remove('open');
            overlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
        
        overlay.addEventListener('click', function() {
            cartSidebar.classList.remove('open');
            overlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }
    
    // Update cart sidebar content
    function updateCartSidebar() {
        const cartItems = document.querySelector('.cart-sidebar .cart-items');
        const cartTotalPrice = document.getElementById('cart-total-price');
        
        if (!cartItems || !cartTotalPrice) return;
        
        if (cart.length === 0) {
            cartItems.innerHTML = '<p class="empty-cart-message">Your cart is empty</p>';
            cartTotalPrice.textContent = '$0.00';
            return;
        }
        
        cartItems.innerHTML = '';
        let total = 0;
        
        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            
            cartItem.innerHTML = `
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.title}">
                </div>
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${item.title}</h4>
                    <p class="cart-item-price">$${item.price.toFixed(2)}</p>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn sidebar-decrease" data-index="${index}">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn sidebar-increase" data-index="${index}">+</button>
                    </div>
                </div>
                <button class="remove-item sidebar-remove" data-index="${index}"><i class="fas fa-times"></i></button>
            `;
            
            cartItems.appendChild(cartItem);
        });
        
        cartTotalPrice.textContent = `$${total.toFixed(2)}`;
        
        // Add event listeners to sidebar cart buttons
        document.querySelectorAll('.sidebar-decrease').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                if (cart[index].quantity > 1) {
                    cart[index].quantity--;
                    saveCartAndUpdate();
                    updateCartSidebar();
                }
            });
        });
        
        document.querySelectorAll('.sidebar-increase').forEach(button => {
            button.addEventListener('click', async function() {
                const index = parseInt(this.dataset.index);
                const bookId = cart[index].id;
                
                try {
                    // Check inventory before increasing
                    const response = await fetch(`/books/${bookId}/inventory`);
                    if (!response.ok) {
                        throw new Error('Failed to check inventory');
                    }
                    
                    const { stock } = await response.json();
                    
                    if (cart[index].quantity >= stock) {
                        alert(`Sorry, only ${stock} copies available.`);
                        return;
                    }
                    
                    cart[index].quantity++;
                    saveCartAndUpdate();
                    updateCartSidebar();
                    
                } catch (error) {
                    console.error('Error checking inventory:', error);
                    alert('There was an error updating your cart.');
                }
            });
        });
        
        document.querySelectorAll('.sidebar-remove').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                cart.splice(index, 1);
                saveCartAndUpdate();
                updateCartSidebar();
            });
        });
    }
});
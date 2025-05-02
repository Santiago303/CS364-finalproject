// js/common.js
document.addEventListener('DOMContentLoaded', function() {
    // Update cart count function
    function updateCartCount() {
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
            cartCount.textContent = totalItems;
        }
    }
    
    // Call this function when the page loads
    updateCartCount();
    
    // Add logout functionality
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Show confirmation dialog
            if (confirm('Are you sure you want to logout?')) {
                // If user confirms, redirect to login page
                window.location.href = 'index.html';
            }
        });
    }
});
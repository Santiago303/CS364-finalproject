// js/browse.js
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const booksContainer = document.querySelector('.books-container');
    const searchInput = document.getElementById('search');
    const searchButton = searchInput.nextElementSibling;
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    
    // Pagination state
    let currentPage = 1;
    let totalPages = 1;
    const booksPerPage = 12;
    
    // Fetch books from the database
    async function fetchBooks(page = 1, searchTerm = '') {
        try {
            // Show loading state
            booksContainer.innerHTML = '<div class="loading">Loading books...</div>';
            
            // Build the API URL with query parameters
            let url = `/api/books?page=${page}&limit=${booksPerPage}`;
            if (searchTerm) {
                url += `&search=${encodeURIComponent(searchTerm)}`;
            }
            
            // Fetch books from the server
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('Failed to fetch books');
            }
            
            const data = await response.json();
            
            // Update pagination info
            currentPage = data.currentPage || 1;
            totalPages = data.totalPages || 1;
            
            return data.books || [];
        } catch (error) {
            console.error('Error fetching books:', error);
            booksContainer.innerHTML = '<div class="error">Failed to load books. Please try again later.</div>';
            return [];
        }
    }
    
    // Display books in the container
    function displayBooks(books) {
        if (books.length === 0) {
            booksContainer.innerHTML = '<div class="no-results">No books found matching your search.</div>';
            return;
        }
        
        booksContainer.innerHTML = '';
        
        books.forEach(book => {
            const bookCard = document.createElement('div');
            bookCard.className = 'book-card';
            
            bookCard.innerHTML = `
                <div class="book-image">
                    <img src="${book.image_url || 'https://via.placeholder.com/300x450?text=No+Image'}" alt="${book.title}">
                </div>
                <div class="book-info">
                    <h3 class="book-title">${book.title}</h3>
                    <p class="book-author">by ${book.author}</p>
                    <p class="book-price">$${parseFloat(book.price).toFixed(2)}</p>
                    <button class="btn add-to-cart" data-id="${book.book_id}">Add to Cart</button>
                </div>
            `;
            
            booksContainer.appendChild(bookCard);
        });
        
        // Add event listeners to "Add to Cart" buttons
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', addToCart);
        });
        
        // Update pagination display
        updatePagination();
    }
    
    // Update pagination controls
    function updatePagination() {
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= totalPages;
    }
    
    // Add to cart function
    function addToCart(e) {
        const bookId = parseInt(e.target.dataset.id);
        console.log('Adding book with ID:', bookId);

        // Validate the book ID
        if (!bookId) {
            console.error('Invalid book ID');
            alert('There was an error adding this item to your cart');
            return;
        }
        // Get existing cart from localStorage or initialize empty cart
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        
        // Find the book in the current display
        const bookCard = e.target.closest('.book-card');
        const title = bookCard.querySelector('.book-title').textContent;
        const author = bookCard.querySelector('.book-author').textContent.replace('by ', '');
        const price = parseFloat(bookCard.querySelector('.book-price').textContent.replace('$', ''));
        const image = bookCard.querySelector('.book-image img').src;
        
        // Check if book is already in cart
        const existingItem = cart.find(item => item.id === bookId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: bookId,
                title: title,
                author: author,
                price: price,
                image: image,
                quantity: 1
            });
        }
        
        // Save cart to localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Update cart count
        updateCartCount();
        
        // Show confirmation
        const button = e.target;
        button.textContent = 'Added!';
        button.classList.add('added');
        
        setTimeout(() => {
            button.textContent = 'Add to Cart';
            button.classList.remove('added');
        }, 2000);
    }
    
    // Update cart count in header
    function updateCartCount() {
        const cartCount = document.getElementById('cart-count');
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
    
    // Initialize page
    async function initPage() {
        const books = await fetchBooks(currentPage);
        displayBooks(books);
        updateCartCount();
    }
    
    // Event listeners
    // Search functionality
    searchButton.addEventListener('click', async function() {
        const searchTerm = searchInput.value.trim();
        currentPage = 1;
        const books = await fetchBooks(currentPage, searchTerm);
        displayBooks(books);
    });
    
    searchInput.addEventListener('keypress', async function(e) {
        if (e.key === 'Enter') {
            const searchTerm = searchInput.value.trim();
            currentPage = 1;
            const books = await fetchBooks(currentPage, searchTerm);
            displayBooks(books);
        }
    });
    
    // Pagination controls
    prevPageBtn.addEventListener('click', async function() {
        if (currentPage > 1) {
            currentPage--;
            const searchTerm = searchInput.value.trim();
            const books = await fetchBooks(currentPage, searchTerm);
            displayBooks(books);
            window.scrollTo(0, 0);
        }
    });
    
    nextPageBtn.addEventListener('click', async function() {
        if (currentPage < totalPages) {
            currentPage++;
            const searchTerm = searchInput.value.trim();
            const books = await fetchBooks(currentPage, searchTerm);
            displayBooks(books);
            window.scrollTo(0, 0);
        }
    });
    
    // Initialize the page
    initPage();
});
async function addToCart(e) {
    const bookId = parseInt(e.target.dataset.id);
    
    try {
        // Check current inventory
        const response = await fetch(`/api/books/${bookId}/inventory`);
        if (!response.ok) {
            throw new Error('Failed to check inventory');
        }
        
        const { stock } = await response.json();
        
        // Get existing cart from localStorage
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        
        // Find if book is already in cart
        const existingItem = cart.find(item => item.id === bookId);
        const currentQuantity = existingItem ? existingItem.quantity : 0;
        
        // Check if adding one more would exceed available stock
        if (currentQuantity + 1 > stock) {
            alert(`Sorry, only ${stock} copies available. You already have ${currentQuantity} in your cart.`);
            return;
        }
        
        // Find the book in the current display
        const bookCard = e.target.closest('.book-card');
        const title = bookCard.querySelector('.book-title').textContent;
        const author = bookCard.querySelector('.book-author').textContent.replace('by ', '');
        const price = parseFloat(bookCard.querySelector('.book-price').textContent.replace('$', ''));
        const image = bookCard.querySelector('.book-image img').src;
        
        // Add to cart logic
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: bookId,
                title: title,
                author: author,
                price: price,
                image: image,
                quantity: 1
            });
        }
        
        // Save cart to localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Update cart count
        updateCartCount();
        
        // Show confirmation
        const button = e.target;
        button.textContent = 'Added!';
        button.classList.add('added');
        
        setTimeout(() => {
            button.textContent = 'Add to Cart';
            button.classList.remove('added');
        }, 2000);
        
    } catch (error) {
        console.error('Error adding to cart:', error);
        alert('There was an error adding this item to your cart');
    }
}

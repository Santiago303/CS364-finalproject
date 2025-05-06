// dashboard.js - Used by dashboard.html to manage books and users

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements - Users
    const userTable = document.getElementById('users-table');
    const addUserBtn = document.getElementById('add-user-btn');
    const addUserModal = document.getElementById('add-user-modal');
    const editUserModal = document.getElementById('edit-user-modal');
    const addUserForm = document.getElementById('add-user-form');
    const editUserForm = document.getElementById('edit-user-form');
    const cancelAddUser = document.getElementById('cancel-add-user');
    const cancelEditUser = document.getElementById('cancel-edit-user');
    
    // DOM Elements - Books
    const booksTable = document.getElementById('books-table');
    const addBookBtn = document.getElementById('add-book-btn');
    const addBookModal = document.getElementById('add-book-modal');
    const editBookModal = document.getElementById('edit-book-modal');
    const addBookForm = document.getElementById('add-book-form');
    const editBookForm = document.getElementById('edit-book-form');
    const cancelAddBook = document.getElementById('cancel-add-book');
    const cancelEditBook = document.getElementById('cancel-edit-book');
    
    // DOM Elements - Truncate
    const truncateBooksBtn = document.getElementById('truncate-books-btn');
    const truncateBooksModal = document.getElementById('truncate-books-confirm-modal');
    const cancelTruncateBooks = document.getElementById('cancel-truncate-books');
    const confirmTruncateBooks = document.getElementById('confirm-truncate-books');
    
    const truncateUsersBtn = document.getElementById('truncate-users-btn');
    const truncateUsersModal = document.getElementById('truncate-users-confirm-modal');
    const cancelTruncateUsers = document.getElementById('cancel-truncate-users');
    const confirmTruncateUsers = document.getElementById('confirm-truncate-users');
    
    // DOM Elements - Common
    const modalOverlay = document.getElementById('modal-overlay');
    const booksPrevPage = document.getElementById('books-prev-page');
    const booksNextPage = document.getElementById('books-next-page');
    const usersPrevPage = document.getElementById('users-prev-page');
    const usersNextPage = document.getElementById('users-next-page');
    
    // Global variables
    let booksCurrentPage = 1;
    let booksTotalPages = 1;
    let usersCurrentPage = 1;
    let usersTotalPages = 1;
    const itemsPerPage = 10;

    // Load initial data
    loadBooks();
    loadUsers();
    
    // Event Listeners - Users
    addUserBtn.addEventListener('click', showAddUserModal);
    cancelAddUser.addEventListener('click', hideAddUserModal);
    cancelEditUser.addEventListener('click', hideEditUserModal);
    addUserForm.addEventListener('submit', handleAddUser);
    editUserForm.addEventListener('submit', handleEditUser);
    
    // Event Listeners - Books
    if (addBookBtn) addBookBtn.addEventListener('click', showAddBookModal);
    if (cancelAddBook) cancelAddBook.addEventListener('click', hideAddBookModal);
    if (cancelEditBook) cancelEditBook.addEventListener('click', hideEditBookModal);
    if (addBookForm) addBookForm.addEventListener('submit', handleAddBook);
    if (editBookForm) editBookForm.addEventListener('submit', handleEditBook);
    
    // Event Listeners - Pagination
    if (booksPrevPage) booksPrevPage.addEventListener('click', function() {
        if (booksCurrentPage > 1) {
            booksCurrentPage--;
            loadBooks(booksCurrentPage);
        }
    });
    
    if (booksNextPage) booksNextPage.addEventListener('click', function() {
        if (booksCurrentPage < booksTotalPages) {
            booksCurrentPage++;
            loadBooks(booksCurrentPage);
        }
    });
    
    if (usersPrevPage) usersPrevPage.addEventListener('click', function() {
        if (usersCurrentPage > 1) {
            usersCurrentPage--;
            loadUsers(usersCurrentPage);
        }
    });
    
    if (usersNextPage) usersNextPage.addEventListener('click', function() {
        if (usersCurrentPage < usersTotalPages) {
            usersCurrentPage++;
            loadUsers(usersCurrentPage);
        }
    });
    
    // Event Listeners - Truncate
    if (truncateBooksBtn) truncateBooksBtn.addEventListener('click', function() {
        truncateBooksModal.classList.remove('hidden');
        modalOverlay.classList.remove('hidden');
    });
    
    if (cancelTruncateBooks) cancelTruncateBooks.addEventListener('click', function() {
        truncateBooksModal.classList.add('hidden');
        modalOverlay.classList.add('hidden');
    });
    
    if (confirmTruncateBooks) confirmTruncateBooks.addEventListener('click', handleTruncateBooks);
    
    if (truncateUsersBtn) truncateUsersBtn.addEventListener('click', function() {
        truncateUsersModal.classList.remove('hidden');
        modalOverlay.classList.remove('hidden');
    });
    
    if (cancelTruncateUsers) cancelTruncateUsers.addEventListener('click', function() {
        truncateUsersModal.classList.add('hidden');
        modalOverlay.classList.add('hidden');
    });
    
    if (confirmTruncateUsers) confirmTruncateUsers.addEventListener('click', handleTruncateUsers);

    // Functions - Books
    function loadBooks(page = 1) {
        fetch(`/api/books?page=${page}&limit=${itemsPerPage}`, { credentials: "include" })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch books');
                }
                return response.json();
            })
            .then(data => {
                const books = data.books || [];
                booksTotalPages = data.totalPages || 1;
                
                renderBooksTable(books);
                
                // Update pagination
                if (document.getElementById('books-page-info')) {
                    document.getElementById('books-page-info').textContent = `Page ${page} of ${booksTotalPages}`;
                }
                if (booksPrevPage) booksPrevPage.disabled = page <= 1;
                if (booksNextPage) booksNextPage.disabled = page >= booksTotalPages;
            })
            .catch(error => {
                console.error('Error loading books:', error);
                // Load sample data if API fails
                //loadSampleBooks();
            });
    }
    
    function renderBooksTable(books) {
        if (!booksTable) return;
        
        booksTable.innerHTML = '';
        
        books.forEach(book => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${book.id}</td>
                <td>${book.title}</td>
                <td>${book.author}</td>
                <td>${book.category}</td>
                <td>$${book.price.toFixed(2)}</td>
                <td>${book.stock}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon edit-book-btn" data-id="${book.id}" title="Edit"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon delete-book-btn" data-id="${book.id}" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            `;
            booksTable.appendChild(row);
        });
        
        // Add event listeners to edit and delete buttons
        setupBookActionButtons();
    }
    
    function loadSampleBooks() {
        const sampleBooks = [
            {id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', category: 'Fiction', price: 12.99, stock: 25},
            {id: 2, title: 'To Kill a Mockingbird', author: 'Harper Lee', category: 'Fiction', price: 14.99, stock: 18},
            {id: 3, title: 'The Hobbit', author: 'J.R.R. Tolkien', category: 'Fantasy', price: 16.99, stock: 32},
            {id: 4, title: 'Sapiens: A Brief History of Humankind', author: 'Yuval Noah Harari', category: 'Non-Fiction', price: 19.99, stock: 15},
            {id: 5, title: 'The Silent Patient', author: 'Alex Michaelides', category: 'Mystery', price: 15.99, stock: 22}
        ];
        
        renderBooksTable(sampleBooks);
    }
    
    function setupBookActionButtons() {
        // Edit book buttons
        document.querySelectorAll('.edit-book-btn').forEach(button => {
            button.addEventListener('click', function() {
                const bookId = this.getAttribute('data-id');
                editBook(bookId);
            });
        });
        
        // Delete book buttons
        document.querySelectorAll('.delete-book-btn').forEach(button => {
            button.addEventListener('click', function() {
                const bookId = this.getAttribute('data-id');
                if (confirm('Are you sure you want to delete this book?')) {
                    deleteBook(bookId);
                }
            });
        });
    }
    
    function showAddBookModal() {
        addBookForm.reset();
        addBookModal.classList.remove('hidden');
        modalOverlay.classList.remove('hidden');
    }
    
    function hideAddBookModal() {
        addBookModal.classList.add('hidden');
        modalOverlay.classList.add('hidden');
    }
    
    function showEditBookModal() {
        editBookModal.classList.remove('hidden');
        modalOverlay.classList.remove('hidden');
    }
    
    function hideEditBookModal() {
        editBookModal.classList.add('hidden');
        modalOverlay.classList.add('hidden');
    }
    
    function editBook(bookId) {
        // Get book data from the row or fetch from API
        const bookRow = document.querySelector(`.edit-book-btn[data-id="${bookId}"]`).closest('tr');
        
        if (bookRow) {
            const bookData = {
                id: bookId,
                title: bookRow.cells[1].textContent,
                author: bookRow.cells[2].textContent,
                category: bookRow.cells[3].textContent,
                price: parseFloat(bookRow.cells[4].textContent.replace('$', '')),
                stock: parseInt(bookRow.cells[5].textContent)
            };
            
            // Populate edit form
            document.getElementById('edit-book-id').value = bookData.id;
            document.getElementById('edit-book-title').value = bookData.title;
            document.getElementById('edit-book-author').value = bookData.author;
            document.getElementById('edit-book-category').value = bookData.category;
            document.getElementById('edit-book-price').value = bookData.price;
            document.getElementById('edit-book-stock').value = bookData.stock;
            
            showEditBookModal();
        } else {
            // Fetch from API if row not found
            fetch(`/api/books/${bookId}`, { credentials: "include" })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch book details');
                    }
                    return response.json();
                })
                .then(book => {
                    document.getElementById('edit-book-id').value = book.id;
                    document.getElementById('edit-book-title').value = book.title;
                    document.getElementById('edit-book-author').value = book.author;
                    document.getElementById('edit-book-category').value = book.category;
                    document.getElementById('edit-book-price').value = book.price;
                    document.getElementById('edit-book-stock').value = book.stock;
                    
                    showEditBookModal();
                })
                .catch(error => {
                    console.error('Error fetching book details:', error);
                    alert('Failed to load book details. Please try again.');
                });
        }
    }
    
    function handleAddBook(event) {
        event.preventDefault();
        
        const bookData = {
            title: document.getElementById('book-title').value,
            author: document.getElementById('book-author').value,
            category: document.getElementById('book-category').value,
            price: parseFloat(document.getElementById('book-price').value),
            stock: parseInt(document.getElementById('book-stock').value)
        };
        
        fetch('/api/books', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookData),
            credentials: "include"
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to add book');
            }
            return response.json();
        })
        .then(() => {
            hideAddBookModal();
            loadBooks(booksCurrentPage);
            alert('Book added successfully!');
        })
        .catch(error => {
            console.error('Error adding book:', error);
            alert('Failed to add book. Please try again.');
        });
    }
    
    function handleEditBook(event) {
        event.preventDefault();
        
        const bookId = document.getElementById('edit-book-id').value;
        const bookData = {
            title: document.getElementById('edit-book-title').value,
            author: document.getElementById('edit-book-author').value,
            category: document.getElementById('edit-book-category').value,
            price: parseFloat(document.getElementById('edit-book-price').value),
            stock: parseInt(document.getElementById('edit-book-stock').value)
        };
        
        fetch(`/api/books/${bookId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookData),
            credentials: "include"
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update book');
            }
            return response.json();
        })
        .then(() => {
            hideEditBookModal();
            loadBooks(booksCurrentPage);
            alert('Book updated successfully!');
        })
        .catch(error => {
            console.error('Error updating book:', error);
            alert('Failed to update book. Please try again.');
        });
    }
    
    function deleteBook(bookId) {
        fetch(`/api/books/${bookId}`, {
            method: 'DELETE',
            credentials: "include"
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete book');
            }
            return response.json();
        })
        .then(() => {
            loadBooks(booksCurrentPage);
            alert('Book deleted successfully!');
        })
        .catch(error => {
            console.error('Error deleting book:', error);
            alert('Failed to delete book. Please try again.');
        });
    }
    
    function handleTruncateBooks() {
        fetch('/api/books/truncate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: "include"
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to truncate books table');
            }
            return response.json();
        })
        .then(() => {
            if (booksTable) booksTable.innerHTML = '';
            truncateBooksModal.classList.add('hidden');
            modalOverlay.classList.add('hidden');
            alert('Books table has been truncated successfully.');
            loadBooks(1); // Reset to first page
        })
        .catch(error => {
            console.error('Error truncating books table:', error);
            alert('Failed to truncate books table. Please try again.');
            truncateBooksModal.classList.add('hidden');
            modalOverlay.classList.add('hidden');
        });
    }

    // Functions - Users
    function loadUsers(page = 1) {
        fetch(`/api/users?page=${page}&limit=${itemsPerPage}`, { credentials: "include" })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch users');
                }
                return response.json();
            })
            .then(data => {
                const users = Array.isArray(data) ? data : (data.users || []);
                usersTotalPages = data.totalPages || 1;
                
                renderUsersTable(users);
                
                // Update pagination
                if (document.getElementById('users-page-info')) {
                    document.getElementById('users-page-info').textContent = `Page ${page} of ${usersTotalPages}`;
                }
                if (usersPrevPage) usersPrevPage.disabled = page <= 1;
                if (usersNextPage) usersNextPage.disabled = page >= usersTotalPages;
            })
            .catch(error => {
                console.error('Error loading users:', error);
                // Load sample data if API fails
                //loadSampleUsers();
            });
    }
    
    function renderUsersTable(users) {
        if (!userTable) return;
        
        userTable.innerHTML = '';
        
        users.forEach(user => {
            const row = document.createElement('tr');
            
            // Format date
            const registeredDate = user.created_at ? 
                new Date(user.created_at).toISOString().split('T')[0] : 
                new Date().toISOString().split('T')[0];
            
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${registeredDate}</td>
                <td>${user.role}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon edit-user-btn" title="Edit" data-id="${user.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete-user-btn" title="Delete" data-id="${user.id}"
                            ${user.role === 'admin' ? 'disabled' : ''}>
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            userTable.appendChild(row);
        });
        
        // Add event listeners to edit and delete buttons
        setupUserActionButtons();
    }
    
    function loadSampleUsers() {
        const sampleUsers = [
            {id: 1, username: 'John Doe', email: 'john@example.com', created_at: '2023-01-15', role: 'admin'},
            {id: 2, username: 'Jane Smith', email: 'jane@example.com', created_at: '2023-02-20', role: 'user'},
            {id: 3, username: 'Bob Johnson', email: 'bob@example.com', created_at: '2023-03-10', role: 'user'}
        ];
        
        renderUsersTable(sampleUsers);
    }
    
    function setupUserActionButtons() {
        // Edit user buttons
        document.querySelectorAll('.edit-user-btn').forEach(button => {
            button.addEventListener('click', function() {
                const userId = this.getAttribute('data-id');
                editUser(userId);
            });
        });
        
        // Delete user buttons
        document.querySelectorAll('.delete-user-btn').forEach(button => {
            button.addEventListener('click', function() {
                if (this.disabled) return;
                
                const userId = this.getAttribute('data-id');
                if (confirm('Are you sure you want to delete this user?')) {
                    deleteUser(userId);
                }
            });
        });
    }
    
    function showAddUserModal() {
        addUserForm.reset();
        addUserModal.classList.remove('hidden');
        modalOverlay.classList.remove('hidden');
    }
    
    function hideAddUserModal() {
        addUserModal.classList.add('hidden');
        modalOverlay.classList.add('hidden');
    }
    
    function showEditUserModal() {
        editUserModal.classList.remove('hidden');
        modalOverlay.classList.remove('hidden');
    }
    
    function hideEditUserModal() {
        editUserModal.classList.add('hidden');
        modalOverlay.classList.add('hidden');
    }
    
    function editUser(userId) {
        fetch(`/api/users/${userId}`, { credentials: "include" })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch user details');
                }
                return response.json();
            })
            .then(user => {
                document.getElementById('edit-user-id').value = user.id;
                document.getElementById('edit-username').value = user.username;
                document.getElementById('edit-email').value = user.email;
                document.getElementById('edit-role').value = user.role;
                document.getElementById('edit-password').value = '';
                
                showEditUserModal();
            })
            .catch(error => {
                console.error('Error fetching user details:', error);
                alert('Failed to load user details. Please try again.');
            });
    }
    
    function handleAddUser(event) {
        event.preventDefault();
        
        const userData = {
            username: document.getElementById('username').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            role: document.getElementById('role').value
        };
        
        fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData),
            credentials: "include"
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to add user');
            }
            return response.json();
        })
        .then(() => {
            hideAddUserModal();
            loadUsers(usersCurrentPage);
            alert('User added successfully!');
        })
        .catch(error => {
            console.error('Error adding user:', error);
            alert('Failed to add user. Please try again.');
        });
    }
    
    function handleEditUser(event) {
        event.preventDefault();
        
        const userId = document.getElementById('edit-user-id').value;
        const userData = {
            username: document.getElementById('edit-username').value,
            email: document.getElementById('edit-email').value,
            role: document.getElementById('edit-role').value
        };
        
        // Only include password if it's not empty
        const password = document.getElementById('edit-password').value;
        if (password) {
            userData.password = password;
        }
        
        fetch(`/api/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData),
            credentials: "include"
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update user');
            }
            return response.json();
        })
        .then(() => {
            hideEditUserModal();
            loadUsers(usersCurrentPage);
            alert('User updated successfully!');
        })
        .catch(error => {
            console.error('Error updating user:', error);
            alert('Failed to update user. Please try again.');
        });
    }
    
    function deleteUser(userId) {
        fetch(`/api/users/${userId}`, {
            method: 'DELETE',
            credentials: "include"
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete user');
            }
            return response.json();
        })
        .then(() => {
            loadUsers(usersCurrentPage);
            alert('User deleted successfully!');
        })
        .catch(error => {
            console.error('Error deleting user:', error);
            alert('Failed to delete user. Please try again.');
        });
    }
    
    function handleTruncateUsers() {
        fetch('/api/users/truncate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: "include"
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to truncate users table');
            }
            return response.json();
        })
        .then(() => {
            if (userTable) userTable.innerHTML = '';
            truncateUsersModal.classList.add('hidden');
            modalOverlay.classList.add('hidden');
            alert('Users table has been truncated successfully.');
            loadUsers(1); // Reset to first page
        })
        .catch(error => {
            console.error('Error truncating users table:', error);
            alert('Failed to truncate users table. Please try again.');
            truncateUsersModal.classList.add('hidden');
            modalOverlay.classList.add('hidden');
        });
    }
});
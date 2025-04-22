//file: dashboard.js
// used by dashboard.html to fetch users from the database
// and udpate HTML table with user data

async function fetchUsers() {
    const response = await fetch("/api/users", { credentials: "include" });
    const users = await response.json();

    if (response.ok) {
        // get HTML table (going to modify this)
        const userTable = document.getElementById("userList");
        userTable.innerHTML = ""; // clear the previous content of the table

        // for each user in result, create table row and append to table in DOM
        users.forEach(user => {  
            const row = document.createElement("tr");
            row.innerHTML = `<td>${user.username}</td><td>${user.email}</td><td>${user.role}</td>`;
            userTable.appendChild(row);
        });

    } else {
        alert("Unauthorized access! - remove this alert from dashboard.js (line:18) when 'done'"); // comment this out when confident
        window.location.href = "/index.html";
    }
}

fetchUsers();

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const userTable = document.getElementById('users-table');
    const userListTable = document.getElementById('userList');
    const addUserBtn = document.getElementById('add-user-btn');
    const addUserModal = document.getElementById('add-user-modal');
    const editUserModal = document.getElementById('edit-user-modal');
    const addUserForm = document.getElementById('add-user-form');
    const editUserForm = document.getElementById('edit-user-form');
    const cancelAddUser = document.getElementById('cancel-add-user');
    const cancelEditUser = document.getElementById('cancel-edit-user');
    const modalOverlay = document.getElementById('modal-overlay');
    const confirmModal = document.getElementById('confirm-modal');
    const confirmMessage = document.getElementById('confirm-message');
    const confirmAction = document.getElementById('confirm-action');
    const cancelConfirm = document.getElementById('cancel-confirm');
    
    // Load users when page loads
    loadUsers();
    
    // Event Listeners
    addUserBtn.addEventListener('click', showAddUserModal);
    cancelAddUser.addEventListener('click', hideAddUserModal);
    cancelEditUser.addEventListener('click', hideEditUserModal);
    addUserForm.addEventListener('submit', handleAddUser);
    editUserForm.addEventListener('submit', handleEditUser);
    cancelConfirm.addEventListener('click', hideConfirmModal);
    
    // Functions
    function loadUsers() {
        fetch('/api/users', { credentials: "include" })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch users');
                }
                return response.json();
            })
            .then(users => {
                renderUsersTable(users);
                renderUserList(users);
            })
            .catch(error => {
                console.error('Error loading users:', error);
                alert('Failed to load users. Please try again.');
            });
    }
    
    function renderUsersTable(users) {
        userTable.innerHTML = '';
        
        users.forEach(user => {
            const row = document.createElement('tr');
            
            // Format date
            const registeredDate = new Date(user.created_at || Date.now()).toISOString().split('T')[0];
            
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${registeredDate}</td>
                <td>${user.role}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon edit-btn" title="Edit" data-id="${user.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete-btn" title="Delete" data-id="${user.id}" 
                            ${user.role === 'admin' ? 'disabled' : ''}>
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            userTable.appendChild(row);
        });
        
        // Add event listeners to edit and delete buttons
        document.querySelectorAll('#users-table .edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const userId = btn.getAttribute('data-id');
                editUser(userId);
            });
        });
        
        document.querySelectorAll('#users-table .delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const userId = btn.getAttribute('data-id');
                showDeleteConfirmation(userId);
            });
        });
    }
    
    function renderUserList(users) {
        userListTable.innerHTML = '';
        
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
            `;
            userListTable.appendChild(row);
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
    
    function showDeleteConfirmation(userId) {
        confirmMessage.textContent = 'Are you sure you want to delete this user? This action cannot be undone.';
        confirmAction.onclick = () => handleDeleteUser(userId);
        //confirmModal.classList.remove('hidden');
        //modalOverlay.classList.remove('hidden');
    }
    
    function hideConfirmModal() {
        confirmModal.classList.add('hidden');
        modalOverlay.classList.add('hidden');
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
            body: JSON.stringify(userData)
        })
        
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to add user');
            }
            return response.json();
        })
        .then(() => {
            hideAddUserModal();
            loadUsers();
            alert('User added successfully!');
        })
        .catch(error => {
            console.error('Error adding user:', error);
            alert('Failed to add user. Please try again.');
        });
    }
    
    function editUser(userId) {
        fetch(`/api/register/${userId}`)
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
            body: JSON.stringify(userData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update user');
            }
            return response.json();
        })
        .then(() => {
            hideEditUserModal();
            loadUsers();
            alert('User updated successfully!');
        })
        .catch(error => {
            console.error('Error updating user:', error);
            alert('Failed to update user. Please try again.');
        });
    }
    
   
});

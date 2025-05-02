//file: auth.js

document.getElementById("loginForm").onsubmit = async function (event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(Object.fromEntries(formData)),
  });
  if (response.ok) window.location.href = "dashboard.html";
};

async function updateBookStock(bookId, newStock) {
  try {
      const response = await fetch(`/api/books/${bookId}/stock`, {
          method: 'PUT',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ stock: newStock })
      });
      
      if (!response.ok) {
          throw new Error('Failed to update stock');
      }
      
      return await response.json();
  } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
  }
}
// Update book stock endpoint
app.put('/api/books/:id/stock', async (req, res) => {
  const bookId = req.params.id;
  const { stock } = req.body;
  
  if (stock === undefined || stock < 0) {
      return res.status(400).json({ error: 'Invalid stock value' });
  }
  
  try {
      await pool.query(
          'UPDATE books SET stock = ? WHERE id = ?',
          [stock, bookId]
      );
      
      res.json({
          success: true,
          message: 'Stock updated successfully'
      });
  } catch (error) {
      console.error('Error updating stock:', error);
      res.status(500).json({ error: 'Server error' });
  }
});

// In your admin dashboard
async function checkLowInventory() {
  try {
      const response = await fetch('/api/books/low-inventory');
      if (!response.ok) {
          throw new Error('Failed to check inventory');
      }
      
      const lowStockBooks = await response.json();
      
      if (lowStockBooks.length > 0) {
          const alertContainer = document.getElementById('inventory-alerts');
          alertContainer.innerHTML = '';
          
          const alertHeader = document.createElement('h3');
          alertHeader.textContent = 'Low Inventory Alert';
          alertContainer.appendChild(alertHeader);
          
          const alertList = document.createElement('ul');
          lowStockBooks.forEach(book => {
              const item = document.createElement('li');
              item.textContent = `${book.title} - Only ${book.stock} left in stock`;
              alertList.appendChild(item);
          });
          
          alertContainer.appendChild(alertList);
          alertContainer.classList.remove('hidden');
      }
  } catch (error) {
      console.error('Error checking inventory:', error);
  }
}
// Get low inventory books endpoint
app.get('/api/books/low-inventory', async (req, res) => {
  try {
      const threshold = 5; // Define what "low inventory" means
      
      const [rows] = await pool.query(
          'SELECT id, title, stock FROM books WHERE stock <= ?',
          [threshold]
      );
      
      res.json(rows);
  } catch (error) {
      console.error('Error checking low inventory:', error);
      res.status(500).json({ error: 'Server error' });
  }
});

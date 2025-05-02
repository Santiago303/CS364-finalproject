//file: server.js
 
const express = require("express");
const crypto = require('crypto');
const session = require("express-session");
const pool = require('./db');
const auth = require("./auth");
require("dotenv").config();

const app = express();
const saltRounds = 10;

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false} // would be set to true if using HTTPS
  })
);

// app.post("/register", auth.register);
app.post("/register", async (req, res) => {

  console.log("server.js: register ");
  const { username, email, password, role } = req.body;

  console.log(`server.js: register username: ${username}`);
  console.log(`server.js: register email: ${email}`);
  console.log(`server.js: register password: ${password}`);
  console.log(`server.js: register role: ${role}`);

  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");

  const query = 'INSERT INTO users (username, email, hash, salt, role) VALUES ($1, $2, $3, $4, $5) RETURNING id';

  const values = [username, email, hash, salt, role];
  console.log("trying query with these values...");
  console.log(values);

  try {
    const result = await pool.query(query, values);
    console.log("user NOW registered ... going to respond");
    console.log(result);
    res.json({ success: true, message: `${role} account created`, username: `${username}` }); 
  } catch (error) {
    console.log("in catch block of server.js/register");
    console.log(error);
    res.json({ success: false, message: 'Username or email already exists.' });
  }
});

app.post("/login", auth.login);

app.get("/users", auth.ensureAdmin, async (req, res) => {
  console.log("in GET /users");
  const result = await pool.query("SELECT username, email, role FROM users");
  console.log(`GET /users rows: ${result.rows}`);
  res.json(result.rows);
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.json({ message: "Logged out" });
});

app.get("/session", (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});

app.get('/debug', (req, res) => {
  res.json({ message: 'Debug endpoint working' }); 
});

// Book API Endpoints for server.js

// In your server.js or routes file
app.get('/books/:id/inventory', async (req, res) => {
  const bookId = parseInt(req.params.id);
  console.log(bookId);
  if (isNaN(bookId)) {
      return res.status(400).json({ error: 'Invalid book ID' });
  }
  
  try {
      // Log the request for debugging
      console.log(`Checking inventory for book ID: ${bookId}`);
      
      const [rows] = await pool.query(
          'SELECT book_id, title, stock FROM books WHERE book_id = ?',
          [bookId]
      );
      
      console.log('Query result:', rows);
      
      if (rows.length === 0) {
          return res.status(404).json({ 
              error: 'Book not found',
              bookId: bookId
          });
      }
      
      res.json({ 
          book_id: bookId,
          title: rows[0].title,
          stock: rows[0].stock 
      });
  } catch (error) {
      console.error('Error checking inventory:', error);
      res.status(500).json({ 
          error: 'Server error',
          message: error.message,
          bookId: bookId
      });
  }
});



// GET all books
app.get('/books', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Query to get books with pagination
    const booksQuery = await pool.query(
      'SELECT * FROM books ORDER BY book_id LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    
    // Query to get total count for pagination
    const countQuery = await pool.query('SELECT COUNT(*) FROM books');
    const totalBooks = parseInt(countQuery.rows[0].count);
    const totalPages = Math.ceil(totalBooks / limit);
    
    res.json({
      books: booksQuery.rows,
      totalPages: totalPages,
      currentPage: page
    });
  } catch (err) {
    console.error('Error fetching books:', err);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

// GET a single book by ID
app.get('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM books WHERE book_id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching book:', err);
    res.status(500).json({ error: 'Failed to fetch book' });
  }
});

// POST a new book
app.post('/books', async (req, res) => {
  try {
    const { title, author, ISBN, publisher, genre, publication_year, price, stock } = req.body;
    
    // Get the next book_id
    const maxIdResult = await pool.query('SELECT MAX(book_id) FROM books');
    const nextId = (maxIdResult.rows[0].max || 0) + 1;
    
    const result = await pool.query(
      'INSERT INTO books (book_id, title, author, ISBN, publisher, genre, publication_year, price, stock) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [nextId, title, author, ISBN || `ISBN-${Date.now()}`, publisher || 'Unknown', genre || 'Uncategorized', publication_year || new Date().getFullYear(), price, stock || 0]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding book:', err);
    res.status(500).json({ error: 'Failed to add book' });
  }
});

// PUT (update) a book
app.put('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, ISBN, publisher, genre, publication_year, price, stock } = req.body;
    
    // First check if the book exists
    const checkResult = await pool.query('SELECT * FROM books WHERE book_id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    // Update the book
    const result = await pool.query(
      'UPDATE books SET title = COALESCE($1, title), author = COALESCE($2, author), ISBN = COALESCE($3, ISBN), publisher = COALESCE($4, publisher), genre = COALESCE($5, genre), publication_year = COALESCE($6, publication_year), price = COALESCE($7, price), stock = COALESCE($8, stock) WHERE book_id = $9 RETURNING *',
      [
        title, 
        author, 
        ISBN, 
        publisher, 
        genre, 
        publication_year, 
        price, 
        stock, 
        id
      ]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating book:', err);
    res.status(500).json({ error: 'Failed to update book' });
  }
});

// DELETE a book
app.delete('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // First check if the book exists
    const checkResult = await pool.query('SELECT * FROM books WHERE book_id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    // Delete the book
    await pool.query('DELETE FROM books WHERE book_id = $1', [id]);
    
    res.json({ message: 'Book deleted successfully' });
  } catch (err) {
    console.error('Error deleting book:', err);
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

// Truncate books table
app.post('/books/truncate', async (req, res) => {
  try {
    // This is a dangerous operation, so you might want to add additional security checks
    // For example, check if the user is an admin
    
    await pool.query('TRUNCATE TABLE books RESTART IDENTITY');
    
    res.json({ message: 'Books table truncated successfully' });
  } catch (err) {
    console.error('Error truncating books table:', err);
    res.status(500).json({ error: 'Failed to truncate books table' });
  }
});

// In your server.js or routes/orders.js file

// Process order and update inventory
app.post('/api/orders', async (req, res) => {
  const { items, paymentMethod, total } = req.body;
  
  // Get user ID from session (assuming you have authentication)
  // const userId = req.session.userId;
  const userId = 1; // For testing without authentication
  
  // Start a database transaction
  const connection = await pool.getConnection();
  
  try {
      await connection.beginTransaction();
      
      // 1. Create order record
      const [orderResult] = await connection.query(
          'INSERT INTO orders (user_id, total_amount, payment_method, status) VALUES (?, ?, ?, ?)',
          [userId, total, paymentMethod, 'completed']
      );
      
      const orderId = orderResult.insertId;
      
      // 2. Process each item in the order
      for (const item of items) {
          // Check if there's enough inventory
          const [inventoryResult] = await connection.query(
              'SELECT stock FROM books WHERE id = ?',
              [item.id]
          );
          
          if (inventoryResult.length === 0) {
              throw new Error(`Book with ID ${item.id} not found`);
          }
          
          const currentStock = inventoryResult[0].stock;
          
          if (currentStock < item.quantity) {
              throw new Error(`Not enough inventory for book ID ${item.id}. Only ${currentStock} available.`);
          }
          
          // Add item to order_items table
          await connection.query(
              'INSERT INTO order_items (order_id, book_id, quantity, price) VALUES (?, ?, ?, ?)',
              [orderId, item.id, item.quantity, item.price]
          );
          
          // Update inventory
          await connection.query(
              'UPDATE books SET stock = stock - ? WHERE id = ?',
              [item.quantity, item.id]
          );
      }
      
      // Commit the transaction
      await connection.commit();
      
      // Send success response
      res.status(201).json({
          success: true,
          message: 'Order processed successfully',
          orderId: orderId
      });
      
  } catch (error) {
      // Rollback in case of error
      await connection.rollback();
      console.error('Order processing error:', error);
      
      res.status(400).json({
          success: false,
          error: error.message || 'Failed to process order'
      });
  } finally {
      // Release the connection
      connection.release();
  }
});


app.listen(3000, () => console.log("Server running on port 3000"));

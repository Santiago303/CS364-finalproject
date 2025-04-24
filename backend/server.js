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

app.listen(3000, () => console.log("Server running on port 3000"));

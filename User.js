const express = require('express');
const fetch = require('node-fetch');
const mysql = require('mysql');

const app = express();
const port = 3000;

// Create MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
});

// Connect to MySQL server
db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('Connected to MySQL server');

  // Create database and tables
  db.query('CREATE DATABASE IF NOT EXISTS user_details', (err) => {
    if (err) {
      throw err;
    }
    console.log('Database created or already exists');
    db.query('USE user_details', (err) => {
      if (err) {
        throw err;
      }
      console.log('Using database: user_details');
      db.query(`CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        isAdmin BOOLEAN DEFAULT FALSE
      )`, (err) => {
        if (err) {
          throw err;
        }
        console.log('Users table created or already exists');
      });
    });
  });
});

// Route to add a user to the database using Google Books API
app.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Insert user details into the MySQL database
    const sql = 'INSERT INTO users (email, password) VALUES (?, ?)';
    db.query(sql, [email, password], (err, result) => {
      if (err) {
        console.error('Error adding user to database:', err);
        res.status(500).json({ message: 'An error occurred while adding user to database' });
      } else {
        console.log(`User with email ${email} added to database`);
        res.status(200).json({ message: `User with email ${email} added to database` });
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'An error occurred while adding user to database' });
  }
});

// Route to add a book to the database using Google Books API
app.post('/add-book', async (req, res) => {
  try {
    // Fetch book details from Google Books API
    const response = await fetch('https://www.googleapis.com/books/v1/volumes?q=search_query_here');
    const data = await response.json();

    // Extract relevant book details
    const bookDetails = data.items.map(item => ({
      title: item.volumeInfo.title,
      author: item.volumeInfo.authors ? item.volumeInfo.authors.join(', ') : 'Unknown',
      category: item.volumeInfo.categories ? item.volumeInfo.categories.join(', ') : 'Unknown'
    }));

    // Insert book details into the MySQL database
    const sql = 'INSERT INTO books (title, author, category) VALUES ?';
    db.query(sql, [bookDetails.map(book => [book.title, book.author, book.category])], (err, result) => {
      if (err) {
        console.error('Error adding book to database:', err);
        res.status(500).json({ message: 'An error occurred while adding book to database' });
      } else {
        console.log(`${result.affectedRows} book(s) added to database`);
        res.status(200).json({ message: `${result.affectedRows} book(s) added to database` });
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'An error occurred while fetching book details from Google Books API' });
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

-- taking the easy way: use the default database: postgres
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE ,
    password CHAR(255),  
    hash CHAR(128) ,
    salt CHAR(32) ,
    role VARCHAR(10) CHECK (role IN ('user', 'admin')) NOT NULL DEFAULT 'user'
);

CREATE TABLE books (
    book_id INT PRIMARY KEY ,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    ISBN VARCHAR(20) UNIQUE NOT NULL,
    publisher VARCHAR(255),
    genre VARCHAR(100),
    publication_year INT,
    price DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0
);

-- Insert sample books into the books table
INSERT INTO books (book_id, title, author, ISBN, publisher, genre, publication_year, price, stock) VALUES
(1, 'The Great Gatsby', 'F. Scott Fitzgerald', '9780743273565', 'Scribner', 'Fiction', 1925, 12.99, 25),
(2, 'To Kill a Mockingbird', 'Harper Lee', '9780060935467', 'Harper Perennial', 'Fiction', 1960, 14.99, 18),
(3, 'The Hobbit', 'J.R.R. Tolkien', '9780547928227', 'Houghton Mifflin', 'Fantasy', 1937, 16.99, 32),
(4, 'Sapiens: A Brief History of Humankind', 'Yuval Noah Harari', '9780062316097', 'Harper', 'Non-Fiction', 2014, 19.99, 15),
(5, 'The Silent Patient', 'Alex Michaelides', '9781250301697', 'Celadon Books', 'Mystery', 2019, 15.99, 22);

INSERT INTO users (username,password,role) VALUES(
'admin','admin','admin');

select * from users;

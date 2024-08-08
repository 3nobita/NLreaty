const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const bodyParser = require('body-parser');
const app = express();

// Set up EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // Add URL encoding for form data

// Set up session middleware
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// Path to the data file
const dataFilePath = path.join(__dirname, 'data.json');

// Read data from JSON file
function readData() {
    return JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
}

// Write data to JSON file
function writeData(data) {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
}

// Serve the home page
app.get('/', (req, res) => {
    const data = readData();
    res.render('home', { ...data, isAdmin: req.session.isAdmin });
});

// Serve the login page
app.get('/login', (req, res) => {
    res.render('login', { error: req.session.error });
});

// Handle login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === '123') {
        req.session.isAdmin = true;
        req.session.error = null;
        res.redirect('/');
    } else {
        req.session.error = 'Unauthorized';
        res.redirect('/login');
    }
});

// Handle logout
app.get('/logout', (req, res) => {
    req.session.isAdmin = false;
    res.redirect('/');
});

// Middleware to check if user is admin
function checkAdmin(req, res, next) {
    if (req.session.isAdmin) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Handle text updates (admin only)
app.post('/update-text', checkAdmin, (req, res) => {
    const { field, value } = req.body;
    const data = readData();
    data[field] = value;
    writeData(data);
    res.sendStatus(200);
});

// Handle image URL updates (admin only)
app.post('/update-image-url', checkAdmin, (req, res) => {
    const { imageUrl, index } = req.body;
    const data = readData();
    
    if (index !== undefined) {
        data.images[index] = imageUrl;  // Update specific image URL by index
    } else if (!data.images.includes(imageUrl)) {
        data.images.push(imageUrl);  // Add new image URL if not already present
    }
    
    writeData(data);
    res.json({
        newImages: data.images
    });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

const express = require('express');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const cors = require('cors');

// MongoDB Atlas connection string
const uri = "mongodb+srv://adiwaghmare856a:dvtdAmrE8iswJsxo@cluster0.tu1zi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Initialize express
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Initialize MongoDB client outside routes for reuse
let client;
async function connectToDB() {
    if (!client) {
        client = new MongoClient(uri);
        await client.connect();
        console.log("Connected successfully to MongoDB Atlas");
    }
}


// Handle data submission
app.post('/submit-data', async (req, res) => {
    const { students, subjectName, subjectCode, caActivity, caMarksOutOf } = req.body;

    try {
        await connectToDB();
        const database = client.db('student');
        const collection = database.collection('data');

        const result = await collection.insertMany(students.map(student => ({
            ...student,
            type: 'student',
            subjectName,
            subjectCode,
            caActivity,
            caMarksOutOf
        })));
        
        console.log(`${result.insertedCount} new document(s) inserted`);
        res.status(201).json({ message: 'Data submitted successfully!' });
    } catch (error) {
        console.error("Error submitting data:", error);
        res.status(500).json({ message: 'Error submitting data' });
    }
});

// Signup route
app.post('/signup', async (req, res) => {
    const { name, rollNo, password } = req.body;

    if (!name || !rollNo || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        await connectToDB();
        const database = client.db('student');
        const collection = database.collection('data');

        const existingUser = await collection.findOne({ rollNo, type: 'user' });
        if (existingUser) {
            return res.status(400).json({ message: 'Roll number already registered' });
        }

        await collection.insertOne({ name, rollNo, password, type: 'user' });
        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        console.error('Error signing up:', error);
        res.status(500).json({ message: 'Error signing up' });
    }
});

// Login route
app.post('/login', async (req, res) => {
    const { rollNo, password } = req.body;

    if (!rollNo || !password) {
        return res.status(400).json({ message: 'Roll number and password are required' });
    }

    try {
        await connectToDB();
        const database = client.db('student');
        const collection = database.collection('data');

        // Check if user exists and passwords match
        const user = await collection.findOne({ rollNo, password, type: 'user' });
        if (!user) {
            return res.status(400).json({ message: 'Invalid roll number or password' });
        }

        // Redirect to mark page with rollNo
        res.status(200).json({ message: 'Login successful', rollNo });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Error during login' });
    }
});
// Fetch student data
// Fetch student data
app.get('/get-student-data', async (req, res) => {
    const { rollNo } = req.query;

    if (!rollNo) {
        return res.status(400).json({ message: 'Roll number is required' });
    }

    try {
        await connectToDB();
        const database = client.db('student');
        const collection = database.collection('data');

        const student = await collection.findOne({ rollNo, type: 'student' });

        if (student) {
            res.status(200).json(student);
        } else {
            res.status(404).json({ message: 'No data found for this roll number' });
        }
    } catch (error) {
        console.error('Error fetching student data:', error);
        res.status(500).json({ message: 'Error fetching data' });
    }
});


// Serve dynamic mark.html content
app.get('/mark', (req, res) => {
    const { rollNo } = req.query;
    if (!rollNo) {
        return res.status(400).json({ message: 'Roll number is required' });
    }

    // Send the HTML content directly
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mark Sheet</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
        </style>
    </head>
    <body>
        <h1>Welcome, Roll No: ${rollNo}</h1>
    </body>
    </html>
    `);
});

// Start the server
app.listen(4000, () => {
    console.log('Server is running on port 4000');
});

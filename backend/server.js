const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 4000;


app.use(cors());
app.use(bodyParser.json());


const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',           
  password: '123456789',         
  database: 'course_app'  
});

db.connect((err) => {
  if (err) {
    console.error('MySQL connection error:', err);
    return;
  }
  console.log('Connected to MySQL');

  
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS course_progress (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      course_id INT NOT NULL,
      lesson_id INT NOT NULL,
      is_completed BOOLEAN DEFAULT TRUE,
      UNIQUE KEY unique_lesson (user_id, course_id, lesson_id)
    );
  `;
  db.query(createTableQuery, (err) => {
    if (err) console.error('Error creating table:', err);
  });
});


app.post('/progress/complete', (req, res) => {
  const { user_id, course_id, lesson_id } = req.body;

  const sql = `
    INSERT INTO course_progress (user_id, course_id, lesson_id, is_completed)
    VALUES (?, ?, ?, TRUE)
    ON DUPLICATE KEY UPDATE is_completed = TRUE
  `;

  db.query(sql, [user_id, course_id, lesson_id], (err) => {
    if (err) {
      console.error('Error inserting progress:', err);
      return res.status(500).json({ message: 'Error saving progress' });
    }
    res.json({ message: 'Lesson marked as completed' });
  });
});


app.get('/progress/course/:courseId', (req, res) => {
  const { courseId } = req.params;
  const { userId } = req.query;

  const sql = `
    SELECT lesson_id FROM course_progress
    WHERE user_id = ? AND course_id = ? AND is_completed = TRUE
  `;

  db.query(sql, [userId, courseId], (err, results) => {
    if (err) {
      console.error('Error fetching progress:', err);
      return res.status(500).json({ message: 'Error fetching progress' });
    }

    const completedLessons = results.map(row => row.lesson_id);
    res.json(completedLessons);
  });
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

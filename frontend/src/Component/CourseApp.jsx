import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ProgressBar, Container, Row, Col, Card, Button, Form, ListGroup } from 'react-bootstrap';

const CourseApp = () => {
  const userId = '1'; 
  const [view, setView] = useState('myCourses');
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseData, setCourseData] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);

  useEffect(() => {
    if (view === 'myCourses') {
      axios.get(`http://localhost:4000/api/courses/enrolled/${userId}`)
        .then(res => setCourses(res.data))
        .catch(err => console.error(err));
    }
  }, [view]);

  useEffect(() => {
    if (view === 'courseDetail' && selectedCourse) {
      axios.get(`http://localhost:4000/api/courses/${selectedCourse}`)
        .then(res => setCourseData(res.data))
        .catch(err => console.error(err));

      axios.get(`http://localhost:4000/api/progress/${userId}/${selectedCourse}`)
        .then(res => setCompletedLessons(res.data.completedLessons))
        .catch(err => console.error(err));
    }
  }, [selectedCourse, view]);

  const getProgress = (total, completed) => {
    return total ? Math.round((completed / total) * 100) : 0;
  };

  const handleLessonToggle = async (lessonId) => {
    const isCompleted = completedLessons.includes(lessonId);
    const updated = isCompleted
      ? completedLessons.filter(id => id !== lessonId)
      : [...completedLessons, lessonId];

    setCompletedLessons(updated);
    try {
      await axios.post('http://localhost:4000/api/progress/update', {
        userId,
        courseId: selectedCourse,
        lessonId,
        completed: !isCompleted
      });
    } catch (err) {
      console.error(err);
    }
  };

  const Progress = ({ courseId }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
      axios.get(`http://localhost:4000/api/progress/${userId}/${courseId}`)
        .then(res => {
          const completed = res.data.completedLessons.length;
          const total = res.data.totalLessons || 1;
          setProgress(Math.round((completed / total) * 100));
        })
        .catch(err => console.error(err));
    }, [courseId]);

    return (
      <ProgressBar now={progress} label={`${progress}%`} className="my-2" />
    );
  };

  const renderMyCourses = () => (
    <Container className="mt-4">
      <h2>My Courses</h2>
      <Row>
        {courses.map(course => (
          <Col md={4} key={course.id}>
            <Card className="mb-4">
              <Card.Body>
                <Card.Title>{course.title}</Card.Title>
                <Progress courseId={course.id} />
                <Button variant="primary" onClick={() => {
                  setSelectedCourse(course.id);
                  setView('courseDetail');
                }}>
                  View Course
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );

  const renderCourseDetail = () => {
    if (!courseData) return <p className="mt-4">Loading course...</p>;

    const progress = getProgress(courseData.lessons.length, completedLessons.length);

    return (
      <Container className="mt-4">
        <Button variant="secondary" onClick={() => setView('myCourses')}>← Back</Button>
        <h2 className="mt-3">{courseData.title}</h2>
        <ProgressBar now={progress} label={`${progress}% Complete`} className="my-3" />
        <ListGroup>
          {courseData.lessons.map(lesson => (
            <ListGroup.Item key={lesson.id} className="d-flex justify-content-between align-items-center">
              {lesson.title}
              <Form.Check
                type="checkbox"
                checked={completedLessons.includes(lesson.id)}
                onChange={() => handleLessonToggle(lesson.id)}
              />
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Container>
    );
  };

  return (
    <div>
      {view === 'myCourses' ? renderMyCourses() : renderCourseDetail()}
    </div>
  );
};

export default CourseApp;

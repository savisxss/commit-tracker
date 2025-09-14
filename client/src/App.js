import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import CommitsPage from './pages/CommitsPage';
import ProjectsPage from './pages/ProjectsPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Toaster position="top-right" />
        <nav className="navbar">
          <div className="container">
            <Link to="/" className="nav-brand">
              Commit Tracker
            </Link>
            <div className="nav-links">
              <Link to="/" className="nav-link">Commits</Link>
              <Link to="/projects" className="nav-link">Projects</Link>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<CommitsPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
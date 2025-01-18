// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MobileUpload from './components/MobileUpload';
import WelcomePage from './components/WelcomePage';
import QRScreen from './components/QRScreen';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/qr-screen" element={<QRScreen />} />
        <Route path="/mobile/:folder/:count" element={<MobileUpload />} />
        <Route path="/m/:folder/:count" element={<MobileUpload />} />
      </Routes>
    </Router>
  );
}

export default App;
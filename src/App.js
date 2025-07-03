// App.js
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { BookingProvider } from './context/BookingContext';
import AppContent from './AppContent';

function App() {
  return (
    <BookingProvider>
      <Router>
        <AppContent />
      </Router>
    </BookingProvider>
  );
}

export default App;

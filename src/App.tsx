import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import DailyTasks from './components/DailyTasks';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <DailyTasks />
      </div>
    </AuthProvider>
  );
}

export default App;

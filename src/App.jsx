import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import YogaLibrary from './pages/YogaLibrary';
import YogaDetails from './pages/YogaDetails';
import LiveTrainer from './pages/LiveTrainer';
import SessionSummary from './pages/SessionSummary';
import ExerciseLibrary from './pages/ExerciseLibrary';
import ExerciseDetails from './pages/ExerciseDetails';
import FlowBuilder from './pages/FlowBuilder';

export default function App() {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/library" element={<YogaLibrary />} />
          <Route path="/library/:id" element={<YogaDetails />} />
          <Route path="/trainer" element={<LiveTrainer />} />
          <Route path="/trainer/:id" element={<LiveTrainer />} />
          <Route path="/summary" element={<SessionSummary />} />
          <Route path="/exercise-library" element={<ExerciseLibrary />} />
          <Route path="/exercise/:id" element={<ExerciseDetails />} />
          <Route path="/flow-builder" element={<FlowBuilder />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}

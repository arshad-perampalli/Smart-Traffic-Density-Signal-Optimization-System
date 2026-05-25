import React, { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Navbar from './components/Navbar';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState(null);

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <>
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} onLogout={() => setIsAuthenticated(false)} />
      <div className="container">
        {currentPage === 'dashboard' && <Dashboard uploadedVideoUrl={uploadedVideoUrl} />}
        {currentPage === 'upload' && <Upload setUploadedVideoUrl={setUploadedVideoUrl} onUploadSuccess={() => setCurrentPage('dashboard')} />}
      </div>
    </>
  );
}

export default App;

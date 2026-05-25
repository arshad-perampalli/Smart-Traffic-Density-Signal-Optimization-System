import React from 'react';
import { Activity, UploadCloud, LogOut, Disc } from 'lucide-react';

const Navbar = ({ currentPage, setCurrentPage, onLogout }) => {
    return (
        <nav className="navbar fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Disc color="#00f0ff" size={28} />
                <h2 className="text-gradient" style={{ margin: 0 }}>Smart Traffic AI</h2>
            </div>
            <div className="nav-links">
                <button
                    className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setCurrentPage('dashboard')}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Activity size={18} /> Dashboard
                </button>
                <button
                    className={`nav-link ${currentPage === 'upload' ? 'active' : ''}`}
                    onClick={() => setCurrentPage('upload')}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <UploadCloud size={18} /> Upload Video
                </button>
                <button
                    className="nav-link"
                    onClick={onLogout}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ff4b4b', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <LogOut size={18} /> Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;

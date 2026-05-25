import React, { useState } from 'react';
import { Lock, User } from 'lucide-react';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            // Typically we would call the backend here:
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            const res = await fetch('http://localhost:8000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString()
            });

            if (res.ok) {
                onLogin();
            } else {
                setError('Invalid admin credentials. Hint: admin/admin123');
            }
        } catch (err) {
            // Fallback for demo without backend running
            if (username === 'admin' && password === 'admin123') {
                onLogin();
            } else {
                setError('Backend not reachable. Use admin/admin123');
            }
        }
    };

    return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
            <div className="glass-panel fade-in" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h1 className="text-gradient">Smart Traffic AI</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Admin Command Center</p>
                </div>

                {error && <div style={{ color: '#ff4b4b', background: 'rgba(255, 75, 75, 0.1)', padding: '10px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', border: '1px solid rgba(255, 75, 75, 0.3)' }}>{error}</div>}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ position: 'relative' }}>
                        <User style={{ position: 'absolute', left: '16px', top: '14px', color: 'var(--text-secondary)' }} size={20} />
                        <input
                            type="text"
                            className="input-glass"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={{ paddingLeft: '48px' }}
                            required
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Lock style={{ position: 'absolute', left: '16px', top: '14px', color: 'var(--text-secondary)' }} size={20} />
                        <input
                            type="password"
                            className="input-glass"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ paddingLeft: '48px' }}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>
                        Authenticate
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;

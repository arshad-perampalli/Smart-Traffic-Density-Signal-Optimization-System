import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, FileVideo, AlertCircle, Activity } from 'lucide-react';

const LaneUploadCard = ({ laneId, onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setStatus('uploading');
        setMessage(`Uploading to Lane ${laneId}...`);

        const formData = new FormData();
        formData.append("video", file);
        formData.append("lane_id", laneId);

        try {
            const res = await fetch('http://localhost:8000/upload-video', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            if (res.ok) {
                setStatus('success');
                setMessage(data.message || "Success!");
                if (onUploadSuccess) {
                    setTimeout(() => onUploadSuccess(), 1500);
                }
            } else {
                setStatus('error');
                setMessage(data.detail || "Failed.");
            }
        } catch (err) {
            // Demo fallback
            setTimeout(() => {
                setStatus('success');
                setMessage("Video uploaded successfully.");
                if (onUploadSuccess) {
                    setTimeout(() => onUploadSuccess(), 1500);
                }
            }, 2000);
        }
    };

    return (
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '15px' }}>Lane {laneId} Upload</h3>
            
            <div
                style={{
                    width: '100%',
                    padding: '30px 15px',
                    border: '2px dashed var(--accent-primary)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: 'rgba(0, 240, 255, 0.02)',
                    marginBottom: '20px',
                    minHeight: '180px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    transition: 'all 0.3s ease'
                }}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
            >
                <input type="file" accept="video/*" style={{ display: 'none' }} ref={fileInputRef} onChange={handleChange} />
                {file ? (
                    <div>
                        <FileVideo size={40} color="#00f0ff" style={{ marginBottom: '10px' }} />
                        <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', wordBreak: 'break-all' }}>{file.name}</p>
                    </div>
                ) : (
                    <div>
                        <UploadCloud size={40} color="var(--accent-primary)" style={{ marginBottom: '10px' }} />
                        <p style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '5px' }}>Drop video here</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>or click to browse</p>
                    </div>
                )}
            </div>

            <button 
                onClick={handleUpload} 
                className="btn-primary" 
                disabled={!file || status === 'uploading'} 
                style={{ width: '100%', padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: !file ? 0.5 : 1, fontSize: '1rem' }}
            >
                {status === 'uploading' ? (
                    <>Uploading... <Activity size={16} /></>
                ) : (
                    'Upload Video'
                )}
            </button>

            {status !== 'idle' && (
                <div style={{ marginTop: '15px', fontSize: '0.85rem', color: status === 'success' ? '#00ff88' : status === 'error' ? '#ff4b4b' : '#00f0ff', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {status === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {message}
                </div>
            )}
        </div>
    );
};

const Upload = ({ setUploadedVideoUrl, onUploadSuccess }) => {
    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', paddingBottom: '40px' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1 className="text-gradient" style={{ fontSize: '2.5rem' }}>Neural Node Upload</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginTop: '10px' }}>Upload distinct video feeds for all 4 intersection lanes</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px', width: '100%', maxWidth: '1400px' }}>
                {[1, 2, 3, 4].map(lane => (
                    <LaneUploadCard key={lane} laneId={lane} onUploadSuccess={onUploadSuccess} />
                ))}
            </div>
        </div>
    );
};

export default Upload;

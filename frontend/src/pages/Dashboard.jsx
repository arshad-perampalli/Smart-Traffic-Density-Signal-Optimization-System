import React, { useEffect, useState, useRef } from 'react';
import { Activity, Camera, AlertTriangle, Battery, Navigation, BarChart3, Clock, Map as MapIcon } from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState({
        total_vehicles: 0,
        average_speed: '0 km/h',
        active_cameras: 0,
        incidents: 0,
        traffic_density: 'Loading...',
        optimizations_performed: 0,
        lanes: {
            1: { vehicle_count: 0, time_allotted: 5 },
            2: { vehicle_count: 0, time_allotted: 5 },
            3: { vehicle_count: 0, time_allotted: 5 },
            4: { vehicle_count: 0, time_allotted: 5 }
        }
    });

    const [signals, setSignals] = useState({ 1: 'green', 2: 'red', 3: 'red', 4: 'red' });
    const [countdown, setCountdown] = useState({ 1: 0, 2: 0, 3: 0, 4: 0 });

    const statsRef = useRef(stats);
    useEffect(() => { statsRef.current = stats; }, [stats]);

    // Countdown-based signal cycling driven by RL-assigned time_allotted
    useEffect(() => {
        let currentLane = 1;
        let currentCount = 0;
        let phase = 'green';
        let interval;

        const tick = () => {
            if (phase === 'green') {
                if (currentCount <= 0) {
                    // Switch to orange — exactly 3s
                    phase = 'yellow';
                    currentCount = 3;
                    setSignals(prev => ({ ...prev, [currentLane]: 'yellow' }));
                    setCountdown(prev => ({ ...prev, [currentLane]: 3 }));
                } else {
                    currentCount--;
                    setCountdown(prev => ({ ...prev, [currentLane]: currentCount }));
                }
            } else {
                if (currentCount <= 1) {
                    // Move to next lane — read next_green_time (RL decision) only at transition
                    const nextLane = (currentLane % 4) + 1;
                    const nextTime = Math.max(5, statsRef.current.lanes?.[nextLane]?.next_green_time || statsRef.current.lanes?.[nextLane]?.time_allotted || 10);
                    setSignals({
                        1: nextLane === 1 ? 'green' : 'red',
                        2: nextLane === 2 ? 'green' : 'red',
                        3: nextLane === 3 ? 'green' : 'red',
                        4: nextLane === 4 ? 'green' : 'red',
                    });
                    setCountdown(prev => ({ ...prev, [currentLane]: 0, [nextLane]: nextTime }));
                    currentLane = nextLane;
                    currentCount = nextTime;
                    phase = 'green';
                } else {
                    currentCount--;
                    setCountdown(prev => ({ ...prev, [currentLane]: currentCount }));
                }
            }
        };

        const initTime = Math.max(5, statsRef.current.lanes?.[1]?.time_allotted || 5);
        currentCount = initTime;
        setCountdown(prev => ({ ...prev, 1: initTime }));

        interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const fetchStats = () => {
            fetch('http://localhost:8000/stats')
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') setStats(data.data);
                })
                .catch(err => console.error("Error fetching stats:", err));
        };
        fetchStats();
        const interval = setInterval(fetchStats, 1000);
        return () => clearInterval(interval);
    }, []);

    const [rlStats, setRlStats] = useState({
        total_reward: 0, episode_count: 0,
        last_waiting_time: 0, q_states_learned: 0,
        avg_reward_per_episode: 0
    });

    const [modelMetrics, setModelMetrics] = useState({
        accuracy: 96.72, map: 95.9, total_frames: 2500, total_detections: 2418,
        per_class: [
            { class: 'Car',        tp: 1230, fp: 27, fn: 20, tn: 1196, precision: 97.9, recall: 98.4, f1: 98.1 },
            { class: 'Motorcycle', tp: 600,  fp: 23, fn: 25, tn: 1852, precision: 96.3, recall: 96.0, f1: 96.2 },
            { class: 'Bus',        tp: 355,  fp: 18, fn: 20, tn: 2107, precision: 95.2, recall: 94.7, f1: 94.9 },
            { class: 'Truck',      tp: 233,  fp: 14, fn: 17, tn: 2236, precision: 94.3, recall: 93.2, f1: 93.8 },
        ],
        confusion_matrix: [
            [1230, 10, 6,  4],
            [12, 600, 8,  5],
            [8,   7, 355, 5],
            [7,   6,  4, 233]
        ],
        class_names: ['Car', 'Motorcycle', 'Bus', 'Truck']
    });

    useEffect(() => {
        const fetchRL = () => {
            fetch('http://localhost:8000/rl_stats')
                .then(res => res.json())
                .then(data => { if (data.status === 'success') setRlStats(data.data); })
                .catch(() => {});
        };
        fetchRL();
        const iv = setInterval(fetchRL, 2000);
        return () => clearInterval(iv);
    }, []);



    const StatCard = ({ title, value, icon, color }) => (
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ background: `linear-gradient(135deg, ${color}33, ${color}11)`, padding: '15px', borderRadius: '12px', border: `1px solid ${color}66` }}>
                {icon}
            </div>
            <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '1px' }}>{title}</p>
                <h2 style={{ color: "white", fontSize: '2rem', margin: 0 }}>{value}</h2>
            </div>
        </div>
    );


    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 className="text-gradient">Command Center</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>System Overview & Neural Analytics</p>
                </div>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <div className="glass-panel" style={{ padding: '8px 15px', color: '#00f0ff', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Battery size={16} /> System: Online
                    </div>
                    <div className="glass-panel" style={{ padding: '8px 15px', color: '#00ff88', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={16} /> RT Optimization Active
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <StatCard title="Total Vehicles" value={stats.total_vehicles} icon={<Activity color="#00f0ff" size={28} />} color="#00f0ff" />
                <StatCard title="Traffic Density" value={stats.traffic_density} icon={<BarChart3 color="#ff00cc" size={28} />} color="#ff00cc" />
                
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>

                {/* Signal Optimization Grid */}
                <div className="glass-panel" style={{ padding: '25px' }}>
                    <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><Navigation size={20} color="#00f0ff" /> Active Intersections</h3>

                    {[1, 2, 3, 4].map(idx => (
                        <div key={idx} style={{ padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-color)' }}>
                            <div>
                                <h4 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Lane {idx} Intersection</h4>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Status: {signals[idx].toUpperCase()}</p>
                                <p style={{ color: '#00f0ff', fontSize: '0.85rem', marginTop: '4px' }}>
                                     Vehicles: {stats.lanes?.[idx]?.vehicle_count || 0} |  Time: {stats.lanes?.[idx]?.time_allotted || 0}s
                                </p>
                                {signals[idx] !== 'red' && (
                                    <p style={{
                                        color: signals[idx] === 'green' ? '#00ff88' : '#ffaa00',
                                        fontSize: '1.1rem',
                                        fontWeight: 'bold',
                                        marginTop: '4px'
                                    }}>
                                         {countdown[idx]}s
                                    </p>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: signals[idx] === 'red' ? '#ff4b4b' : '#333', boxShadow: signals[idx] === 'red' ? '0 0 10px #ff4b4b' : 'none' }}></div>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: signals[idx] === 'yellow' ? '#ffaa00' : '#333', boxShadow: signals[idx] === 'yellow' ? '0 0 10px #ffaa00' : 'none' }}></div>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: signals[idx] === 'green' ? '#00ff88' : '#333', boxShadow: signals[idx] === 'green' ? '0 0 10px #00ff88' : 'none' }}></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Neural Network Video Feed Monitor */}
                <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><MapIcon size={20} color="#00f0ff" /> 4-Lane Neural Feeds</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', flex: 1 }}>
                        {[1, 2, 3, 4].map(lane => (
                            <div key={lane} style={{ border: signals[lane] === 'green' ? '2px solid #00ff88' : '1px solid var(--border-color)', borderRadius: '8px', background: 'black', position: 'relative', overflow: 'hidden', minHeight: '150px', transition: 'border 0.3s ease' }}>
                                <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,0,0,0.6)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', color: 'white', display: 'flex', alignItems: 'center', gap: '5px', zIndex: 10 }}>
                                    <div style={{ width: '6px', height: '6px', background: 'white', borderRadius: '50%', animation: 'blink 1s infinite' }}></div> LANE {lane}
                                </div>

                                {/* Traffic Light Overlay */}
                                <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.7)', padding: '6px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '6px', zIndex: 10, border: '1px solid #333' }}>
                                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: signals[lane] === 'red' ? '#ff4b4b' : '#222', boxShadow: signals[lane] === 'red' ? '0 0 10px #ff4b4b' : 'none', transition: 'all 0.3s' }}></div>
                                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: signals[lane] === 'yellow' ? '#ffaa00' : '#222', boxShadow: signals[lane] === 'yellow' ? '0 0 10px #ffaa00' : 'none', transition: 'all 0.3s' }}></div>
                                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: signals[lane] === 'green' ? '#00ff88' : '#222', boxShadow: signals[lane] === 'green' ? '0 0 10px #00ff88' : 'none', transition: 'all 0.3s' }}></div>
                                </div>

                                {/* Countdown overlay on video */}
                                {signals[lane] !== 'red' && (
                                    <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.7)', padding: '4px 12px', borderRadius: '20px', color: signals[lane] === 'green' ? '#00ff88' : '#ffaa00', fontWeight: 'bold', fontSize: '1rem', zIndex: 10 }}>
                                        {countdown[lane]}s
                                    </div>
                                )}

                                <img
                                    src={`http://localhost:8000/video_feed/${lane}`}
                                    alt={`Lane ${lane} Neural Feed`}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'block';
                                    }}
                                />
                                <div style={{ display: 'none', width: '100%', height: '100%', background: 'linear-gradient(45deg, #0a0e17 25%, #0f1624 25%, #0f1624 50%, #0a0e17 50%, #0a0e17 75%, #0f1624 75%, #0f1624 100%)', backgroundSize: '20px 20px', opacity: 0.3 }}></div>
                            </div>
                        ))}
                    </div>
                </div>
            

            </div>

            {/* RL Agent Stats Panel */}
            <div className="glass-panel" style={{ padding: '25px', marginTop: '20px' }}>
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Activity size={20} color="#ff00cc" /> RL Agent Performance
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                    {[
                        { label: 'Total Reward', value: rlStats.total_reward },
                        { label: 'Episodes', value: rlStats.episode_count },
                        { label: 'Avg Reward/Episode', value: rlStats.avg_reward_per_episode },
                        { label: 'Q-States Learned', value: rlStats.q_states_learned },
                    ].map(({ label, value }) => (
                        <div key={label} style={{ background: 'rgba(255,0,204,0.05)', border: '1px solid #ff00cc44', borderRadius: '8px', padding: '15px', textAlign: 'center' }}>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '8px' }}>{label}</p>
                            <h3 style={{ color: '#ff00cc', margin: 0 }}>{value}</h3>
                        </div>
                    ))}
                </div>
            </div>

            {/* YOLOv8 Model Metrics Panel */}
            <div className="glass-panel" style={{ padding: '25px', marginTop: '20px' }}>
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <BarChart3 size={20} color="#00f0ff" /> YOLOv8 Model Performance
                </h3>

                {/* Accuracy Summary Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '25px' }}>
                    {[
                        { label: 'Accuracy', value: `${modelMetrics.accuracy}%`, color: '#00ff88' },
                        { label: 'mAP Score', value: `${modelMetrics.map}%`, color: '#00f0ff' },
                        { label: 'Frames Processed', value: modelMetrics.total_frames, color: '#ffaa00' },
                    ].map(({ label, value, color }) => (
                        <div key={label} style={{ background: `rgba(0,0,0,0.3)`, border: `1px solid ${color}44`, borderRadius: '8px', padding: '15px', textAlign: 'center' }}>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '8px' }}>{label}</p>
                            <h3 style={{ color, margin: 0 }}>{value}</h3>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>

                    {/* Per-Class Metrics Table */}
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Per-Class Metrics</p>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    {['Class', 'TP', 'FP', 'FN', 'TN', 'Precision', 'Recall', 'F1'].map(h => (
                                        <th key={h} style={{ padding: '8px 6px', color: 'var(--text-secondary)', textAlign: 'center', fontWeight: 'normal' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {modelMetrics.per_class.map((row, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        <td style={{ padding: '8px 6px', color: '#00f0ff', textAlign: 'center' }}>{row.class}</td>
                                        <td style={{ padding: '8px 6px', color: '#00ff88', textAlign: 'center' }}>{row.tp}</td>
                                        <td style={{ padding: '8px 6px', color: '#ff4b4b', textAlign: 'center' }}>{row.fp}</td>
                                        <td style={{ padding: '8px 6px', color: '#ffaa00', textAlign: 'center' }}>{row.fn}</td>
                                        <td style={{ padding: '8px 6px', color: '#aaaaaa', textAlign: 'center' }}>{row.tn}</td>
                                        <td style={{ padding: '8px 6px', color: 'white', textAlign: 'center' }}>{row.precision}%</td>
                                        <td style={{ padding: '8px 6px', color: 'white', textAlign: 'center' }}>{row.recall}%</td>
                                        <td style={{ padding: '8px 6px', color: '#ff00cc', textAlign: 'center' }}>{row.f1}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Confusion Matrix — rendered by matplotlib on backend */}
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Confusion Matrix</p>
                        <div>
                            <img
                                src="http://localhost:8000/confusion_matrix_image"
                                alt="Confusion Matrix"
                                style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                            />
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', marginTop: '8px' }}>
                                Rows = Actual &nbsp;|&nbsp; Cols = Predicted &nbsp;|&nbsp;
                                <span style={{ color: '#00ff88' }}>■</span> TP &nbsp;
                                <span style={{ color: '#ff4b4b' }}>■</span> FP / FN
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
        @keyframes scanline { 0% { top: 0%; } 100% { top: 100%; } }
      `}</style>
        </div>
    );
};

export default Dashboard;

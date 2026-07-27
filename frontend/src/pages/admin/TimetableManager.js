import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BulkTimetableEntry = ({ instructors, onSave }) => {
    const years = ['1st', '2nd', '3rd', '4th'];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const initialData = () => {
        const data = {};
        years.forEach(year => {
            data[year] = {};
            days.forEach(day => {
                data[year][day] = Array.from({ length: 8 }, () => ({ subject: '', instructor: '' }));
            });
        });
        return data;
    };

    const [data, setData] = useState(initialData());
    const [activeYear, setActiveYear] = useState('1st');
    const [activeDay, setActiveDay] = useState('Monday');
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const fetchExisting = async () => {
            try {
                const res = await axios.get('/api/admin/timetable');
                const dbEntries = res.data;
                setData(prev => {
                    const newData = { ...prev };
                    years.forEach(y => {
                        newData[y] = { ...prev[y] };
                        days.forEach(d => {
                            newData[y][d] = prev[y][d].map(p => ({ ...p }));
                        });
                    });
                    
                    dbEntries.forEach(entry => {
                        if (newData[entry.year] && newData[entry.year][entry.day] && entry.period >= 1 && entry.period <= 8) {
                            newData[entry.year][entry.day][entry.period - 1] = {
                                subject: entry.subject || '',
                                instructor: entry.instructor?._id || entry.instructor || ''
                            };
                        }
                    });
                    return newData;
                });
            } catch (err) {
                console.error('Error fetching existing timetable', err);
            }
        };
        fetchExisting();
    }, []);

    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3000);
    };

    const countFilled = (year, day) => {
        return data[year][day].filter(p => p.subject.trim() !== '' && p.instructor !== '').length;
    };

    const handleChange = (periodIndex, field, value) => {
        setData(prev => {
            const newData = { ...prev };
            newData[activeYear] = { ...prev[activeYear] };
            newData[activeYear][activeDay] = [...prev[activeYear][activeDay]];
            newData[activeYear][activeDay][periodIndex] = {
                ...newData[activeYear][activeDay][periodIndex],
                [field]: value
            };
            return newData;
        });
    };

    const handleClearDay = () => {
        setData(prev => {
            const newData = { ...prev };
            newData[activeYear] = { ...prev[activeYear] };
            newData[activeYear][activeDay] = Array.from({ length: 8 }, () => ({ subject: '', instructor: '' }));
            return newData;
        });
    };

    const handleSaveAll = async () => {
        const entriesToSave = [];
        years.forEach(year => {
            days.forEach(day => {
                data[year][day].forEach((periodData, i) => {
                    if (periodData.subject.trim() !== '' && periodData.instructor !== '') {
                        entriesToSave.push({
                            year,
                            day,
                            period: i + 1,
                            subject: periodData.subject.trim(),
                            instructor: periodData.instructor
                        });
                    }
                });
            });
        });

        try {
            const res = await axios.post('/api/admin/timetable/bulk', { entries: entriesToSave });
            showToast('success', `Saved ${res.data.saved} entries successfully!`);
            if (onSave) onSave(entriesToSave);
        } catch (err) {
            showToast('error', err.response?.data?.message || 'Error saving entries');
        }
    };

    return (
        <div className="bulk-timetable-container">
            {toast && (
                <div className={`toast-container toast-${toast.type}`}>
                    {toast.message}
                </div>
            )}

            {/* YEAR FILTER */}
            <div className="year-tabs">
                {years.map(year => (
                    <button
                        key={year}
                        className={`year-tab ${activeYear === year ? 'active' : ''}`}
                        onClick={() => setActiveYear(year)}
                    >
                        {year} Year
                    </button>
                ))}
            </div>

            {/* DAY TABS */}
            <div className="day-tabs">
                {days.map(day => (
                    <button
                        key={day}
                        className={`day-tab ${activeDay === day ? 'active' : ''}`}
                        onClick={() => setActiveDay(day)}
                    >
                        {day}
                        <span className="badge">{countFilled(activeYear, day)}/8</span>
                    </button>
                ))}
            </div>

            {/* PERIOD GRID */}
            <div className="period-grid">
                <div className="grid-header">
                    <div>PERIOD</div>
                    <div>SUBJECT</div>
                    <div>INSTRUCTOR</div>
                </div>
                {data[activeYear][activeDay].map((periodData, i) => (
                    <div key={i} className="period-row">
                        <div className="period-circle">{i + 1}</div>
                        <input
                            type="text"
                            placeholder='e.g. "UI&UX"'
                            className="input-field"
                            value={periodData.subject}
                            onChange={(e) => handleChange(i, 'subject', e.target.value)}
                        />
                        <select
                            className="select-field"
                            value={periodData.instructor}
                            onChange={(e) => handleChange(i, 'instructor', e.target.value)}
                        >
                            <option value="">Select Instructor</option>
                            {instructors.map(inst => (
                                <option key={inst._id || inst.id} value={inst._id || inst.id}>
                                    {inst.name}
                                </option>
                            ))}
                        </select>
                    </div>
                ))}
            </div>

            {/* WEEK OVERVIEW */}
            <h3 style={{ marginBottom: '15px', color: '#fff', fontSize: '16px', marginTop: '40px' }}>Week Overview - {activeYear} Year</h3>
            <div className="week-overview">
                {days.map(day => {
                    const filled = countFilled(activeYear, day);
                    const percentage = (filled / 8) * 100;
                    return (
                        <div 
                            key={day} 
                            className={`day-card ${activeDay === day ? 'active-card' : ''}`}
                            onClick={() => setActiveDay(day)}
                        >
                            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{day}</div>
                            <div style={{ fontSize: '12px', color: '#9ca3af' }}>{filled} / 8 Filled</div>
                            <div className="progress-bar-container">
                                <div className="progress-bar" style={{ width: `${percentage}%` }}></div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ACTION BUTTONS */}
            <div className="action-buttons">
                <button className="btn-clear" onClick={handleClearDay}>Clear Day</button>
                <button className="btn-save" onClick={handleSaveAll}>Save All Entries</button>
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
                .bulk-timetable-container { background: #0f1117; color: #fff; padding: 20px; border-radius: 8px; font-family: 'Inter', sans-serif; }
                .year-tabs { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
                .year-tab { background: #1e293b; border: none; color: #cbd5e1; padding: 10px 20px; cursor: pointer; border-radius: 6px; font-weight: 600; font-size: 14px; transition: 0.2s; }
                .year-tab:hover { background: #334155; }
                .year-tab.active { background: #6d28d9; color: #fff; }
                
                .day-tabs { display: flex; gap: 10px; margin-bottom: 20px; overflow-x: auto; padding-bottom: 5px; }
                .day-tab { background: #1f2937; border: none; color: #9ca3af; padding: 8px 16px; cursor: pointer; border-radius: 6px; display: flex; align-items: center; gap: 8px; white-space: nowrap; font-weight: 500; transition: 0.2s; }
                .day-tab:hover { background: #374151; }
                .day-tab.active { background: #2563eb; color: #fff; }
                
                .badge { background: rgba(255,255,255,0.2); border-radius: 12px; padding: 2px 8px; font-size: 12px; font-weight: 600; }
                
                .period-grid { display: grid; gap: 10px; margin-bottom: 30px; }
                .grid-header { display: grid; grid-template-columns: 80px 1fr 1fr; gap: 15px; padding: 0 10px; color: #9ca3af; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
                
                .period-row { display: grid; grid-template-columns: 80px 1fr 1fr; gap: 15px; background: #1f2937; padding: 12px; border-radius: 8px; align-items: center; transition: background 0.2s, transform 0.1s; border: 1px solid #374151; }
                .period-row:hover { background: #374151; transform: translateY(-1px); }
                
                .period-circle { width: 36px; height: 36px; background: #6d28d9; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.2); }
                
                .input-field, .select-field { width: 100%; background: #111827; border: 1px solid #374151; color: white; padding: 10px 14px; border-radius: 6px; font-size: 14px; transition: outline 0.1s, border-color 0.1s; box-sizing: border-box; }
                .input-field:focus, .select-field:focus { outline: 2px solid #6d28d9; border-color: transparent; }
                
                .week-overview { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; margin-bottom: 30px; }
                .day-card { background: #1f2937; padding: 15px; border-radius: 8px; cursor: pointer; border: 2px solid transparent; transition: border 0.2s, transform 0.1s; }
                .day-card:hover { transform: translateY(-2px); border-color: #374151; }
                .day-card.active-card { border-color: #2563eb; background: #1e293b; }
                
                .progress-bar-container { background: #374151; height: 6px; border-radius: 3px; margin-top: 10px; overflow: hidden; }
                .progress-bar { background: #2563eb; height: 100%; transition: width 0.4s ease; }
                
                .action-buttons { display: flex; gap: 15px; justify-content: flex-end; }
                .btn-clear { background: transparent; border: 1px solid #ef4444; color: #ef4444; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: bold; transition: 0.2s; }
                .btn-clear:hover { background: rgba(239, 68, 68, 0.1); }
                
                .btn-save { background: #6d28d9; border: none; color: white; padding: 12px 28px; border-radius: 6px; cursor: pointer; font-weight: bold; transition: 0.2s; box-shadow: 0 4px 10px rgba(109, 40, 217, 0.4); }
                .btn-save:hover { background: #5b21b6; }
                
                .toast-container { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); padding: 14px 28px; border-radius: 8px; font-weight: bold; color: white; box-shadow: 0 10px 25px rgba(0,0,0,0.5); z-index: 9999; animation: slideUp 0.3s ease-out; display: flex; align-items: center; gap: 10px; }
                .toast-success { background: #10b981; border-left: 4px solid #059669; }
                .toast-error { background: #ef4444; border-left: 4px solid #b91c1c; }
                
                @keyframes slideUp { from { transform: translate(-50%, 20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
                
                @media(max-width: 768px) {
                    .period-row { grid-template-columns: 1fr; gap: 10px; padding: 15px; }
                    .grid-header { display: none; }
                    .period-circle { margin-bottom: 5px; width: 32px; height: 32px; }
                }
            `}} />
        </div>
    );
};

const TimetableManager = () => {
    const [instructors, setInstructors] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchInstructors();
    }, []);

    const fetchInstructors = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/admin/instructors');
            setInstructors(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="page-header" style={{ marginBottom: '20px' }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Bulk Timetable Entry</h2>
                    <p style={{ color: '#9ca3af' }}>Manage weekly schedules efficiently</p>
                </div>
            </div>

            <div className="page-body fade-in">
                {loading ? <div className="spinner" /> : (
                    <BulkTimetableEntry instructors={instructors} />
                )}
            </div>
        </>
    );
};

export default TimetableManager;

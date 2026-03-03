import React, { useState, useEffect } from 'react';
import { Activity, Play, Square, Plus, Edit2, Trash2, LogOut } from 'lucide-react';
import { api } from '../api';
import { authClient } from '../auth';
import navSound from '../assets/audio/nomagician-ui-button-sound-cancel-back-exit-continue-467877.mp3';

const Dashboard = ({ user, session }) => {
    const [activities, setActivities] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [newActivityName, setNewActivityName] = useState('');
    const [elapsed, setElapsed] = useState(0);

    const playSound = () => {
        const audio = new Audio(navSound);
        audio.volume = 0.5;
        audio.play().catch(() => { });
    };

    const handleLogout = async () => {
        playSound();
        try {
            await authClient.signOut();
            window.location.href = '/';
        } catch (e) {
            console.error("Logout failed:", e);
        }
    };

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    useEffect(() => {
        let interval;
        if (activeSession) {
            interval = setInterval(() => {
                const now = Date.now();
                const start = new Date(activeSession.startTime).getTime();
                setElapsed(Math.floor((now - start) / 1000));
            }, 1000);
        } else {
            setElapsed(0);
        }
        return () => clearInterval(interval);
    }, [activeSession]);

    // Handle midnight reset for long-running sessions
    useEffect(() => {
        const midnightCheck = setInterval(() => {
            const now = new Date();
            if (now.getHours() === 0 && now.getMinutes() === 0) {
                loadData();
            }
        }, 60000); // Check every minute
        return () => clearInterval(midnightCheck);
    }, []);

    const loadData = async () => {
        const token = session?.token || (typeof session === 'string' ? session : null);
        if (!token) return;

        try {
            const [acts, activeSess] = await Promise.all([
                api.getActivities(token),
                api.getActiveSession(token)
            ]);

            // Critical safeguard: check for error response
            if (acts && !acts.error) {
                setActivities(Array.isArray(acts) ? acts : []);
            } else {
                setActivities([]);
                if (acts?.error) console.error("Disciplines Error:", acts.error);
            }

            if (activeSess && !activeSess.error) {
                setActiveSession(activeSess);
            } else {
                setActiveSession(null);
            }
        } catch (e) {
            console.error('Failed to load dashboard data:', e);
            setActivities([]);
        }
    };

    const handleCreateActivity = async (e) => {
        e.preventDefault();
        const token = session?.token || (typeof session === 'string' ? session : null);
        if (!token || !newActivityName.trim()) return;
        playSound();
        try {
            const created = await api.createActivity(token, newActivityName);
            setActivities([created, ...activities]);
            setNewActivityName('');
        } catch (e) {
            console.error(e);
        }
    };

    const handleRename = async (id, currentName) => {
        const newName = prompt('Declare new discipline name:', currentName);
        const token = session?.token || (typeof session === 'string' ? session : null);
        if (!token || !newName || newName === currentName) return;
        playSound();
        try {
            const updated = await api.renameActivity(token, id, newName);
            setActivities(activities.map(a => a.id === id ? updated : a));
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id) => {
        const token = session?.token || (typeof session === 'string' ? session : null);
        if (!token || !window.confirm('Abandon this discipline? The temporal record will be shattered.')) return;
        playSound();
        try {
            await api.deleteActivity(token, id);
            setActivities(activities.filter(a => a.id !== id));
            if (activeSession?.activityId === id) {
                setActiveSession(null);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleToggleSession = async (activityId) => {
        const token = session?.token || (typeof session === 'string' ? session : null);
        if (!token) return;

        playSound();
        try {
            if (activeSession) {
                const wantsToStop = activeSession.activityId === activityId;
                setActiveSession(null);
                await api.stopSession(token);
                if (!wantsToStop) {
                    const newSess = await api.startSession(token, activityId);
                    setActiveSession(newSess);
                }
            } else {
                const newSess = await api.startSession(token, activityId);
                setActiveSession(newSess);
            }
            await loadData();
        } catch (e) {
            console.error('Failed to toggle session', e);
            await loadData();
        }
    };

    const formatTime = (totalSeconds) => {
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getActiveSplit = (startTime) => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const sessionStart = new Date(startTime).getTime();

        // Start of week (Monday)
        const dayOfWeek = now.getDay() || 7;
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek + 1);
        const startOfWeekTime = startOfWeek.getTime();

        return {
            today: Math.floor((now.getTime() - Math.max(sessionStart, startOfToday)) / 1000),
            week: Math.floor((now.getTime() - Math.max(sessionStart, startOfWeekTime)) / 1000),
            all: elapsed
        };
    };

    const getTodaySeconds = () => {
        let total = 0;
        activities.forEach(a => {
            total += (a.stats?.today || 0);
        });
        if (activeSession) {
            total += getActiveSplit(activeSession.startTime).today;
        }
        return total;
    };



    if (!user) return null;

    return (
        <div className="flex-1 w-full bg-[#050505] souls-bg relative overflow-y-auto min-h-screen">
            <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-10 relative z-10">
                {/* Header Profile */}
                <div className="bg-[#050505]/95 p-4 sm:p-8 md:p-10 border border-[#cbaa64]/20 flex items-center justify-between gap-4 relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-md">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#cbaa64]/60 pointer-events-none" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#cbaa64]/60 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[#cbaa64]/60 pointer-events-none" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#cbaa64]/60 pointer-events-none" />

                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-48 bg-[#cbaa64]/5 blur-[80px] pointer-events-none" />

                    <div className="text-left space-y-1 relative z-10 flex-1 min-w-0">
                        <h1 className="text-lg sm:text-2xl md:text-3xl font-souls-title tracking-widest text-[#fdf5d3] drop-shadow-[0_2px_10px_rgba(203,170,100,0.4)] uppercase truncate">
                            {user?.name || 'OATH SEEKER'}
                        </h1>
                        <div className="flex items-center gap-2 text-[#cbaa64]/90 font-souls tracking-widest uppercase text-[9px] sm:text-[11px]">
                            <div className="w-1 h-1 rounded-full bg-[#cbaa64] shadow-[0_0_8px_#cbaa64]" />
                            <span>TODAY: <span className="font-mono text-[#fdf5d3] font-bold sm:text-base tracking-normal ml-0.5">{formatTime(getTodaySeconds())}</span></span>
                        </div>
                    </div>

                    <div className="relative z-10 shrink-0">
                        <button
                            onClick={handleLogout}
                            className="p-2 sm:p-3 bg-[#050505] border border-[#cbaa64]/30 hover:border-[#cbaa64]/80 hover:bg-[#cbaa64]/10 text-[#a89f91] hover:text-[#fdf5d3] transition-all active:scale-95 group"
                            title="Abandon Oath (Logout)"
                        >
                            <LogOut size={18} className="md:hidden" />
                            <LogOut size={22} className="hidden md:block" />
                        </button>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Activities List Area */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between pb-2 border-b border-[#cbaa64]/20">
                            <h2 className="text-2xl font-souls-title tracking-widest text-[#fdf5d3] flex items-center gap-3">
                                <div className="w-1.5 h-8 bg-gradient-to-b from-[#cbaa64] to-transparent" />
                                YOUR DISCIPLINES
                            </h2>
                            <div className="text-[#a89f91] font-souls text-sm tracking-widest">
                                {activities.length} DECLARED
                            </div>
                        </div>

                        <form onSubmit={handleCreateActivity} className="flex gap-2 sm:gap-3 relative">
                            <div className="relative flex-1 group">
                                <Activity className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-[#a89f91] group-focus-within:text-[#fdf5d3] transition-colors" size={16} />
                                <input
                                    type="text"
                                    placeholder="Discipline..."
                                    value={newActivityName}
                                    onChange={(e) => setNewActivityName(e.target.value)}
                                    required
                                    className="w-full bg-[#050505] border border-[#cbaa64]/20 py-3 sm:py-4 pl-10 sm:pl-12 pr-4 text-[#e8dac1] focus:outline-none focus:border-[#cbaa64]/70 focus:bg-[#cbaa64]/5 transition-all shadow-inner font-sans tracking-wide placeholder:font-souls placeholder:text-[#a89f91]/30 placeholder:tracking-widest placeholder:uppercase text-xs sm:text-base"
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-5 sm:px-8 border border-[#cbaa64]/30 bg-[#050505]/50 hover:bg-[#cbaa64]/10 hover:border-[#cbaa64]/80 text-[#cbaa64] font-souls text-sm sm:text-lg tracking-[0.15em] sm:tracking-[0.2em] transition-all shadow-inner active:scale-[0.98] uppercase flex items-center justify-center gap-1 sm:gap-2"
                            >
                                <Plus size={16} />
                                <span className="hidden xs:inline">ADD</span>
                            </button>
                        </form>

                        <div className="space-y-4 mt-8 max-h-[calc(100vh-420px)] overflow-y-auto pr-3 souls-scrollbar">
                            {activities.length === 0 ? (
                                <div className="text-center p-12 bg-[#050505]/80 border border-[#cbaa64]/10 border-dashed backdrop-blur-md relative overflow-hidden">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#cbaa64]/5 blur-[40px] pointer-events-none" />
                                    <Activity size={48} className="mx-auto text-[#a89f91]/40 mb-4 relative z-10" />
                                    <p className="text-[#e8dac1] font-souls tracking-widest text-lg relative z-10">No disciplines declared yet.</p>
                                    <p className="text-[#a89f91] text-sm mt-2 font-souls tracking-widest uppercase opacity-70 relative z-10">Swear your oath and begin the pursuit of mastery.</p>
                                </div>
                            ) : (
                                activities.map(activity => {
                                    const isActive = activeSession?.activityId === activity.id;
                                    const currentStats = activity.stats || { today: 0, week: 0, allTime: 0 };
                                    const activeSplit = isActive ? getActiveSplit(activeSession.startTime) : null;
                                    const displayStats = isActive ? {
                                        today: currentStats.today + activeSplit.today,
                                        week: currentStats.week + activeSplit.week,
                                        allTime: currentStats.allTime + activeSplit.all
                                    } : currentStats;

                                    return (
                                        <div
                                            key={activity.id}
                                            className={`group relative p-5 transition-all duration-500 overflow-hidden border-2
                                                ${isActive
                                                    ? 'bg-[#0a0a0a] border-[#cbaa64]/40 shadow-xl ring-1 ring-[#cbaa64]/10'
                                                    : 'bg-[#050505]/95 border-[#cbaa64]/10 hover:border-[#cbaa64]/30 shadow-lg'}`}
                                        >
                                            {isActive && (
                                                <>
                                                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#cbaa64]/60" />
                                                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#cbaa64]/60" />
                                                    <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#cbaa64]/20 to-transparent" />
                                                    <div className="absolute inset-0 bg-gradient-to-br from-[#cbaa64]/5 to-transparent pointer-events-none" />
                                                </>
                                            )}

                                            <div className="flex items-center justify-between relative z-10">
                                                <div className="flex items-center gap-5 flex-1 min-w-0">
                                                    <button
                                                        onClick={() => handleToggleSession(activity.id)}
                                                        className={`relative p-2 sm:p-3.5 flex items-center justify-center transition-all duration-300 active:scale-90
                                                            ${isActive
                                                                ? 'bg-[#cbaa64]/10 border border-[#cbaa64]/40 text-[#fdf5d3] hover:bg-[#cbaa64]/20 hover:border-[#cbaa64]/60 shadow-[0_0_15px_rgba(203,170,100,0.1)]'
                                                                : 'bg-[#cbaa64]/5 border border-[#cbaa64]/20 text-[#cbaa64] hover:bg-[#cbaa64]/15 hover:border-[#cbaa64]/60 hover:text-[#fdf5d3]'
                                                            }`}
                                                    >
                                                        {isActive ? <Square fill="currentColor" size={10} className="sm:size-[14px]" /> : <Play fill="currentColor" size={10} className="sm:size-[14px] ml-0.5" />}
                                                    </button>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                                                            <div className="min-w-0">
                                                                <h3 className={`text-sm sm:text-xl font-sans tracking-wide truncate transition-colors ${isActive ? 'text-[#fdf5d3] font-semibold' : 'text-[#e8dac1]'}`}>
                                                                    {activity.name}
                                                                </h3>
                                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 opacity-90">
                                                                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                                                                        <div className={`w-1 h-1 rounded-full ${isActive ? 'bg-[#cbaa64] shadow-[0_0_5px_#cbaa64]' : 'bg-[#cbaa64]/30'}`} />
                                                                        <span className="text-[9px] font-souls tracking-widest text-[#a89f91] uppercase">Today</span>
                                                                        <span className="font-mono text-[10px] sm:text-[11px] text-[#fdf5d3] opacity-80">{formatTime(displayStats.today)}</span>
                                                                    </div>
                                                                    <div className="hidden sm:block w-[1px] h-2 bg-[#cbaa64]/20" />
                                                                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                                                                        <span className="text-[9px] font-souls tracking-widest text-[#a89f91] uppercase">Week</span>
                                                                        <span className="font-mono text-[10px] sm:text-[11px] text-[#fdf5d3] opacity-80">{formatTime(displayStats.week)}</span>
                                                                    </div>
                                                                    <div className="hidden sm:block w-[1px] h-2 bg-[#cbaa64]/20" />
                                                                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                                                                        <span className="text-[9px] font-souls tracking-widest text-[#a89f91] uppercase">All</span>
                                                                        <span className="font-mono text-[10px] sm:text-[11px] text-[#fdf5d3] opacity-80">{formatTime(displayStats.allTime)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {isActive && (
                                                                <div className="flex flex-col items-end shrink-0 ml-auto sm:mr-2">
                                                                    <span className="text-xl sm:text-3xl font-mono font-bold text-[#cbaa64]/90 tracking-tighter tabular-nums drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                                                                        {formatTime(elapsed)}
                                                                    </span>
                                                                    <div className="text-[8px] sm:text-[9px] font-souls tracking-[0.15em] sm:tracking-[0.2em] text-[#cbaa64]/40 uppercase mt-0.5">Focusing</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className={`flex items-center gap-1 ml-4 transition-all duration-300 ${isActive ? 'opacity-30 hover:opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                    <button onClick={() => handleRename(activity.id, activity.name)} className="p-2 text-[#a89f91] hover:text-[#fdf5d3] transition-all"><Edit2 size={13} /></button>
                                                    <button onClick={() => handleDelete(activity.id)} className="p-2 text-red-900/60 hover:text-red-400 transition-all"><Trash2 size={13} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

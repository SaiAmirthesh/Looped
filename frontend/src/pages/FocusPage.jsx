import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Navigation from '../components/Navigation';
import ElectricBorder from '../components/ElectricBorder';
import { Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react';
import { getData, setData, generateKey } from '../lib/storage';

const FocusPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [minutes, setMinutes] = useState(25);
    const [seconds, setSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [sessionType, setSessionType] = useState('focus'); // focus, short-break, long-break
    const [sessionsCompleted, setSessionsCompleted] = useState(0);

    // Load user and session data from localStorage
    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
                return;
            }

            const userId = session.user.id;
            setUser(session.user);

            // Load sessions for today
            const today = new Date().toISOString().split('T')[0];
            const sessionKey = generateKey(userId, `focusSessions:${today}`);
            const todaySessions = getData(sessionKey, []);
            setSessionsCompleted(todaySessions.filter(s => s.type === 'focus').length);
        };

        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                navigate('/login');
            } else {
                setUser(session.user);
            }
        });

        return () => subscription?.unsubscribe();
    }, [navigate]);

    useEffect(() => {
        let interval = null;
        if (isRunning) {
            interval = setInterval(() => {
                if (seconds === 0) {
                    if (minutes === 0) {
                        // Timer completed
                        setIsRunning(false);
                        if (sessionType === 'focus') {
                            setSessionsCompleted(prev => prev + 1);
                            
                            // Save focus session and award XP
                            if (user) {
                                const today = new Date().toISOString().split('T')[0];
                                const sessionKey = generateKey(user.id, `focusSessions:${today}`);
                                const todaySessions = getData(sessionKey, []);
                                
                                const newSession = {
                                    id: crypto.randomUUID(),
                                    type: 'focus',
                                    duration: 25,
                                    completedAt: new Date().toISOString()
                                };
                                
                                todaySessions.push(newSession);
                                setData(sessionKey, todaySessions);
                                
                                // Award XP: 25 minutes = 15 XP
                                addXP(15);
                            }
                        } else {
                            // Save break session
                            if (user) {
                                const today = new Date().toISOString().split('T')[0];
                                const sessionKey = generateKey(user.id, `focusSessions:${today}`);
                                const todaySessions = getData(sessionKey, []);
                                
                                const breakDuration = sessionType === 'short-break' ? 5 : 15;
                                const newSession = {
                                    id: crypto.randomUUID(),
                                    type: sessionType,
                                    duration: breakDuration,
                                    completedAt: new Date().toISOString()
                                };
                                
                                todaySessions.push(newSession);
                                setData(sessionKey, todaySessions);
                            }
                        }
                        // Play notification sound (optional)
                        playNotification();
                    } else {
                        setMinutes(minutes - 1);
                        setSeconds(59);
                    }
                } else {
                    setSeconds(seconds - 1);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning, minutes, seconds, sessionType, user]);

    const playNotification = () => {
        // Simple notification - could be enhanced with actual sound
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Looped', {
                body: `${sessionType === 'focus' ? 'Focus session' : 'Break'} completed!`,
            });
        }
    };

    const addXP = (amount) => {
        if (!user) return;
        
        const xpKey = generateKey(user.id, 'xp');
        const currentXP = getData(xpKey, { totalXP: 0, level: 1, currentXP: 0, nextLevelXP: 100 });
        
        const newCurrentXP = currentXP.currentXP + amount;
        const xpForLevelUp = currentXP.nextLevelXP;
        
        let newLevel = currentXP.level;
        let finalCurrentXP = newCurrentXP;
        
        if (newCurrentXP >= xpForLevelUp) {
            newLevel += 1;
            finalCurrentXP = newCurrentXP - xpForLevelUp;
        }
        
        const updatedXP = {
            totalXP: currentXP.totalXP + amount,
            level: newLevel,
            currentXP: finalCurrentXP,
            nextLevelXP: xpForLevelUp
        };
        
        setData(xpKey, updatedXP);
    };

    const handleStart = () => setIsRunning(true);
    const handlePause = () => setIsRunning(false);

    const handleReset = () => {
        setIsRunning(false);
        if (sessionType === 'focus') {
            setMinutes(25);
        } else if (sessionType === 'short-break') {
            setMinutes(5);
        } else {
            setMinutes(15);
        }
        setSeconds(0);
    };

    const switchSession = (type) => {
        setSessionType(type);
        setIsRunning(false);
        if (type === 'focus') {
            setMinutes(25);
        } else if (type === 'short-break') {
            setMinutes(5);
        } else {
            setMinutes(15);
        }
        setSeconds(0);
    };

    const progress = sessionType === 'focus'
        ? ((25 * 60 - (minutes * 60 + seconds)) / (25 * 60)) * 100
        : sessionType === 'short-break'
            ? ((5 * 60 - (minutes * 60 + seconds)) / (5 * 60)) * 100
            : ((15 * 60 - (minutes * 60 + seconds)) / (15 * 60)) * 100;

    return (
        <div className="flex min-h-screen bg-background">
            <Navigation />

            <main className="flex-1 ml-10 p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2 text-center">Focus Session</h1>
                    <p className="text-muted-foreground text-center">
                        Use the Pomodoro technique to stay focused and productive
                    </p>
                </div>

                <div className="max-w-2xl mx-auto">
                    {/* Session Type Selector */}
                    <div className="flex gap-3 mb-8 justify-center">
                        <button
                            onClick={() => switchSession('focus')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${sessionType === 'focus'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-card border border-border hover:bg-muted'
                                }`}
                        >
                            <Brain className="w-4 h-4" />
                            Focus (25:00)
                        </button>
                        <button
                            onClick={() => switchSession('short-break')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${sessionType === 'short-break'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-card border border-border hover:bg-muted'
                                }`}
                        >
                            <Coffee className="w-4 h-4" />
                            Short Break (5:00)
                        </button>
                        <button
                            onClick={() => switchSession('long-break')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${sessionType === 'long-break'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-card border border-border hover:bg-muted'
                                }`}
                        >
                            <Coffee className="w-4 h-4" />
                            Long Break (15:00)
                        </button>
                    </div>

                    {/* Timer Display */}
                    {isRunning ? (
                        <ElectricBorder
                            color={sessionType === 'focus' ? 'oklch(0.5054 0.1905 27.5181)' : 'oklch(0.4732 0.1247 46.2007)'}
                            speed={1.2}
                            chaos={0.15}
                            borderRadius={24}
                            thickness={3}
                        >
                            <div className="bg-card border border-border rounded-2xl p-12 mb-8 text-center shadow-lg">
                                {/* Progress Ring */}
                                <div className="relative w-64 h-64 mx-auto mb-8">
                                    <svg className="transform -rotate-90 w-64 h-64">
                                        <circle
                                            cx="128"
                                            cy="128"
                                            r="120"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="none"
                                            className="text-muted"
                                        />
                                        <circle
                                            cx="128"
                                            cy="128"
                                            r="120"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="none"
                                            strokeDasharray={`${2 * Math.PI * 120}`}
                                            strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
                                            className="text-primary transition-all duration-1000"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-6xl font-bold text-foreground font-mono">
                                            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                                        </div>
                                    </div>
                                </div>

                                {/* Control Buttons */}
                                <div className="flex gap-4 justify-center">
                                    <button
                                        onClick={handlePause}
                                        className="flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold text-lg hover:opacity-90 transition"
                                    >
                                        <Pause className="w-5 h-5" />
                                        Pause
                                    </button>
                                    <button
                                        onClick={handleReset}
                                        className="flex items-center gap-2 px-8 py-4 border border-border rounded-lg text-accent font-semibold text-lg bg-secondary hover:bg-secondary-foreground hover:text-secondary transition"
                                    >
                                        <RotateCcw className="w-5 h-5" />
                                        Reset
                                    </button>
                                </div>
                            </div>
                        </ElectricBorder>
                    ) : (
                        <div className="bg-card border border-border rounded-2xl p-12 mb-8 text-center shadow-lg">
                            {/* Progress Ring */}
                            <div className="relative w-64 h-64 mx-auto mb-8">
                                <svg className="transform -rotate-90 w-64 h-64">
                                    <circle
                                        cx="128"
                                        cy="128"
                                        r="120"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="none"
                                        className="text-muted"
                                    />
                                    <circle
                                        cx="128"
                                        cy="128"
                                        r="120"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="none"
                                        strokeDasharray={`${2 * Math.PI * 120}`}
                                        strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
                                        className="text-primary transition-all duration-1000"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-6xl font-bold text-foreground font-mono">
                                        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                                    </div>
                                </div>
                            </div>

                            {/* Control Buttons */}
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={handleStart}
                                    className="flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold text-lg hover:opacity-90 transition"
                                >
                                    <Play className="w-5 h-5" />
                                    Start
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="flex items-center gap-2 px-8 py-4 hover:bg-popover hover:text-popover-foreground border border-border rounded-lg text-accent font-semibold text-lg bg-secondary text-secondary-foreground transition"
                                >
                                    <RotateCcw className="w-5 h-5" />
                                    Reset
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Session Stats */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-card border border-border rounded-lg p-6 text-center">
                            <div className="text-muted-foreground text-sm mb-2">Sessions Today</div>
                            <div className="text-4xl font-bold text-foreground">{sessionsCompleted}</div>
                            <div className="text-sm text-muted-foreground mt-1">Focus sessions completed</div>
                        </div>

                        <div className="bg-card border border-border rounded-lg p-6 text-center">
                            <div className="text-muted-foreground text-sm mb-2">Time Focused</div>
                            <div className="text-4xl font-bold text-foreground">{sessionsCompleted * 25}</div>
                            <div className="text-sm text-muted-foreground mt-1">Minutes today</div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default FocusPage;

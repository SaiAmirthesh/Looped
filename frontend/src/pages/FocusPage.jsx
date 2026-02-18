import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Navigation from '../components/Navigation';
import ElectricBorder from '../components/ElectricBorder';
import { Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react';

const FocusPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [minutes, setMinutes] = useState(25);
    const [seconds, setSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [sessionType, setSessionType] = useState('focus');
    const [sessionsCompleted, setSessionsCompleted] = useState(0);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { navigate('/login'); return; }
            setUser(session.user);
        };
        checkUser();
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) navigate('/login');
            else setUser(session.user);
        });
        return () => subscription?.unsubscribe();
    }, [navigate]);

    useEffect(() => {
        let interval = null;
        if (isRunning) {
            interval = setInterval(() => {
                if (seconds === 0) {
                    if (minutes === 0) {
                        setIsRunning(false);
                        if (sessionType === 'focus') setSessionsCompleted(prev => prev + 1);
                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification('Looped', { body: `${sessionType === 'focus' ? 'Focus session' : 'Break'} completed!` });
                        }
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
    }, [isRunning, minutes, seconds, sessionType]);

    const handleStart = () => setIsRunning(true);
    const handlePause = () => setIsRunning(false);

    const handleReset = () => {
        setIsRunning(false);
        setMinutes(sessionType === 'focus' ? 25 : sessionType === 'short-break' ? 5 : 15);
        setSeconds(0);
    };

    const switchSession = (type) => {
        setSessionType(type);
        setIsRunning(false);
        setMinutes(type === 'focus' ? 25 : type === 'short-break' ? 5 : 15);
        setSeconds(0);
    };

    const totalSecs = sessionType === 'focus' ? 25 * 60 : sessionType === 'short-break' ? 5 * 60 : 15 * 60;
    const progress = ((totalSecs - (minutes * 60 + seconds)) / totalSecs) * 100;

    const TimerDisplay = () => (
        <div className="relative w-64 h-64 mx-auto mb-8">
            <svg className="transform -rotate-90 w-64 h-64">
                <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted" />
                <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="8" fill="none"
                    strokeDasharray={`${2 * Math.PI * 120}`}
                    strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
                    className="text-primary transition-all duration-1000" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-6xl font-bold text-foreground font-mono">
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-background">
            <Navigation />
            <main className="flex-1 ml-10 p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2 text-center">Focus Session</h1>
                    <p className="text-muted-foreground text-center">Use the Pomodoro technique to stay focused and productive</p>
                </div>
                <div className="max-w-2xl mx-auto">
                    <div className="flex gap-3 mb-8 justify-center">
                        {[
                            { type: 'focus', label: 'Focus (25:00)', icon: <Brain className="w-4 h-4" /> },
                            { type: 'short-break', label: 'Short Break (5:00)', icon: <Coffee className="w-4 h-4" /> },
                            { type: 'long-break', label: 'Long Break (15:00)', icon: <Coffee className="w-4 h-4" /> },
                        ].map(({ type, label, icon }) => (
                            <button key={type} onClick={() => switchSession(type)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${sessionType === type ? 'bg-primary text-primary-foreground' : 'bg-card border border-border hover:bg-muted'}`}>
                                {icon}{label}
                            </button>
                        ))}
                    </div>

                    {isRunning ? (
                        <ElectricBorder color={sessionType === 'focus' ? 'oklch(0.5054 0.1905 27.5181)' : 'oklch(0.4732 0.1247 46.2007)'} speed={1.2} chaos={0.15} borderRadius={24} thickness={3}>
                            <div className="bg-card border border-border rounded-2xl p-12 mb-8 text-center shadow-lg">
                                <TimerDisplay />
                                <div className="flex gap-4 justify-center">
                                    <button onClick={handlePause} className="flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold text-lg hover:opacity-90 transition">
                                        <Pause className="w-5 h-5" />Pause
                                    </button>
                                    <button onClick={handleReset} className="flex items-center gap-2 px-8 py-4 border border-border rounded-lg text-accent font-semibold text-lg bg-secondary hover:bg-secondary-foreground hover:text-secondary transition">
                                        <RotateCcw className="w-5 h-5" />Reset
                                    </button>
                                </div>
                            </div>
                        </ElectricBorder>
                    ) : (
                        <div className="bg-card border border-border rounded-2xl p-12 mb-8 text-center shadow-lg">
                            <TimerDisplay />
                            <div className="flex gap-4 justify-center">
                                <button onClick={handleStart} className="flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold text-lg hover:opacity-90 transition">
                                    <Play className="w-5 h-5" />Start
                                </button>
                                <button onClick={handleReset} className="flex items-center gap-2 px-8 py-4 hover:bg-popover hover:text-popover-foreground border border-border rounded-lg text-accent font-semibold text-lg bg-secondary text-secondary-foreground transition">
                                    <RotateCcw className="w-5 h-5" />Reset
                                </button>
                            </div>
                        </div>
                    )}

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

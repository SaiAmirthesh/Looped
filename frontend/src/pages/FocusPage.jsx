import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import * as db from '../lib/database';
import Navigation from '../components/Navigation';
import ElectricBorder from '../components/ElectricBorder';
import { Play, Pause, RotateCcw, Coffee, Brain, Clock, Zap } from 'lucide-react';

const FocusPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [minutes, setMinutes] = useState(25);
    const [seconds, setSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [sessionType, setSessionType] = useState('focus');
    const [sessionsCompleted, setSessionsCompleted] = useState(0);
    const [currentSessionId, setCurrentSessionId] = useState(null);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { navigate('/login'); return; }
            setUser(session.user);
            // Fetch sessions completed today only once on mount
            const today = new Date().toISOString().split('T')[0];
            const sessions = await db.getFocusSessions(session.user.id);
            const todaySessions = sessions.filter(s => s.completed_at && s.completed_at.split('T')[0] === today);
            setSessionsCompleted(todaySessions.length);
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
            // Create session on start (once)
            if (!currentSessionId && user) {
                db.createFocusSession(user.id, sessionType === 'focus' ? 25 : sessionType === 'short-break' ? 5 : 15)
                    .then(session => {
                        if (session) setCurrentSessionId(session.id);
                    });
            }
            
            interval = setInterval(async () => {
                if (seconds === 0) {
                    if (minutes === 0) {
                        setIsRunning(false);
                        // Complete the focus session and award XP if it's a focus session
                        if (sessionType === 'focus' && currentSessionId && user) {
                            await db.completeFocusSession(currentSessionId, user.id);
                            setSessionsCompleted(prev => prev + 1);
                        }
                        setCurrentSessionId(null);
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
    }, [isRunning, minutes, seconds, sessionType, currentSessionId, user]);

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
    const r = 110;
    const circumference = 2 * Math.PI * r;

    const sessionTabs = [
        { type: 'focus', label: 'Focus', duration: '25:00', icon: Brain },
        { type: 'short-break', label: 'Short Break', duration: '5:00', icon: Coffee },
        { type: 'long-break', label: 'Long Break', duration: '15:00', icon: Coffee },
    ];

    const TimerDisplay = () => (
        <div className="relative w-60 h-60 mx-auto">
            <svg className="w-60 h-60 -rotate-90" viewBox="0 0 240 240">
                <circle cx="120" cy="120" r={r} stroke="currentColor" strokeWidth="8" fill="none" className="text-muted" />
                <circle
                    cx="120" cy="120" r={r}
                    stroke="currentColor" strokeWidth="8" fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - progress / 100)}
                    className="text-primary transition-all duration-1000"
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-5xl font-bold text-foreground font-mono tracking-tight">
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </div>
                <div className="text-xs text-muted-foreground mt-1 capitalize">{sessionType.replace('-', ' ')}</div>
            </div>
        </div>
    );

    const timerCard = (
        <div className="bg-card border border-border rounded-2xl p-10 text-center shadow-lg">
            <TimerDisplay />
            <div className="flex gap-3 justify-center mt-8">
                {isRunning ? (
                    <button onClick={handlePause} className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition">
                        <Pause className="w-5 h-5" /> Pause
                    </button>
                ) : (
                    <button onClick={handleStart} className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition">
                        <Play className="w-5 h-5" /> Start
                    </button>
                )}
                <button onClick={handleReset} className="flex items-center gap-2 px-6 py-3 border border-border rounded-xl font-semibold hover:bg-muted transition text-foreground">
                    <RotateCcw className="w-5 h-5" /> Reset
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-background">
            <Navigation />
            <main className="flex-1 overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 border-b border-border" style={{ backgroundColor: 'var(--background)' }}>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Focus Session</h1>
                        <p className="text-sm text-muted-foreground">Use the Pomodoro technique to stay focused and productive</p>
                    </div>
                </div>

                <div className="p-8">
                    <div className="max-w-xl mx-auto space-y-6">
                        {/* Session Type Tabs */}
                        <div className="flex gap-1 bg-muted p-1 rounded-xl">
                            {sessionTabs.map(({ type, label, duration, icon: Icon }) => (
                                <button
                                    key={type}
                                    onClick={() => switchSession(type)}
                                    className={`flex-1 flex flex-col items-center py-2.5 px-3 rounded-lg text-sm font-medium transition ${
                                        sessionType === type
                                            ? 'bg-card text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <Icon className="w-4 h-4 mb-1" />
                                    <span>{label}</span>
                                    <span className="text-xs opacity-60">{duration}</span>
                                </button>
                            ))}
                        </div>

                        {/* Timer Card — ElectricBorder when running */}
                        {isRunning ? (
                            <ElectricBorder
                                color={sessionType === 'focus' ? 'oklch(0.5054 0.1905 27.5181)' : 'oklch(0.4732 0.1247 46.2007)'}
                                speed={1.2}
                                chaos={0.15}
                                borderRadius={24}
                                thickness={3}
                            >
                                {timerCard}
                            </ElectricBorder>
                        ) : timerCard}

                        {/* Stats Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-card border border-border rounded-xl p-5 text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Zap className="w-4 h-4 text-primary" />
                                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Sessions Today</span>
                                </div>
                                <div className="text-4xl font-bold text-foreground">{sessionsCompleted}</div>
                                <div className="text-xs text-muted-foreground mt-1">focus sessions completed</div>
                            </div>
                            <div className="bg-card border border-border rounded-xl p-5 text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Clock className="w-4 h-4 text-chart-4" />
                                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Time Focused</span>
                                </div>
                                <div className="text-4xl font-bold text-foreground">{sessionsCompleted * 25}</div>
                                <div className="text-xs text-muted-foreground mt-1">minutes today</div>
                            </div>
                        </div>

                        {/* Tips */}
                        <div className="bg-gradient-to-r from-primary/10 via-transparent to-chart-2/10 border border-primary/20 rounded-xl p-5">
                            <h3 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">Pomodoro Tips</h3>
                            <div className="space-y-2 text-sm text-muted-foreground">
                                <div className="flex items-start gap-2"><span className="text-primary">•</span><span>Work for 25 minutes, then take a 5-minute break</span></div>
                                <div className="flex items-start gap-2"><span className="text-primary">•</span><span>After 4 sessions, take a longer 15-minute break</span></div>
                                <div className="flex items-start gap-2"><span className="text-primary">•</span><span>Each completed focus session earns you XP</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default FocusPage;

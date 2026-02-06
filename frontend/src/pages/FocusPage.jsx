import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react';

const FocusPage = () => {
    const [minutes, setMinutes] = useState(25);
    const [seconds, setSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [sessionType, setSessionType] = useState('focus'); // focus, short-break, long-break
    const [sessionsCompleted, setSessionsCompleted] = useState(0);

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
    }, [isRunning, minutes, seconds, sessionType]);

    const playNotification = () => {
        // Simple notification - could be enhanced with actual sound
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Looped', {
                body: `${sessionType === 'focus' ? 'Focus session' : 'Break'} completed!`,
            });
        }
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
                            {!isRunning ? (
                                <button
                                    onClick={handleStart}
                                    className="flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold text-lg hover:opacity-90 transition"
                                >
                                    <Play className="w-5 h-5" />
                                    Start
                                </button>
                            ) : (
                                <button
                                    onClick={handlePause}
                                    className="flex items-center gap-2 px-8 py-4 bg-secondary text-secondary-foreground rounded-lg font-semibold text-lg hover:opacity-90 transition"
                                >
                                    <Pause className="w-5 h-5" />
                                    Pause
                                </button>
                            )}
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-2 px-8 py-4 border border-border rounded-lg font-semibold text-lg hover:bg-muted transition"
                            >
                                <RotateCcw className="w-5 h-5" />
                                Reset
                            </button>
                        </div>
                    </div>

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

                    {/* Tips */}
                    <div className="mt-8 bg-gradient-to-r from-primary/10 to-chart-2/10 border border-primary/20 rounded-lg p-6">
                        <h3 className="font-semibold text-foreground mb-3">Pomodoro Tips</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                <span>Work for 25 minutes with full focus, then take a 5-minute break</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                <span>After 4 focus sessions, take a longer 15-minute break</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                <span>Eliminate all distractions during focus sessions</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default FocusPage;

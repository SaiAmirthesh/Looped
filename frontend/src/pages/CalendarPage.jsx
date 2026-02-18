import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Navigation from '../components/Navigation';
import { ChevronLeft, ChevronRight, TrendingUp, Flame, Calendar } from 'lucide-react';

const CalendarPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());

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

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        return { daysInMonth: lastDay.getDate(), startingDayOfWeek: firstDay.getDay() };
    };

    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const previousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

    return (
        <div className="flex min-h-screen bg-background">
            <Navigation />
            <main className="flex-1 overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 border-b border-border" style={{ backgroundColor: 'var(--background)' }}>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
                        <p className="text-sm text-muted-foreground">Track your daily progress and maintain your streaks</p>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-card border border-border rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-1">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground uppercase tracking-wide">XP This Month</span>
                            </div>
                            <div className="text-3xl font-bold text-foreground">0</div>
                            <div className="text-xs text-muted-foreground mt-1">across 0 active days</div>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground uppercase tracking-wide">Daily Avg XP</span>
                            </div>
                            <div className="text-3xl font-bold text-foreground">0</div>
                            <div className="text-xs text-muted-foreground mt-1">per active day</div>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-1">
                                <Flame className="w-4 h-4 text-orange-500" />
                                <span className="text-xs text-muted-foreground uppercase tracking-wide">Current Streak</span>
                            </div>
                            <div className="text-3xl font-bold text-foreground">0 days</div>
                            <div className="text-xs text-muted-foreground mt-1">keep it going!</div>
                        </div>
                    </div>

                    {/* Calendar Card */}
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                        {/* Month Navigation */}
                        <div className="flex items-center justify-between mb-6">
                            <button onClick={previousMonth} className="p-2 hover:bg-muted rounded-lg transition text-muted-foreground hover:text-foreground">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <h2 className="text-lg font-semibold text-foreground">
                                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </h2>
                            <button onClick={nextMonth} className="p-2 hover:bg-muted rounded-lg transition text-muted-foreground hover:text-foreground">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Day Headers */}
                        <div className="grid grid-cols-7 mb-2">
                            {dayNames.map(day => (
                                <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">{day}</div>
                            ))}
                        </div>

                        {/* Day Cells */}
                        <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                                <div key={`empty-${i}`} />
                            ))}
                            {Array.from({ length: daysInMonth }).map((_, index) => {
                                const day = index + 1;
                                const isToday =
                                    day === new Date().getDate() &&
                                    currentDate.getMonth() === new Date().getMonth() &&
                                    currentDate.getFullYear() === new Date().getFullYear();
                                const isFuture = new Date(currentDate.getFullYear(), currentDate.getMonth(), day) > new Date();

                                return (
                                    <div
                                        key={day}
                                        className={`aspect-square rounded-lg flex items-center justify-center text-sm transition cursor-pointer
                                            ${isToday
                                                ? 'bg-primary/20 border-2 border-primary text-primary font-bold'
                                                : isFuture
                                                    ? 'text-muted-foreground/40'
                                                    : 'hover:bg-muted text-muted-foreground'
                                            }`}
                                    >
                                        {day}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-6 mt-6 pt-5 border-t border-border text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 border-2 border-primary bg-primary/20 rounded" />
                                <span className="text-muted-foreground">Today</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500/60 rounded" />
                                <span className="text-muted-foreground">Full Completion</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-orange-500/60 rounded" />
                                <span className="text-muted-foreground">Partial</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-500/60 rounded" />
                                <span className="text-muted-foreground">Missed</span>
                            </div>
                        </div>
                    </div>

                    {/* Monthly Summary */}
                    <div className="bg-gradient-to-r from-primary/10 via-transparent to-chart-2/10 border border-primary/20 rounded-xl p-6">
                        <h3 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">Monthly Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            {[
                                'Start completing habits to see your progress here',
                                'Keep your streak alive by completing habits daily',
                                'Consistency is key to leveling up your skills',
                                'Focus sessions also earn you XP each day',
                            ].map((tip, i) => (
                                <div key={i} className="flex items-start gap-2">
                                    <span className="text-primary mt-0.5">•</span>
                                    <span className="text-muted-foreground">{tip}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CalendarPage;

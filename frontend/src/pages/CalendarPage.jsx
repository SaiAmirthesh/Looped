import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Navigation from '../components/Navigation';
import { ChevronLeft, ChevronRight, TrendingUp, Flame } from 'lucide-react';

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

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const previousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

    return (
        <div className="flex min-h-screen bg-background">
            <Navigation />
            <main className="flex-1 m-10 p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Calendar</h1>
                    <p className="text-muted-foreground">Track your daily progress and maintain your streaks</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="text-muted-foreground text-sm mb-2">Total XP This Month</div>
                        <div className="text-3xl font-bold text-foreground">0</div>
                        <div className="text-sm text-muted-foreground mt-1">Across 0 active days</div>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="text-muted-foreground text-sm mb-2">Average Daily XP</div>
                        <div className="text-3xl font-bold text-foreground">0</div>
                        <div className="text-sm text-muted-foreground mt-1">Per active day</div>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            <span className="text-muted-foreground text-sm">Current Streak</span>
                        </div>
                        <div className="text-3xl font-bold text-foreground">0 days</div>
                        <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                            Keep it going! <Flame className="w-4 h-4 text-orange-500 inline" />
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                        <button onClick={previousMonth} className="p-2 hover:bg-muted rounded-lg transition">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h2 className="text-2xl font-semibold text-foreground">
                            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h2>
                        <button onClick={nextMonth} className="p-2 hover:bg-muted rounded-lg transition">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {dayNames.map(day => (
                            <div key={day} className="text-center font-semibold text-muted-foreground py-2 text-sm">{day}</div>
                        ))}
                        {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                            <div key={`empty-${index}`} className="aspect-square" />
                        ))}
                        {Array.from({ length: daysInMonth }).map((_, index) => {
                            const day = index + 1;
                            const isToday = day === new Date().getDate() &&
                                currentDate.getMonth() === new Date().getMonth() &&
                                currentDate.getFullYear() === new Date().getFullYear();
                            const isFuture = new Date(currentDate.getFullYear(), currentDate.getMonth(), day) > new Date();

                            let dayClassName = 'aspect-square border-2 rounded-lg p-1 flex flex-col items-center justify-center transition-all cursor-pointer relative ';
                            if (isToday) {
                                dayClassName += 'border-primary bg-primary/10 font-bold';
                            } else if (isFuture) {
                                dayClassName += 'border-border bg-muted/30 opacity-40';
                            } else {
                                dayClassName += 'border-border bg-muted/30 opacity-40';
                            }

                            return (
                                <div key={day} className={dayClassName}>
                                    <span className={`text-sm ${isToday ? 'text-primary' : 'text-foreground'}`}>{day}</span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-6 mt-6 pt-6 border-t border-border text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-primary bg-primary/10 rounded"></div>
                            <span className="text-muted-foreground">Today</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-green-500/60 bg-green-500/50 rounded"></div>
                            <span className="text-muted-foreground">Full Completion</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-orange-500/60 bg-orange-500/50 rounded"></div>
                            <span className="text-muted-foreground">Partial Completion</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-red-500/60 bg-red-500/50 rounded"></div>
                            <span className="text-muted-foreground">No Completion</span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 bg-gradient-to-r from-primary/10 to-chart-2/10 border border-primary/20 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Monthly Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span className="text-muted-foreground">Start completing habits to see your progress here</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span className="text-muted-foreground">Keep your streak alive by completing habits daily</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span className="text-muted-foreground">Consistency is key to leveling up your skills</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span className="text-muted-foreground">Focus sessions also earn you XP each day</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CalendarPage;

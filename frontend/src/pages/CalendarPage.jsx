import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Navigation from '../components/Navigation';
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { getData, generateKey } from '../lib/storage';

const CalendarPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [dailyStatus, setDailyStatus] = useState({}); // Store completion status per day
    const [dailyXP, setDailyXP] = useState({});
    const [currentStreak, setCurrentStreak] = useState(0);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
                return;
            }

            const userId = session.user.id;
            setUser(session.user);

            // Calculate daily status and XP for the current month
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            
            const habitsKey = generateKey(userId, 'habits');
            const habits = getData(habitsKey, []);
            
            const statusMap = {};
            const xpMap = {};
            
            for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                
                // Count habits completed on this day
                const habitsCompletedCount = habits.filter(h => h.lastCompleted === dateStr).length;
                const totalHabits = habits.length;
                
                // Determine completion status: green (100%), orange (>0%), red (0%)
                let status = 'no'; // red - no completion
                if (totalHabits > 0) {
                    const completionPercent = (habitsCompletedCount / totalHabits) * 100;
                    if (completionPercent === 100) {
                        status = 'full'; // green - full completion
                    } else if (completionPercent > 0) {
                        status = 'partial'; // orange - partial completion
                    }
                }
                
                const habitXP = habitsCompletedCount * 10; // 10 XP per habit
                
                // Check focus sessions for that day
                const focusKey = generateKey(userId, `focusSessions:${dateStr}`);
                const focusSessions = getData(focusKey, []);
                const focusXP = focusSessions.filter(s => s.type === 'focus').length * 15; // 15 XP per focus session
                
                const totalDayXP = habitXP + focusXP;
                if (totalDayXP > 0) {
                    xpMap[day] = totalDayXP;
                }
                
                if (status !== 'no' || totalDayXP > 0) {
                    statusMap[day] = status;
                }
            }
            
            setDailyStatus(statusMap);
            setDailyXP(xpMap);

            // Calculate current streak
            const streaks = habits.map(h => h.streak);
            const maxStreak = streaks.length > 0 ? Math.max(...streaks) : 0;
            setCurrentStreak(maxStreak);
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
    }, [navigate, currentDate]);

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        return { daysInMonth, startingDayOfWeek };
    };

    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const previousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const totalXPThisMonth = Object.values(dailyXP).reduce((sum, xp) => sum + xp, 0);
    const activeDays = Object.keys(dailyXP).length;
    const averageXP = activeDays > 0 ? Math.round(totalXPThisMonth / activeDays) : 0;
    const maxDayXP = Object.values(dailyXP).length > 0 ? Math.max(...Object.values(dailyXP)) : 0;

    return (
        <div className="flex min-h-screen bg-background">
            <Navigation />

            <main className="flex-1 m-10 p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Calendar</h1>
                    <p className="text-muted-foreground">
                        Track your daily progress and maintain your streaks
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="text-muted-foreground text-sm mb-2">Total XP This Month</div>
                        <div className="text-3xl font-bold text-foreground">{totalXPThisMonth}</div>
                        <div className="text-sm text-muted-foreground mt-1">Across {activeDays} active days</div>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="text-muted-foreground text-sm mb-2">Average Daily XP</div>
                        <div className="text-3xl font-bold text-foreground">{averageXP}</div>
                        <div className="text-sm text-muted-foreground mt-1">Per active day</div>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            <span className="text-muted-foreground text-sm">Current Streak</span>
                        </div>
                        <div className="text-3xl font-bold text-foreground">{currentStreak} days</div>
                        <div className="text-sm text-muted-foreground mt-1">Keep it going! 🔥</div>
                    </div>
                </div>

                {/* Calendar */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={previousMonth}
                            className="p-2 hover:bg-muted rounded-lg transition"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <h2 className="text-2xl font-semibold text-foreground">
                            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h2>

                        <button
                            onClick={nextMonth}
                            className="p-2 hover:bg-muted rounded-lg transition"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-2">
                        {/* Day headers */}
                        {dayNames.map(day => (
                            <div key={day} className="text-center font-semibold text-muted-foreground py-2 text-sm">
                                {day}
                            </div>
                        ))}

                        {/* Empty cells for days before month starts */}
                        {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                            <div key={`empty-${index}`} className="aspect-square" />
                        ))}

                        {/* Calendar days */}
                        {Array.from({ length: daysInMonth }).map((_, index) => {
                            const day = index + 1;
                            const status = dailyStatus[day] || 'no';
                            const hasXP = dailyXP[day];
                            const isToday = day === new Date().getDate() &&
                                currentDate.getMonth() === new Date().getMonth() &&
                                currentDate.getFullYear() === new Date().getFullYear();

                            let dayClassName = 'aspect-square border-2 rounded-lg p-2 flex flex-col items-center justify-center transition-all cursor-pointer ';

                            if (isToday) {
                                dayClassName += 'border-primary bg-primary/10 font-bold';
                            } else if (status === 'full') {
                                // All habits completed on this day
                                dayClassName += 'border-green-500/60 bg-green-500/50 hover:bg-green-500/60';
                            } else if (status === 'partial') {
                                // Some habits completed
                                dayClassName += 'border-orange-500/60 bg-orange-500/50 hover:bg-orange-500/60';
                            } else {
                                // No habits completed
                                dayClassName += 'border-red-500/60 bg-red-500/50 hover:bg-red-500/60';
                            }

                            return (
                                <div
                                    key={day}
                                    className={dayClassName}
                                    title={`${status === 'full' ? 'Full completion' : status === 'partial' ? 'Partial completion' : 'No habits completed'}`}
                                >
                                    <span className={`text-sm ${isToday ? 'text-primary' : 'text-foreground'}`}>
                                        {day}
                                    </span>
                                    {hasXP && (
                                        <span className="text-xs text-muted-foreground font-semibold mt-1">
                                            +{hasXP}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Legend */}
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

                {/* Monthly Summary */}
                <div className="mt-8 bg-gradient-to-r from-primary/10 to-chart-2/10 border border-primary/20 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Monthly Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span className="text-muted-foreground">
                                You've been active on <strong className="text-foreground">{activeDays} days</strong> this month
                            </span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span className="text-muted-foreground">
                                Your highest XP day was <strong className="text-foreground">{maxDayXP} XP</strong>
                            </span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span className="text-muted-foreground">
                                Keep your streak alive by completing habits daily
                            </span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span className="text-muted-foreground">
                                Consistency is key to leveling up your skills
                            </span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CalendarPage;

import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';

const CalendarPage = () => {
    const [currentDate, setCurrentDate] = useState(new Date());

    // Generate calendar days
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

    // Dummy data for XP per day
    const dailyXP = {
        1: 150, 3: 200, 5: 180, 7: 220, 8: 150, 10: 190, 12: 200,
        14: 180, 15: 210, 17: 150, 19: 200, 21: 180, 22: 220,
        24: 190, 26: 200, 28: 180
    };

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

    return (
        <div className="flex min-h-screen bg-background">
            <Navigation />

            <main className="flex-1 ml-64 p-8">
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
                        <div className="text-3xl font-bold text-foreground">7 days</div>
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
                            const hasXP = dailyXP[day];
                            const isToday = day === new Date().getDate() &&
                                currentDate.getMonth() === new Date().getMonth() &&
                                currentDate.getFullYear() === new Date().getFullYear();

                            return (
                                <div
                                    key={day}
                                    className={`aspect-square border-2 rounded-lg p-2 flex flex-col items-center justify-center transition-all cursor-pointer ${isToday
                                            ? 'border-primary bg-primary/10 font-bold'
                                            : hasXP
                                                ? 'border-chart-2/40 bg-chart-2/10 hover:bg-chart-2/20'
                                                : 'border-border hover:border-muted-foreground/30'
                                        }`}
                                >
                                    <span className={`text-sm ${isToday ? 'text-primary' : 'text-foreground'}`}>
                                        {day}
                                    </span>
                                    {hasXP && (
                                        <span className="text-xs text-chart-2 font-semibold mt-1">
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
                            <div className="w-4 h-4 border-2 border-chart-2/40 bg-chart-2/10 rounded"></div>
                            <span className="text-muted-foreground">XP Earned</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-border rounded"></div>
                            <span className="text-muted-foreground">No Activity</span>
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
                                Your highest XP day was <strong className="text-foreground">{Math.max(...Object.values(dailyXP))} XP</strong>
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

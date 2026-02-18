import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Navigation from '../components/Navigation';
import {
    ChevronLeft, ChevronRight, TrendingUp, Flame, Calendar,
    Bell, Plus, X, Trash2, Clock, AlignLeft
} from 'lucide-react';

// ─── Reminder Modal ────────────────────────────────────────────────────────────
const ReminderModal = ({ date, reminders, onClose, onAdd, onDelete, saving }) => {
    const [title, setTitle] = useState('');
    const [note, setNote] = useState('');
    const [time, setTime] = useState('');
    const [view, setView] = useState('list');

    const dateLabel = date
        ? date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
        : '';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        await onAdd({ title: title.trim(), note: note.trim(), time: time || null });
        setTitle(''); setNote(''); setTime('');
        setView('list');
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-primary" />
                        <div>
                            <h2 className="text-base font-semibold text-foreground">Reminders</h2>
                            <p className="text-xs text-muted-foreground">{dateLabel}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                    {view === 'list' ? (
                        <>
                            {reminders.length === 0 ? (
                                <div className="text-center py-8">
                                    <Bell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                                    <p className="text-sm text-muted-foreground">No reminders for this day</p>
                                    <p className="text-xs text-muted-foreground/60 mt-1">Click below to add one</p>
                                </div>
                            ) : (
                                reminders.map((r) => (
                                    <div key={r.id} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-background group">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                                            {r.reminder_time && (
                                                <p className="text-xs text-primary flex items-center gap-1 mt-0.5">
                                                    <Clock className="w-3 h-3" />{r.reminder_time.slice(0, 5)}
                                                </p>
                                            )}
                                            {r.note && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.note}</p>}
                                        </div>
                                        <button onClick={() => onDelete(r.id)}
                                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Doctor appointment"
                                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                                    autoFocus required />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                                    <Clock className="w-3 h-3 inline mr-1" />Time (optional)
                                </label>
                                <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                                    <AlignLeft className="w-3 h-3 inline mr-1" />Note (optional)
                                </label>
                                <textarea value={note} onChange={(e) => setNote(e.target.value)}
                                    placeholder="Add any extra details..." rows={3}
                                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition resize-none" />
                            </div>
                            <div className="flex gap-2 pt-1">
                                <button type="button" onClick={() => setView('list')}
                                    className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving || !title.trim()}
                                    className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed">
                                    {saving ? 'Saving…' : 'Save Reminder'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {view === 'list' && (
                    <div className="px-6 py-4 border-t border-border">
                        <button onClick={() => setView('add')}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition">
                            <Plus className="w-4 h-4" />Add Reminder
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
const CalendarPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [reminders, setReminders] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    // dayStats: { 'YYYY-MM-DD': { completed: number, total: number } }
    const [dayStats, setDayStats] = useState({});
    const [monthXp, setMonthXp] = useState(0);
    const [activeDays, setActiveDays] = useState(0);

    // ── Auth ──────────────────────────────────────────────────────────────────
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

    // ── Fetch habit completions + total habits for the month ──────────────────
    const fetchMonthData = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month + 1, 0).getDate();
        const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        // Fetch in parallel: completions for month + total habit count + reminders
        const [completionsRes, habitsRes, remindersRes] = await Promise.all([
            supabase
                .from('habit_completions')
                .select('completed_date, habit_id, xp_earned')
                .eq('user_id', user.id)
                .gte('completed_date', from)
                .lte('completed_date', to),
            supabase
                .from('habits')
                .select('id')
                .eq('user_id', user.id),
            supabase
                .from('reminders')
                .select('*')
                .eq('user_id', user.id)
                .gte('reminder_date', from)
                .lte('reminder_date', to)
                .order('reminder_date', { ascending: true })
                .order('reminder_time', { ascending: true, nullsFirst: true }),
        ]);

        const totalHabits = (habitsRes.data ?? []).length;
        const completions = completionsRes.data ?? [];

        // Group completions by date → count unique habits completed per day
        const byDate = {};
        completions.forEach(c => {
            if (!byDate[c.completed_date]) byDate[c.completed_date] = new Set();
            byDate[c.completed_date].add(c.habit_id);
        });

        // Build dayStats map
        const stats = {};
        let totalXp = 0;
        let days = 0;
        Object.entries(byDate).forEach(([date, habitSet]) => {
            stats[date] = { completed: habitSet.size, total: totalHabits };
            totalXp += completions
                .filter(c => c.completed_date === date)
                .reduce((s, c) => s + (c.xp_earned ?? 0), 0);
            days++;
        });

        setDayStats(stats);
        setMonthXp(totalXp);
        setActiveDays(days);
        setReminders(remindersRes.data ?? []);
        setLoading(false);
    }, [user, currentDate]);

    useEffect(() => { fetchMonthData(); }, [fetchMonthData]);

    // ── CRUD ──────────────────────────────────────────────────────────────────
    const toLocalDateString = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const handleAddReminder = async ({ title, note, time }) => {
        if (!user || !selectedDate) return;
        setSaving(true);
        const dateStr = toLocalDateString(selectedDate);
        const { error } = await supabase.from('reminders').insert({
            user_id: user.id, title, note: note || null,
            reminder_date: dateStr, reminder_time: time || null,
        });
        if (!error) await fetchMonthData();
        setSaving(false);
    };

    const handleDeleteReminder = async (id) => {
        const { error } = await supabase.from('reminders').delete().eq('id', id);
        if (!error) setReminders((prev) => prev.filter((r) => r.id !== id));
    };

    // ── Helpers ───────────────────────────────────────────────────────────────
    const remindersForDate = (date) => {
        const str = toLocalDateString(date);
        return reminders.filter((r) => r.reminder_date === str);
    };
    const remindersForSelected = selectedDate ? remindersForDate(selectedDate) : [];

    // Returns 'green' | 'orange' | 'red' | null for a past/today date
    const getCellStatus = (dateStr, isFuture) => {
        if (isFuture) return null;
        const stat = dayStats[dateStr];
        if (!stat || stat.total === 0) return null; // no habits created yet
        if (stat.completed === 0) return 'red';
        if (stat.completed >= stat.total) return 'green';
        return 'orange';
    };

    const cellStyle = {
        green: {
            bg: 'bg-green-500/20 hover:bg-green-500/30',
            border: 'border border-green-500/40',
            text: 'text-green-400 font-semibold',
        },
        orange: {
            bg: 'bg-orange-500/20 hover:bg-orange-500/30',
            border: 'border border-orange-500/40',
            text: 'text-orange-400 font-semibold',
        },
        red: {
            bg: 'bg-red-500/15 hover:bg-red-500/25',
            border: 'border border-red-500/30',
            text: 'text-red-400 font-semibold',
        },
    };

    // ── Calendar math ─────────────────────────────────────────────────────────
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return {
            daysInMonth: new Date(year, month + 1, 0).getDate(),
            startingDayOfWeek: new Date(year, month, 1).getDay(),
        };
    };
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const previousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

    const openModal = (day) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(date);
        setModalOpen(true);
    };

    const today = toLocalDateString(new Date());
    const upcomingReminders = reminders.filter((r) => r.reminder_date >= today).slice(0, 5);
    const avgXp = activeDays > 0 ? Math.round(monthXp / activeDays) : 0;

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="flex min-h-screen bg-background">
            <Navigation />
            <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-4 md:px-8 py-3 md:py-4 border-b border-border"
                    style={{ backgroundColor: 'var(--background)' }}>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">Calendar</h1>
                        <p className="hidden md:block text-sm text-muted-foreground">Track progress and manage your reminders</p>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-muted-foreground bg-muted px-2 md:px-3 py-1 md:py-1.5 rounded-lg font-medium">
                        <Bell className="w-3 md:w-3.5 h-3 md:h-3.5 text-primary" />
                        <span>{reminders.length} reminder{reminders.length !== 1 ? 's' : ''}</span>
                    </div>
                </div>

                <div className="px-4 py-6 md:p-8 space-y-5 md:space-y-6">
                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-3 md:gap-4">
                        <div className="bg-card border border-border rounded-xl p-3 md:p-5 shadow-sm">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Calendar className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">XP</span>
                            </div>
                            <div className="text-xl md:text-3xl font-bold text-foreground">{monthXp}</div>
                            <div className="hidden md:block text-xs text-muted-foreground mt-1">across {activeDays} days</div>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-3 md:p-5 shadow-sm">
                            <div className="flex items-center gap-1.5 mb-1">
                                <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Avg</span>
                            </div>
                            <div className="text-xl md:text-3xl font-bold text-foreground">{avgXp}</div>
                            <div className="hidden md:block text-xs text-muted-foreground mt-1">per active day</div>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-3 md:p-5 shadow-sm">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Flame className="w-3 h-3 md:w-4 md:h-4 text-orange-500" />
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Days</span>
                            </div>
                            <div className="text-xl md:text-3xl font-bold text-foreground">{activeDays}</div>
                            <div className="hidden md:block text-xs text-muted-foreground mt-1">this month</div>
                        </div>
                    </div>

                    {/* Calendar Card */}
                    <div className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-sm">
                        {/* Month Navigation */}
                        <div className="flex items-center justify-between mb-6">
                            <button onClick={previousMonth}
                                className="p-2 hover:bg-muted rounded-lg transition text-muted-foreground hover:text-foreground">
                                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                            <h2 className="text-base md:text-lg font-semibold text-foreground">
                                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </h2>
                            <button onClick={nextMonth}
                                className="p-2 hover:bg-muted rounded-lg transition text-muted-foreground hover:text-foreground">
                                <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                        </div>

                        {/* Day Headers */}
                        <div className="grid grid-cols-7 mb-2">
                            {dayNames.map((day) => (
                                <div key={day} className="text-center text-[10px] md:text-xs font-semibold text-muted-foreground py-2 uppercase tracking-widest">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Day Cells */}
                        <div className="grid grid-cols-7 gap-1 md:gap-1.5">
                            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                                <div key={`empty-${i}`} />
                            ))}
                            {Array.from({ length: daysInMonth }).map((_, index) => {
                                const day = index + 1;
                                const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                                const dateStr = toLocalDateString(cellDate);
                                const isToday = dateStr === today;
                                const isFuture = cellDate > new Date() && !isToday;
                                const status = getCellStatus(dateStr, isFuture);
                                const hasReminders = reminders.some(r => r.reminder_date === dateStr);
                                const styles = status ? cellStyle[status] : null;

                                return (
                                    <button
                                        key={day}
                                        onClick={() => openModal(day)}
                                        className={`
                                            relative aspect-square rounded-lg md:rounded-xl flex flex-col items-center justify-center text-xs md:text-sm transition-all
                                            ${isToday
                                                ? 'bg-primary/20 border-2 border-primary text-primary font-bold shadow-sm'
                                                : isFuture
                                                    ? 'text-muted-foreground/30 hover:bg-muted/40 border border-transparent'
                                                    : styles
                                                        ? `${styles.bg} ${styles.border} ${styles.text}`
                                                        : 'hover:bg-muted text-muted-foreground border border-transparent hover:border-border'
                                            }
                                        `}
                                    >
                                        <span className="leading-none">{day}</span>

                                        {/* Reminder dot — shown near the date number */}
                                        {hasReminders && (
                                            <span className="absolute top-0.5 md:top-1 right-0.5 md:right-1.5 w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-primary shadow-sm" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-3 md:gap-5 mt-6 pt-5 border-t border-border text-[10px] md:text-xs flex-wrap">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 md:w-3 md:h-3 border border-primary bg-primary/20 rounded-[3px]" />
                                <span className="text-muted-foreground">Today</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500/40 border border-green-500/50 rounded-[3px]" />
                                <span className="text-muted-foreground">Done</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-orange-500/40 border border-orange-500/50 rounded-[3px]" />
                                <span className="text-muted-foreground">Partial</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-red-500/30 border border-red-500/40 rounded-[3px]" />
                                <span className="text-muted-foreground">Missed</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-primary inline-block" />
                                <span className="text-muted-foreground">Reminder</span>
                            </div>
                        </div>
                    </div>

                    {/* Upcoming Reminders Panel */}
                    <div className="bg-card border border-border rounded-xl p-5 md:p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <Bell className="w-4 h-4 text-primary" />Upcoming
                            </h3>
                            {upcomingReminders.length > 0 && (
                                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
                                    {upcomingReminders.length} item{upcomingReminders.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>

                        {loading ? (
                            <div className="space-y-2">
                                {[1, 2].map((i) => <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />)}
                            </div>
                        ) : upcomingReminders.length === 0 ? (
                            <div className="text-center py-6">
                                <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">No upcoming reminders</p>
                                <p className="text-xs text-muted-foreground/60 mt-1">Click any date to add one</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {upcomingReminders.map((r) => {
                                    const rDate = new Date(r.reminder_date + 'T00:00:00');
                                    const isRToday = r.reminder_date === today;
                                    return (
                                        <div key={r.id}
                                            className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background group hover:border-primary/30 transition shadow-sm">
                                            <div className={`w-9 h-9 md:w-10 md:h-10 rounded-lg flex flex-col items-center justify-center text-center flex-shrink-0 ${isRToday ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                <span className="text-[8px] md:text-xs font-bold leading-none uppercase">
                                                    {rDate.toLocaleDateString('en-US', { month: 'short' })}
                                                </span>
                                                <span className="text-base md:text-lg font-bold leading-none">{rDate.getDate()}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-foreground truncate leading-tight">{r.title}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {r.reminder_time && (
                                                        <span className="text-[10px] text-primary flex items-center gap-1 font-medium">
                                                            <Clock className="w-2.5 h-2.5" />{r.reminder_time.slice(0, 5)}
                                                        </span>
                                                    )}
                                                    {isRToday && (
                                                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">Today</span>
                                                    )}
                                                    {r.note && <span className="text-[10px] text-muted-foreground truncate">{r.note}</span>}
                                                </div>
                                            </div>
                                            <button onClick={() => handleDeleteReminder(r.id)}
                                                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition md:opacity-0 group-hover:opacity-100">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Monthly Summary */}
                    <div className="bg-gradient-to-r from-primary/10 via-transparent to-chart-2/10 border border-primary/20 rounded-xl p-5 md:p-6 shadow-sm">
                        <h3 className="text-[10px] md:text-xs font-semibold text-foreground mb-3 uppercase tracking-wide font-bold">Monthly Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            {[
                                'Start completing habits to see your progress here',
                                'Keep your streak alive by completing habits daily',
                                'Consistency is key to leveling up your skills',
                                'Focus sessions also earn you XP each day',
                            ].map((tip, i) => (
                                <div key={i} className="flex items-start gap-2">
                                    <span className="text-primary font-bold">•</span>
                                    <span className="text-muted-foreground leading-relaxed">{tip}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>


            {/* Reminder Modal */}
            {modalOpen && selectedDate && (
                <ReminderModal
                    date={selectedDate}
                    reminders={remindersForSelected}
                    onClose={() => { setModalOpen(false); setSelectedDate(null); }}
                    onAdd={handleAddReminder}
                    onDelete={handleDeleteReminder}
                    saving={saving}
                />
            )}
        </div>
    );
};

export default CalendarPage;

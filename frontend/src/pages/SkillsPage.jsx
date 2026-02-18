import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import * as db from '../lib/database';
import Navigation from '../components/Navigation';
import { Target, Brain, Heart, BookOpen, Palette, Users, Zap, TrendingUp } from 'lucide-react';

const DEFAULT_SKILLS = [
    { name: 'Focus', currentXP: 0, level: 1 },
    { name: 'Learning', currentXP: 0, level: 1 },
    { name: 'Health', currentXP: 0, level: 1 },
    { name: 'Creativity', currentXP: 0, level: 1 },
    { name: 'Confidence', currentXP: 0, level: 1 },
    { name: 'Social', currentXP: 0, level: 1 }
];

const SKILL_META = {
    Focus:      { icon: Target,  color: 'text-primary',    bg: 'bg-primary/10',    bar: 'bg-primary' },
    Learning:   { icon: BookOpen, color: 'text-chart-4',   bg: 'bg-chart-4/10',    bar: 'bg-chart-4' },
    Health:     { icon: Heart,   color: 'text-chart-1',    bg: 'bg-chart-1/10',    bar: 'bg-chart-1' },
    Creativity: { icon: Palette, color: 'text-chart-3',    bg: 'bg-chart-3/10',    bar: 'bg-chart-3' },
    Confidence: { icon: Zap,     color: 'text-yellow-500', bg: 'bg-yellow-500/10', bar: 'bg-yellow-500' },
    Social:     { icon: Users,   color: 'text-chart-5',    bg: 'bg-chart-5/10',    bar: 'bg-chart-5' },
};

const SKILL_DESC = {
    Focus:      'Your ability to concentrate and complete tasks without distraction',
    Learning:   'Knowledge acquisition and continuous self-improvement',
    Health:     'Physical and mental well-being through healthy habits',
    Creativity: 'Innovative thinking and creative problem-solving',
    Confidence: 'Self-assurance and belief in your abilities',
    Social:     'Building and maintaining meaningful relationships',
};

const enrichSkills = (rawSkills) => rawSkills.map(skill => {
    // DB returns snake_case (current_xp); DEFAULT_SKILLS used camelCase (currentXP) — normalise both
    const currentXP = skill.current_xp ?? skill.currentXP ?? 0;
    const level = skill.level ?? 1;
    const maxXP = Math.floor(100 * Math.pow(level, 1.5));
    const progress = maxXP > 0 ? Math.min(100, Math.floor((currentXP / maxXP) * 100)) : 0;
    const meta = SKILL_META[skill.name] || SKILL_META.Focus;
    return { ...skill, currentXP, current_xp: currentXP, level, maxXP, progress, ...meta, description: SKILL_DESC[skill.name] || '' };
});

const SkillsPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSkills = useCallback(async (userId) => {
        setLoading(true);
        const skillsData = await db.getSkills(userId);
        setSkills(enrichSkills(skillsData));
        setLoading(false);
    }, []);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { navigate('/login'); return; }
            setUser(session.user);
            await fetchSkills(session.user.id);
        };
        checkUser();
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) navigate('/login');
            else {
                setUser(session.user);
                // Only refetch if user ID changed
                if (session.user.id !== user?.id) {
                    fetchSkills(session.user.id);
                }
            }
        });
        return () => subscription?.unsubscribe();
    }, [navigate, user?.id, fetchSkills]);

    const totalLevel = useMemo(() => skills.reduce((sum, s) => sum + s.level, 0), [skills]);
    const averageLevel = useMemo(() => skills.length > 0 ? (totalLevel / skills.length).toFixed(1) : 0, [skills, totalLevel]);
    const highestSkill = useMemo(() => skills.length > 0 ? skills.reduce((max, s) => s.level > max.level ? s : max) : null, [skills]);

    return (
        <div className="flex min-h-screen bg-background">
            <Navigation />
            <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-4 md:px-8 py-3 md:py-4 border-b border-border" style={{ backgroundColor: 'var(--background)' }}>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">Skill Tree</h1>
                        <p className="hidden md:block text-sm text-muted-foreground">Level up your skills by completing habits and quests</p>
                    </div>
                </div>

                <div className="px-4 py-6 md:p-8 space-y-5 md:space-y-6">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-3 md:gap-4">
                        <div className="bg-card border border-border rounded-xl p-3 md:p-5 shadow-sm text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-1.5 mb-1 text-muted-foreground">
                                <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                <span className="text-[10px] md:text-xs uppercase tracking-wider font-bold">Total</span>
                            </div>
                            <div className="text-xl md:text-3xl font-bold text-foreground">{totalLevel}</div>
                            <div className="hidden md:block text-xs text-muted-foreground mt-1">all points</div>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-3 md:p-5 shadow-sm text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-1.5 mb-1 text-muted-foreground">
                                <Zap className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                <span className="text-[10px] md:text-xs uppercase tracking-wider font-bold">Avg</span>
                            </div>
                            <div className="text-xl md:text-3xl font-bold text-foreground">{averageLevel}</div>
                            <div className="hidden md:block text-xs text-muted-foreground mt-1">level per skill</div>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-3 md:p-5 shadow-sm text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-1.5 mb-1 text-muted-foreground">
                                <Target className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                <span className="text-[10px] md:text-xs uppercase tracking-wider font-bold">Master</span>
                            </div>
                            <div className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground truncate">{highestSkill?.name || '—'}</div>
                            <div className="hidden md:block text-xs text-muted-foreground mt-1">Level {highestSkill?.level || 0}</div>
                        </div>
                    </div>

                    {/* Skills Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {skills.map(skill => {
                            const Icon = skill.icon;
                            return (
                                <div key={skill.name} className="bg-card border border-border rounded-xl p-5 md:p-6 hover:border-primary/30 transition-all shadow-sm group">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 md:w-11 md:h-11 ${skill.bg} rounded-xl flex items-center justify-center shadow-inner`}>
                                                <Icon className={`w-5 h-5 ${skill.color}`} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-foreground leading-tight">{skill.name}</h3>
                                                <p className="text-[10px] md:text-xs text-muted-foreground font-medium uppercase tracking-wide">Level {skill.level}</p>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] md:text-xs font-bold px-2 py-0.5 md:py-1 rounded-md ${skill.bg} ${skill.color}`}>
                                            Lv.{skill.level}
                                        </span>
                                    </div>

                                    <p className="text-[11px] md:text-xs text-muted-foreground mb-4 leading-relaxed">{skill.description}</p>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-[10px] md:text-xs">
                                            <span className="text-muted-foreground font-medium">Next Level</span>
                                            <span className="text-foreground font-bold">{skill.currentXP} / {skill.maxXP} XP</span>
                                        </div>
                                        <div className="w-full bg-muted/50 rounded-full h-2 md:h-1.5 overflow-hidden">
                                            <div
                                                className={`${skill.bar} h-full rounded-full transition-all duration-700 ease-out`}
                                                style={{ width: `${skill.progress}%` }}
                                            />
                                        </div>
                                        <div className="text-[10px] text-muted-foreground text-right font-medium italic">{skill.progress}% Complete</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* How Skills Work */}
                    <div className="bg-gradient-to-r from-primary/10 via-transparent to-chart-2/10 border border-primary/20 rounded-xl p-5 md:p-6 shadow-sm">
                        <h3 className="text-[10px] md:text-xs font-bold text-foreground mb-4 uppercase tracking-widest leading-none">How Skills Work</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 text-xs">
                            {[
                                'Complete daily habits to earn skill XP',
                                'Each level requires more XP than the last',
                                'Higher levels unlock special rewards',
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

        </div>
    );
};

export default SkillsPage;

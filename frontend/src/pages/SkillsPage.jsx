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
            <main className="flex-1 overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 border-b border-border" style={{ backgroundColor: 'var(--background)' }}>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Skill Tree</h1>
                        <p className="text-sm text-muted-foreground">Level up your skills by completing habits and quests</p>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-card border border-border rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground uppercase tracking-wide">Total Level</span>
                            </div>
                            <div className="text-3xl font-bold text-foreground">{totalLevel}</div>
                            <div className="text-xs text-muted-foreground mt-1">across all skills</div>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-1">
                                <Zap className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground uppercase tracking-wide">Average Level</span>
                            </div>
                            <div className="text-3xl font-bold text-foreground">{averageLevel}</div>
                            <div className="text-xs text-muted-foreground mt-1">per skill</div>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-1">
                                <Target className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground uppercase tracking-wide">Highest Skill</span>
                            </div>
                            <div className="text-3xl font-bold text-foreground">{highestSkill?.name || '—'}</div>
                            <div className="text-xs text-muted-foreground mt-1">Level {highestSkill?.level || 0}</div>
                        </div>
                    </div>

                    {/* Skills Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {skills.map(skill => {
                            const Icon = skill.icon;
                            return (
                                <div key={skill.name} className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-colors group">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-11 h-11 ${skill.bg} rounded-xl flex items-center justify-center`}>
                                                <Icon className={`w-5 h-5 ${skill.color}`} />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-foreground">{skill.name}</h3>
                                                <p className="text-xs text-muted-foreground">Level {skill.level}</p>
                                            </div>
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${skill.bg} ${skill.color}`}>
                                            Lv.{skill.level}
                                        </span>
                                    </div>

                                    <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{skill.description}</p>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">Progress</span>
                                            <span className="text-foreground font-medium">{skill.currentXP} / {skill.maxXP} XP</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className={`${skill.bar} h-1.5 rounded-full transition-all duration-500`}
                                                style={{ width: `${skill.progress}%` }}
                                            />
                                        </div>
                                        <div className="text-xs text-muted-foreground text-right">{skill.progress}% to next level</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* How Skills Work */}
                    <div className="bg-gradient-to-r from-primary/10 via-transparent to-chart-2/10 border border-primary/20 rounded-xl p-6">
                        <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">How Skills Work</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            {[
                                'Complete daily habits to earn skill XP',
                                'Each level requires more XP than the last',
                                'Higher levels unlock special rewards',
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

export default SkillsPage;

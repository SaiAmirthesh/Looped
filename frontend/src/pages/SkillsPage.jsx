import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Navigation from '../components/Navigation';
import StatCard from '../components/StatCard';
import { Target, Brain, Heart, BookOpen, Palette, Users, Sword, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { getSkillProgress, subscribeToSkills, getCachedSkillProgress } from '../lib/supabaseAPI';
import { usePageVisibilityRefetch } from '../lib/usePageVisibilityRefetch';
import { useDebouncedCallback } from '../lib/useDebouncedCallback';
import { PageTransition } from '../components/ui/PageTransition';

const transformSkills = (skillsData) => {
    const iconMap = {
        'Focus': Target,
        'Learning': Brain,
        'Health': Heart,
        'Creativity': Palette,
        'Confidence': Zap,
        'Social': Users
    };

    const descriptionMap = {
        'Focus': 'Complete focus sessions and stay concentrated',
        'Learning': 'Read books and expand your knowledge',
        'Health': 'Exercise and maintain a healthy lifestyle',
        'Creativity': 'Express yourself through creative activities',
        'Confidence': 'Build self-assurance and overcome challenges',
        'Social': 'Connect with others and build relationships'
    };

    return skillsData.map(skill => ({
        ...skill,
        icon: iconMap[skill.name],
        description: descriptionMap[skill.name]
    }));
};

const SkillsPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    // Initialize with cached data if available
    const [skills, setSkills] = useState(() => {
        const cached = getCachedSkillProgress();
        return cached ? transformSkills(cached) : [];
    });

    // Only show loading if no cache
    const [loading, setLoading] = useState(!getCachedSkillProgress());

    const loadSkills = useCallback(async () => {
        try {
            const skillsData = await getSkillProgress();
            const enrichedSkills = transformSkills(skillsData);
            setSkills(enrichedSkills);
            setLoading(false);
        } catch (error) {
            console.error('Error loading skills:', error);
            setLoading(false);
        }
    }, []);

    const debouncedRefetch = useDebouncedCallback(loadSkills, 300);

    useEffect(() => {
        let skillsSubscription;

        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
                return;
            }

            setUser(session.user);
            await loadSkills();
            skillsSubscription = await subscribeToSkills(debouncedRefetch);
        };

        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                navigate('/login');
            } else {
                setUser(session.user);
                loadSkills();
            }
        });

        return () => {
            subscription?.unsubscribe();
            skillsSubscription?.unsubscribe();
        };
    }, [navigate, loadSkills, debouncedRefetch]);

    usePageVisibilityRefetch(debouncedRefetch);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading your skills...</p>
                </div>
            </div>
        );
    }

    const totalLevel = skills.reduce((sum, skill) => sum + skill.level, 0);
    const averageLevel = skills.length > 0 ? (totalLevel / skills.length).toFixed(1) : 0;

    return (
        <div className="flex min-h-screen bg-background">
            <Navigation />

            <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
                <PageTransition>
                    <div className="mb-8 ">
                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-3xl font-bold text-foreground mb-2">Skills</h1>
                        </div>
                        <p className="text-muted-foreground">
                            Level up your skills by completing habits and quests
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-card border border-border rounded-lg p-6">
                            <div className="text-muted-foreground text-sm mb-2">Total Level</div>
                            <div className="text-3xl font-bold text-foreground">{totalLevel}</div>
                            <div className="text-sm text-muted-foreground mt-1">Across all skills</div>
                        </div>

                        <div className="bg-card border border-border rounded-lg p-6">
                            <div className="text-muted-foreground text-sm mb-2">Average Level</div>
                            <div className="text-3xl font-bold text-foreground">{averageLevel}</div>
                            <div className="text-sm text-muted-foreground mt-1">Per skill</div>
                        </div>

                        <div className="bg-card border border-border rounded-lg p-6">
                            <div className="text-muted-foreground text-sm mb-2">Highest Skill</div>
                            <div className="text-3xl font-bold text-foreground">
                                {skills.length > 0 ? skills.reduce((max, skill) => skill.level > max.level ? skill : max).name : 'N/A'}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                                Level {skills.length > 0 ? Math.max(...skills.map(s => s.level)) : 0}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {skills.map(skill => (
                            <div key={skill.name} className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                            {React.createElement(skill.icon, { className: "w-6 h-6 text-primary" })}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-foreground">{skill.name}</h3>
                                            <p className="text-sm text-muted-foreground">Level {skill.level}</p>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-sm text-muted-foreground mb-4">{skill.description}</p>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Progress</span>
                                        <span className="text-foreground font-medium">{skill.currentXP} / {skill.maxXP} XP</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2">
                                        <div
                                            className="bg-primary h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${skill.progress}%` }}
                                        />
                                    </div>
                                    <div className="text-xs text-muted-foreground text-right">
                                        {skill.progress}% to next level
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-gradient-to-r from-primary/10 to-chart-2/10 border border-primary/20 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-2">How Skills Work</h3>
                        <p className="text-muted-foreground mb-4">
                            Complete habits and quests to earn XP and level up your skills. Each skill represents
                            a different aspect of personal growth. Higher skill levels unlock new quests and achievements!
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                <span className="text-muted-foreground">Complete daily habits to earn skill XP</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                <span className="text-muted-foreground">Each level requires more XP than the last</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                <span className="text-muted-foreground">Higher levels unlock special rewards</span>
                            </div>
                        </div>
                    </div>
                </PageTransition>
            </main>
        </div>
    );
};

export default SkillsPage;

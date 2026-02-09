import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Navigation from '../components/Navigation';
import StatCard from '../components/StatCard';
import { Target, Brain, Heart, BookOpen, Palette, Users, Sword, Zap } from 'lucide-react';
import { getData, generateKey } from '../lib/storage';
import { runMigrations } from '../lib/migrations';

const SkillsPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
                return;
            }

            const userId = session.user.id;
            setUser(session.user);

            runMigrations(userId);

            const skillsKey = generateKey(userId, 'skills');
            const defaultSkills = [
                { name: 'Focus', currentXP: 0, level: 1 },
                { name: 'Learning', currentXP: 0, level: 1 },
                { name: 'Health', currentXP: 0, level: 1 },
                { name: 'Creativity', currentXP: 0, level: 1 },
                { name: 'Confidence', currentXP: 0, level: 1 },
                { name: 'Social', currentXP: 0, level: 1 }
            ];
            const skillsData = getData(skillsKey, defaultSkills);

            const enrichedSkills = skillsData
                .filter(skill => skill && skill.name)
                .map(skill => {
                    const maxXP = Math.floor(100 * Math.pow(skill.level, 1.5));
                    const progress = maxXP > 0 ? Math.floor((skill.currentXP / maxXP) * 100) : 0;
                    return {
                        ...skill,
                        maxXP,
                        progress,
                        icon: getSkillIcon(skill.name),
                        description: getSkillDescription(skill.name)
                    };
                });

            setSkills(enrichedSkills);
            setLoading(false);
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
    }, [navigate]);

    const getSkillIcon = (skillName) => {
        const iconMap = {
            'Focus': <Target className="w-6 h-6 text-primary" />,
            'Learning': <BookOpen className="w-6 h-6 text-chart-4" />,
            'Health': <Heart className="w-6 h-6 text-chart-1" />,
            'Creativity': <Palette className="w-6 h-6 text-chart-3" />,
            'Confidence': <Zap className="w-6 h-6 text-yellow-500" />,
            'Social': <Users className="w-6 h-6 text-chart-5" />
        };
        return iconMap[skillName] || <Target className="w-6 h-6 text-primary" />;
    };

    const getSkillDescription = (skillName) => {
        const descMap = {
            'Focus': 'Your ability to concentrate and complete tasks without distraction',
            'Learning': 'Knowledge acquisition and continuous self-improvement',
            'Health': 'Physical and mental well-being through healthy habits',
            'Creativity': 'Innovative thinking and creative problem-solving',
            'Confidence': 'Self-assurance and belief in your abilities',
            'Social': 'Building and maintaining meaningful relationships'
        };
        return descMap[skillName] || '';
    };

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

            <main className="flex-1 ml-10 p-8">
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
                                        {skill.icon}
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
            </main>
        </div>
    );
};

export default SkillsPage;

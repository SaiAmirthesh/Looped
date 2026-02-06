import React from 'react';
import Navigation from '../components/Navigation';
import StatCard from '../components/StatCard';
import { Target, Brain, Heart, BookOpen, Palette, Users } from 'lucide-react';

const SkillsPage = () => {
    const skills = [
        {
            name: 'Focus',
            level: 8,
            currentXP: 650,
            maxXP: 1000,
            progress: 65,
            icon: <Target className="w-6 h-6 text-primary" />,
            description: 'Your ability to concentrate and complete tasks without distraction'
        },
        {
            name: 'Discipline',
            level: 6,
            currentXP: 400,
            maxXP: 1000,
            progress: 40,
            icon: <Brain className="w-6 h-6 text-chart-2" />,
            description: 'Consistency in following through with your commitments'
        },
        {
            name: 'Health',
            level: 7,
            currentXP: 550,
            maxXP: 1000,
            progress: 55,
            icon: <Heart className="w-6 h-6 text-chart-1" />,
            description: 'Physical and mental well-being through healthy habits'
        },
        {
            name: 'Learning',
            level: 9,
            currentXP: 800,
            maxXP: 1000,
            progress: 80,
            icon: <BookOpen className="w-6 h-6 text-chart-4" />,
            description: 'Knowledge acquisition and continuous self-improvement'
        },
        {
            name: 'Creativity',
            level: 5,
            currentXP: 300,
            maxXP: 1000,
            progress: 30,
            icon: <Palette className="w-6 h-6 text-chart-3" />,
            description: 'Innovative thinking and creative problem-solving'
        },
        {
            name: 'Social',
            level: 4,
            currentXP: 200,
            maxXP: 1000,
            progress: 20,
            icon: <Users className="w-6 h-6 text-chart-5" />,
            description: 'Building and maintaining meaningful relationships'
        },
    ];

    const totalLevel = skills.reduce((sum, skill) => sum + skill.level, 0);
    const averageLevel = (totalLevel / skills.length).toFixed(1);

    return (
        <div className="flex min-h-screen bg-background">
            <Navigation />

            <main className="flex-1 ml-64 p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Skills</h1>
                    <p className="text-muted-foreground">
                        Level up your skills by completing habits and quests
                    </p>
                </div>

                {/* Overview Stats */}
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
                            {skills.reduce((max, skill) => skill.level > max.level ? skill : max).name}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                            Level {Math.max(...skills.map(s => s.level))}
                        </div>
                    </div>
                </div>

                {/* Skills Grid */}
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

                            {/* Progress Bar */}
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

                {/* Info Card */}
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

import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

const LandingPage = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="text-center max-w-3xl">
                <div className="mb-8">
                    <h1 className="text-6xl font-bold text-foreground mb-4">
                        Looped
                    </h1>
                    <div className="inline-block">
                        <Logo size={256} showText={false} />
                    </div>
                </div>

                <p className="text-2xl text-foreground mb-4">
                    Build lasting habits through consistency and gamified progress
                </p>
                <p className="text-muted-foreground mb-12 max-w-2xl mx-auto text-lg">
                    Transform your daily routines into an RPG adventure. Track habits, complete quests,
                    level up your skills, and watch yourself grow.
                </p>

                <div className="flex gap-4 justify-center">
                    <Link to="/login">
                        <button className="bg-primary text-primary-foreground px-8 py-3 rounded-md font-medium text-lg hover:bg-primary/90 transition-colors">
                            Login
                        </button>
                    </Link>
                    <Link to="/register">
                        <button className="bg-secondary text-secondary-foreground px-8 py-3 rounded-md font-medium text-lg hover:bg-secondary/90 transition-colors border border-border">
                            Register
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;

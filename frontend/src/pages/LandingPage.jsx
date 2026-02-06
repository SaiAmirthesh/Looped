import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="text-center max-w-3xl">
                <div className="mb-8">
                    <h1 className="text-6xl font-bold text-foreground mb-4">
                        Looped
                    </h1>
                    <div className="inline-block">
                        <svg className="w-20 h-20 mx-auto mb-6" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M25 50C25 36.193 36.193 25 50 25C63.807 25 75 36.193 75 50"
                                stroke="oklch(0.5054 0.1905 27.5181)"
                                strokeWidth="8"
                                strokeLinecap="round"
                            />
                            <path
                                d="M75 50C75 63.807 63.807 75 50 75C36.193 75 25 63.807 25 50"
                                stroke="oklch(0.4732 0.1247 46.2007)"
                                strokeWidth="8"
                                strokeLinecap="round"
                            />
                            <circle cx="25" cy="50" r="6" fill="oklch(0.5054 0.1905 27.5181)" />
                            <circle cx="75" cy="50" r="6" fill="oklch(0.4732 0.1247 46.2007)" />
                        </svg>
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

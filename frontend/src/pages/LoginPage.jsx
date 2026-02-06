import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import ninjaImage from '../assets/ninja.jpg';

const LoginPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // Successfully logged in
            navigate('/dashboard');
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-background">
            {/* Left Side - Form */}
            <div className="flex-1 flex items-center justify-center px-8 py-12">
                <div className="w-full max-w-md">
                    <div className="backdrop-blur-sm bg-card/30 border border-border/50 rounded-xl p-8 shadow-2xl">
                        <div className="mb-8">
                            <h1 className="text-4xl font-bold text-foreground mb-2">Welcome Back</h1>
                            <p className="text-muted-foreground text-lg">Login to continue your journey</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg">
                                <p className="text-destructive text-sm">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-card border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                                    placeholder="your@email.com"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-card border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                                    placeholder="••••••••"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-semibold text-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Logging in...' : 'Login'}
                            </button>
                        </form>

                        <p className="text-center text-muted-foreground mt-8">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-primary hover:underline font-semibold">
                                Register
                            </Link>
                        </p>

                    </div>
                </div>
            </div>

            {/* Right Side - Background Image with Overlay */}
            <div
                className="hidden lg:flex flex-1 items-center justify-center border-l border-border relative overflow-hidden"
                style={{
                    backgroundImage: `url(${ninjaImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            >
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/80 to-primary/20"></div>

                {/* Content */}
                <div className="relative z-10 max-w-lg p-12 text-center">
                    <h2 className="text-3xl font-bold text-foreground mb-4 drop-shadow-lg">
                        Level Up Your Productivity
                    </h2>
                    <p className="text-lg text-foreground/90 leading-relaxed">
                        Track habits, complete quests, and become a productivity ninja!
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;

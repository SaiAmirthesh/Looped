import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import ninjaImage from '../assets/ninja.jpg';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        // Validate passwords match
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Validate password length
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) throw error;

            // Successfully registered
            setSuccess(true);

            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/login');
            }, 2000);
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
                            <h1 className="text-4xl font-bold text-foreground mb-2">Create Account</h1>
                            <p className="text-muted-foreground text-lg">Start your productivity journey</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg">
                                <p className="text-destructive text-sm">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="mb-6 p-4 bg-green-500/10 border border-green-500 rounded-lg">
                                <p className="text-green-500 text-sm">
                                    Account created successfully! Check your email to verify your account. Redirecting to login...
                                </p>
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
                                    disabled={loading || success}
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
                                    disabled={loading || success}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-card border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                                    placeholder="••••••••"
                                    required
                                    disabled={loading || success}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || success}
                                className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-semibold text-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Creating Account...' : 'Register'}
                            </button>
                        </form>

                        <p className="text-center text-muted-foreground mt-8">
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary hover:underline font-semibold">
                                Login
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
                <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/80 to-chart-2/20"></div>

                {/* Content */}
                <div className="relative z-10 max-w-lg p-12 text-center">
                    <h2 className="text-3xl font-bold text-foreground mb-4 drop-shadow-lg">
                        Join the Productivity Revolution
                    </h2>
                    <p className="text-lg text-foreground/90 leading-relaxed">
                        Transform your habits into achievements with gamified tracking!
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Target, Zap, Trophy, Calendar, BarChart3, Clock, Github, Twitter, Mail, ArrowRight } from 'lucide-react';
import Logo from '../components/Logo';

const LandingPage = () => {
    return (
        <div className="bg-background text-foreground min-h-screen">
            {/* HEADER */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Logo size={48} showText={false}/>
                        <span className="text-xl font-semibold">Looped</span>
                    </div>

                    <nav className="flex gap-4">
                        <Link
                            to="/login"
                            className="px-4 py-2 rounded-md text-sm hover:bg-muted transition"
                        >
                            Login
                        </Link>
                        <Link
                            to="/register"
                            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90 transition"
                        >
                            Get Started
                        </Link>
                    </nav>
                </div>
            </header>

            {/* HERO */}
            <section className="max-w-7xl mx-auto px-6 py-24">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6">
                        <Zap className="w-4 h-4 text-primary" />
                        <span className="text-sm text-primary font-medium">Level Up Your Life</span>
                    </div>

                    <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                        Turn Your Daily Habits <br />
                        Into an <span className="text-primary">Epic Quest</span>
                    </h1>

                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
                        Build habits, complete quests, earn XP, and level up your skills.
                        Transform productivity into a game you'll actually want to play.
                    </p>

                    <div className="flex justify-center gap-4 flex-wrap">
                        <Link
                            to="/register"
                            className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition inline-flex items-center gap-2"
                        >
                            Start Your Journey
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <a
                            href="#features"
                            className="px-8 py-3 rounded-lg border border-border hover:bg-muted transition"
                        >
                            Explore Features
                        </a>
                    </div>
                </motion.div>
            </section>

            {/* FEATURES */}
            <section id="features" className="bg-card border-y border-border py-24">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl font-bold mb-4">
                            Everything You Need to <span className="text-primary">Stay Consistent</span>
                        </h2>
                        <p className="text-muted-foreground text-lg">
                            Gamified productivity tools designed to keep you motivated
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-background border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
                            >
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="max-w-7xl mx-auto px-6 py-24">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl font-bold mb-4">How It Works</h2>
                    <p className="text-muted-foreground text-lg">Simple steps to start your journey</p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-12">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.title}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.2 }}
                            className="text-center"
                        >
                            <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                {index + 1}
                            </div>
                            <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                            <p className="text-muted-foreground">{step.description}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* TESTIMONIALS */}
            <section className="bg-card border-y border-border py-24">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl font-bold mb-4">What Players Say</h2>
                        <p className="text-muted-foreground text-lg">Real stories from our community</p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <motion.div
                                key={testimonial.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-background border border-border rounded-xl p-6"
                            >
                                <div className="flex items-center gap-1 mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <span key={i} className="text-primary">★</span>
                                    ))}
                                </div>
                                <p className="text-muted-foreground mb-4">"{testimonial.quote}"</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center font-semibold">
                                        {testimonial.name[0]}
                                    </div>
                                    <div>
                                        <div className="font-semibold">{testimonial.name}</div>
                                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="max-w-7xl mx-auto px-6 py-24">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="bg-gradient-to-r from-primary/10 to-chart-2/10 border border-primary/20 rounded-2xl p-12 text-center"
                >
                    <h2 className="text-4xl font-bold mb-4">Ready to Level Up?</h2>
                    <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                        Join thousands of players who are turning their goals into achievements.
                        Start your journey today, completely free.
                    </p>
                    <Link
                        to="/register"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold text-lg hover:opacity-90 transition"
                    >
                        Create Free Account
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </motion.div>
            </section>

            {/* CONTACT */}
            <section className="bg-card border-t border-border py-16">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-2 gap-12">
                        <div>
                            <h3 className="text-2xl font-bold mb-4">Get in Touch</h3>
                            <p className="text-muted-foreground mb-6">
                                Have questions or feedback? We'd love to hear from you!
                            </p>
                            <div className="space-y-4">
                                <a href="mailto:hello@looped.app" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition">
                                    <Mail className="w-5 h-5" />
                                    hello@looped.app
                                </a>
                                <a href="https://twitter.com/loopedapp" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition">
                                    <Twitter className="w-5 h-5" />
                                    @loopedapp
                                </a>
                                <a href="https://github.com/looped" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition">
                                    <Github className="w-5 h-5" />
                                    github.com/looped
                                </a>
                            </div>
                        </div>

                        <div>
                            <form className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Email</label>
                                    <input
                                        type="email"
                                        placeholder="your@email.com"
                                        className="w-full px-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Message</label>
                                    <textarea
                                        rows={4}
                                        placeholder="Tell us what you think..."
                                        className="w-full px-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition"
                                >
                                    Send Message
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="border-t border-border py-8">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Logo size={48} showText={true}/>
                        </div>

                        <div className="flex gap-6 text-sm text-muted-foreground">
                            <a href="#" className="hover:text-foreground transition">Privacy</a>
                            <a href="#" className="hover:text-foreground transition">Terms</a>
                            <a href="#" className="hover:text-foreground transition">Support</a>
                        </div>

                        <div className="text-sm text-muted-foreground">
                            © {new Date().getFullYear()} Looped. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const features = [
    {
        title: "Habit Tracking",
        description: "Build daily habits with streak tracking and visual progress indicators.",
        icon: <Target className="w-6 h-6 text-primary" />
    },
    {
        title: "Quest System",
        description: "Complete challenges and earn XP rewards for achieving your goals.",
        icon: <Trophy className="w-6 h-6 text-primary" />
    },
    {
        title: "Skill Progression",
        description: "Level up across multiple skill categories as you grow.",
        icon: <BarChart3 className="w-6 h-6 text-primary" />
    },
    {
        title: "Focus Sessions",
        description: "Pomodoro timer to help you stay focused and productive.",
        icon: <Clock className="w-6 h-6 text-primary" />
    },
    {
        title: "Calendar View",
        description: "Track your progress over time with visual calendar insights.",
        icon: <Calendar className="w-6 h-6 text-primary" />
    },
    {
        title: "XP & Levels",
        description: "Earn experience points and level up as you stay consistent.",
        icon: <Zap className="w-6 h-6 text-primary" />
    }
];

const steps = [
    {
        title: "Create Habits",
        description: "Set up daily habits you want to build and track."
    },
    {
        title: "Complete Quests",
        description: "Finish tasks and challenges to earn XP and rewards."
    },
    {
        title: "Level Up",
        description: "Watch your skills grow and unlock new achievements."
    }
];

const testimonials = [
    {
        name: "Alex Chen",
        role: "Software Developer",
        quote: "Looped turned my chaotic routine into a fun game. I've never been this consistent!"
    },
    {
        name: "Sarah Miller",
        role: "Student",
        quote: "The XP system keeps me motivated. It's like playing an RPG but for real life goals."
    },
    {
        name: "James Wilson",
        role: "Entrepreneur",
        quote: "Best productivity app I've used. The gamification actually works!"
    }
];

export default LandingPage;

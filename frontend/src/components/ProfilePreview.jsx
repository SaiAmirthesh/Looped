import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Trophy, Flame, Target, Zap } from 'lucide-react';
import XPBar from './XPBar';

const ProfilePreview = ({ profile, user, stats, isOpen }) => {
  if (!profile || !user) return null;

  const avatarUrl = profile?.avatar_url ?? null;
  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Adventurer';
  const level = profile?.level ?? 1;
  const currentXP = profile?.current_xp ?? 0;
  const maxXP = profile?.next_level_xp ?? 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, x: -10 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.9, x: -10 }}
          className="absolute left-full ml-4 bottom-0 w-80 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] overflow-hidden border border-border"
          style={{ 
            backgroundColor: 'var(--card)',
            isolation: 'isolate' 
          }}
        >
          {/* Opaque Background Layer */}
          <div className="absolute inset-0 bg-card opacity-100 -z-10" />

          {/* Premium Header */}
          <div className="p-6 pb-4 relative overflow-hidden">
            <div className="flex items-center gap-4 relative z-10">
              <div className="relative">
                <div className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-primary/20 shadow-lg">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                      <User className="w-8 h-8 text-primary" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-card shadow-md">
                  LVL {level}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-foreground text-xl leading-tight truncate">{displayName}</h3>
                <p className="text-xs text-muted-foreground truncate opacity-70">{user.email}</p>
              </div>
            </div>
            
            {/* Subtle Gradient Glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          </div>

          <div className="px-6 pb-6 space-y-6">
            {/* XP Progress Block */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Experience</span>
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{currentXP} / {maxXP} XP</span>
              </div>
              <XPBar currentXP={currentXP} maxXP={maxXP} level={level} />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-xl p-3 border border-border/50 flex flex-col items-center text-center">
                <Flame className="w-4 h-4 text-orange-500 mb-1" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Streak</span>
                <div className="text-base font-black text-foreground">{stats?.bestStreak || 0}d</div>
              </div>
              <div className="bg-muted/50 rounded-xl p-3 border border-border/50 flex flex-col items-center text-center">
                <Target className="w-4 h-4 text-reward mb-1" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Habits</span>
                <div className="text-base font-black text-foreground">{stats?.habitsCount || 0}</div>
              </div>
            </div>

            {/* Total XP Footer */}
            <div className="bg-primary/5 rounded-xl p-3 border border-primary/20 flex items-center justify-between overflow-hidden relative">
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">Lifetime Earned</div>
                  <div className="text-sm font-black text-primary">{(profile?.total_xp || 0).toLocaleString()} XP</div>
                </div>
              </div>
              <Zap className="w-12 h-12 text-primary/10 absolute -right-2 -bottom-2 rotate-12" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProfilePreview;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import * as db from '../lib/database';
import Navigation from '../components/Navigation';
import { useUserProfile } from '../context/UserProfileContext';
import { Trophy, Crown, Medal, User, Zap } from 'lucide-react';

// ── helpers ───────────────────────────────────────────────────────────────────

const nextLevelXp = (level) => Math.floor(100 * Math.pow(level ?? 1, 1.5));

const RankIcon = ({ rank }) => {
    if (rank === 1) return <Crown className="w-4 h-4" style={{ color: '#F59E0B' }} />;
    if (rank === 2) return <Medal className="w-4 h-4" style={{ color: '#94A3B8' }} />;
    if (rank === 3) return <Medal className="w-4 h-4" style={{ color: '#CD7F32' }} />;
    return <span className="text-sm font-bold text-muted-foreground w-4 text-center">{rank}</span>;
};

const rankColor = (rank) => {
    if (rank === 1) return '#F59E0B';
    if (rank === 2) return '#94A3B8';
    if (rank === 3) return '#CD7F32';
    return null;
};

function AvatarCell({ url, name, size = 36 }) {
    return (
        <div
            className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
            style={{ width: size, height: size, background: 'var(--primary)' }}
        >
            {url ? (
                <img src={url} alt={name} className="w-full h-full object-cover" />
            ) : (
                <User style={{ width: size * 0.45, height: size * 0.45, color: 'var(--primary-foreground)' }} />
            )}
        </div>
    );
}

function MiniXPBar({ current, max }) {
    const pct = Math.min(Math.round((current / Math.max(max, 1)) * 100), 100);
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: 'var(--accent)' }}
                />
            </div>
            <span className="text-[10px] text-muted-foreground w-7 text-right flex-shrink-0">{pct}%</span>
        </div>
    );
}

function TableRow({ player, isMe, index }) {
    const maxXP = nextLevelXp(player.level);
    const color = rankColor(player.rank);
    const isTop3 = player.rank <= 3;

    return (
        <motion.tr
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.25 }}
            style={{
                background: isMe
                    ? 'rgba(80, 54, 255, 0.07)'
                    : isTop3
                        ? `${color}10`
                        : 'transparent',
                borderLeft: isMe ? '3px solid var(--primary)' : isTop3 ? `3px solid ${color}` : '3px solid transparent',
            }}
        >
            {/* Rank */}
            <td className="py-3 md:py-3.5 pl-3 md:pl-5 pr-2 md:pr-3 w-10 md:w-12">
                <div className="flex items-center justify-center">
                    <RankIcon rank={player.rank} />
                </div>
            </td>

            {/* Player */}
            <td className="py-3 md:py-3.5 pr-2 md:pr-4">
                <div className="flex items-center gap-2 md:gap-3">
                    <AvatarCell url={player.avatar_url} name={player.display_name} size={window.innerWidth < 768 ? 28 : 36} />
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5 md:gap-2">
                            <span className="text-xs md:text-sm font-semibold text-foreground truncate max-w-[80px] md:max-w-none">
                                {player.display_name}
                            </span>
                            {isMe && (
                                <span
                                    className="text-[8px] md:text-[10px] font-extrabold px-1 py-0.5 rounded-full flex-shrink-0"
                                    style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                                >
                                    YOU
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </td>

            {/* Level */}
            <td className="py-3 md:py-3.5 pr-2 md:pr-4 w-16 md:w-20">
                <span
                    className="text-[10px] md:text-xs font-bold px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-md md:rounded-lg"
                    style={{
                        background: isTop3 ? `${color}20` : 'var(--muted)',
                        color: isTop3 ? color : 'var(--muted-foreground)',
                    }}
                >
                    Lv {player.level}
                </span>
            </td>

            {/* XP Progress */}
            <td className="py-3.5 pr-4 w-48 hidden md:table-cell">
                <MiniXPBar current={player.current_xp} max={maxXP} />
                <p className="text-[10px] text-muted-foreground mt-0.5">
                    {player.current_xp.toLocaleString()} / {maxXP.toLocaleString()} XP
                </p>
            </td>

            {/* Total XP */}
            <td className="py-3 md:py-3.5 pr-3 md:pr-5 w-24 md:w-32 text-right">
                <div
                    className="flex items-center justify-end gap-1 font-bold text-xs md:text-sm"
                    style={{ color: isTop3 ? color : 'var(--accent)' }}
                >
                    <Zap className="w-3 h-3 md:w-3.5 md:h-3.5" />
                    {player.total_xp.toLocaleString()}
                </div>
            </td>
        </motion.tr>
    );
}

// ── Real stepped podium ────────────────────────────────────────────────────

// Platform heights (px) for each rank
const STEP_H = { 1: 100, 2: 70, 3: 50 };
const STEP_COLOR = {
    1: { platform: '#B8860B', shine: '#F59E0B', text: '#FFF8E7', ring: '#F59E0B' },
    2: { platform: '#6B7280', shine: '#94A3B8', text: '#F1F5F9', ring: '#94A3B8' },
    3: { platform: '#8B5E3C', shine: '#CD7F32', text: '#FDF4EC', ring: '#CD7F32' },
};
const RANK_LABEL = { 1: '1ST', 2: '2ND', 3: '3RD' };
const RANK_ICON_MAP = { 1: Crown, 2: Medal, 3: Medal };

function PodiumSlot({ player, isMe }) {
    if (!player) return <div className="flex-1" />;
    const c = STEP_COLOR[player.rank];
    const h = STEP_H[player.rank];
    const Icon = RANK_ICON_MAP[player.rank];

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: player.rank * 0.12, duration: 0.45, ease: 'easeOut' }}
            className="flex flex-col items-center flex-1"
            style={{ maxWidth: window.innerWidth < 768 ? 120 : 180 }}
        >
            {/* ── Floating info above platform ── */}
            <div className="flex flex-col items-center gap-1.5 md:gap-2 mb-3 ">
                {/* Avatar */}
                <div className="relative">
                    <div
                        className="rounded-full overflow-hidden flex items-center justify-center"
                        style={{
                            width: player.rank === 1 ? (window.innerWidth < 768 ? 56 : 72) : (window.innerWidth < 768 ? 44 : 60),
                            height: player.rank === 1 ? (window.innerWidth < 768 ? 56 : 72) : (window.innerWidth < 768 ? 44 : 60),
                            background: 'var(--card)',
                            boxShadow: `0 0 0 2px ${c.ring}, 0 4px 12px rgba(0,0,0,0.25)`,
                        }}
                    >
                        {player.avatar_url
                            ? <img src={player.avatar_url} alt={player.display_name} className="w-full h-full object-cover" />
                            : <User style={{ width: player.rank === 1 ? 24 : 18, height: player.rank === 1 ? 24 : 18, color: 'var(--muted-foreground)' }} />
                        }
                    </div>
                    {/* Crown / medal badge */}
                    <div
                        className="absolute -top-1.5 -right-1.5 rounded-full flex items-center justify-center"
                        style={{ width: 16, height: 16, background: c.shine, boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
                    >
                        <Icon style={{ width: 9, height: 9, color: '#fff' }} />
                    </div>
                    {isMe && (
                        <div
                            className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-bold px-1.5 rounded-full whitespace-nowrap"
                            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                        >
                            YOU
                        </div>
                    )}
                </div>

                {/* Name */}
                <div className="text-center px-0.5">
                    <p className="text-[10px] md:text-sm font-bold text-foreground leading-tight truncate max-w-[80px] md:max-w-[140px]">
                        {player.display_name}
                    </p>
                    <p className="text-[9px] md:text-xs text-muted-foreground mt-0.5 font-medium">
                        Lv {player.level}
                    </p>
                </div>
            </div>

            {/* ── Platform block ── */}
            <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: player.rank * 0.12 + 0.2, duration: 0.4, ease: 'easeOut' }}
                style={{
                    width: '100%',
                    height: window.innerWidth < 768 ? h * 0.7 : h,
                    background: `linear-gradient(160deg, ${c.shine}cc, ${c.platform})`,
                    borderRadius: '8px 8px 0 0',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    transformOrigin: 'bottom',
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1), 0 -1px 8px rgba(0,0,0,0.15)`,
                }}
            >
                <span style={{ fontSize: window.innerWidth < 768 ? 18 : 28, fontWeight: 900, color: c.text, letterSpacing: 1, lineHeight: 1 }}>
                    {RANK_LABEL[player.rank]}
                </span>
                <span style={{ fontSize: window.innerWidth < 768 ? 8 : 10, fontWeight: 600, color: `${c.text}99`, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    Rank
                </span>
            </motion.div>
        </motion.div>
    );
}

function SkeletonRows() {
    return (
        <>
            {Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                    <td className="py-3.5 pl-5 pr-3"><div className="w-6 h-6 rounded-full bg-muted mx-auto" /></td>
                    <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-muted flex-shrink-0" />
                            <div className="h-3 w-28 rounded bg-muted" />
                        </div>
                    </td>
                    <td className="py-3.5 pr-4"><div className="h-5 w-12 rounded-lg bg-muted" /></td>
                    <td className="py-3.5 pr-4 hidden md:table-cell"><div className="h-2 w-full rounded bg-muted" /></td>
                    <td className="py-3.5 pr-5"><div className="h-3 w-16 rounded bg-muted ml-auto" /></td>
                </tr>
            ))}
        </>
    );
}

// ── main page ─────────────────────────────────────────────────────────────────

const LeaderboardPage = () => {
    const navigate = useNavigate();
    const { user } = useUserProfile() ?? {};
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { navigate('/login'); return; }
            const data = await db.getLeaderboard(100);
            setPlayers(data);
            setLoading(false);
        };
        init();
    }, [navigate]);

    const myRank = players.find(p => p.id === user?.id)?.rank ?? null;

    return (
        <div className="flex min-h-screen bg-background">
            <Navigation />
            <main className="flex-1 overflow-y-auto pb-20 md:pb-0">

                {/* ── Header ── */}
                <div
                    className="sticky top-0 z-10 flex items-center justify-between px-4 md:px-8 py-3 md:py-4 border-b border-border"
                    style={{ backgroundColor: 'var(--background)' }}
                >
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2 truncate">
                            <Trophy className="w-5 h-5 md:w-6 md:h-6 text-yellow-500" />
                            Leaderboard
                        </h1>
                        <p className="hidden md:block text-sm text-muted-foreground">All adventurers ranked by total XP</p>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                        {myRank && (
                            <div
                                className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold px-2.5 md:px-3 py-1.5 rounded-lg border bg-primary/5"
                                style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                            >
                                <Trophy className="w-3 md:w-3.5 h-3 md:h-3.5" />
                                <span className="uppercase tracking-wider">#{myRank}</span>
                            </div>
                        )}
                        <span className="text-[10px] md:text-xs text-muted-foreground bg-muted px-2.5 md:px-3 py-1.5 rounded-lg font-semibold uppercase tracking-widest">
                            {players.length} Users
                        </span>
                    </div>
                </div>

                <div className="px-4 py-6 md:p-8 space-y-6 md:space-y-8">

                    {/* ── Podium ── */}
                    {!loading && players.length >= 1 && (() => {
                        const top3 = players.slice(0, 3);
                        // Visual order: 2nd (left) · 1st (centre) · 3rd (right)
                        const order = [top3[1], top3[0], top3[2]];
                        return (
                            <section className="flex flex-col items-center overflow-hidden">
                                <h2 className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-8 md:mb-10 text-center">
                                    Top Adventurers
                                </h2>
                                {/* Platform stage — fixed width, centred */}
                                <div
                                    className="flex items-end justify-center gap-0 w-full"
                                    style={{
                                        maxWidth: window.innerWidth < 768 ? '100%' : 480,
                                        borderBottom: '4px solid var(--border)',
                                        paddingBottom: 0,
                                    }}
                                >
                                    {order.map((p, i) => (
                                        <PodiumSlot key={p?.id ?? i} player={p} isMe={p?.id === user?.id} />
                                    ))}
                                </div>
                            </section>
                        );
                    })()}

                    {/* ── Table ── */}
                    <div className="rounded-xl border border-border overflow-hidden shadow-sm" style={{ background: 'var(--card)' }}>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr
                                        className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border"
                                        style={{ background: 'var(--muted)' }}
                                    >
                                        <th className="py-3 pl-3 md:pl-5 pr-2 md:pr-3 text-center w-10 md:w-12">#</th>
                                        <th className="py-3 pr-2 md:pr-4 text-left">User</th>
                                        <th className="py-3 pr-2 md:pr-4 text-left w-16 md:w-20">Lvl</th>
                                        <th className="py-3 pr-4 text-left w-48 hidden md:table-cell">XP Progress</th>
                                        <th className="py-3 pr-3 md:pr-5 text-right w-24 md:w-32">Total XP</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {loading ? (
                                        <SkeletonRows />
                                    ) : players.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-16 md:py-20 text-center px-4">
                                                <Trophy className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground/30 mx-auto mb-3" />
                                                <p className="text-foreground font-bold mb-1">No players yet</p>
                                                <p className="text-xs md:text-sm text-muted-foreground">Complete habits and quests to appear here!</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        players.map((p, i) => (
                                            <TableRow
                                                key={p.id}
                                                player={p}
                                                isMe={p.id === user?.id}
                                                index={i}
                                            />
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ── "You" callout if not in list ── */}
                    {!loading && user && myRank === null && (
                        <div
                            className="mt-4 text-center py-4 px-4 rounded-xl border border-dashed text-xs md:text-sm text-muted-foreground font-medium"
                            style={{ borderColor: 'var(--border)' }}
                        >
                            You're not on the board yet — earn XP to climb the ranks! 🚀
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default LeaderboardPage;

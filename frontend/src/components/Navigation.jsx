import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useRef } from "react";
import Logo from "./Logo";
import { supabase } from "../lib/supabaseClient";
import { useUserProfile } from "../context/UserProfileContext";
import {
  LayoutDashboard,
  CheckSquare,
  Sword,
  Zap,
  Timer,
  CalendarDays,
  User,
  Camera,
  Loader2,
  Trophy,
  Upload,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import ProfilePreview from "./ProfilePreview";
import * as db from "../lib/database";
import { useEffect } from "react";

const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Habits", path: "/habits", icon: CheckSquare },
  { name: "Quests", path: "/quests", icon: Sword },
  { name: "Skills", path: "/skills", icon: Zap },
  { name: "Focus", path: "/focus", icon: Timer },
  { name: "Calendar", path: "/calendar", icon: CalendarDays },
  { name: "Leaderboard", path: "/leaderboard", icon: Trophy },
  { name: "Profile", path: "/profile", icon: User },
];

export default function Navigation() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [stats, setStats] = useState({ habitsCount: 0, bestStreak: 0 });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const { user, profile, updateAvatarUrl } = useUserProfile() ?? {};
  const avatarUrl = profile?.avatar_url ?? null;
  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Adventurer";
  const email = user?.email || "";

  useEffect(() => {
    if (user?.id) {
      db.getHabits(user.id).then(habits => {
        const bestStreak = habits.reduce((max, h) => Math.max(max, h.longest_streak ?? h.streak ?? 0), 0);
        setStats({ habitsCount: habits.length, bestStreak });
      });
    }
  }, [user?.id]);

  const handleAvatarClick = () => {
    setPreviewUrl(avatarUrl);
    setShowUploadModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { alert("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { alert("Image must be under 5MB."); return; }
    
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setSelectedFile(file);
  };

  const confirmUpload = async () => {
    if (!selectedFile || !user) return;
    setUploading(true);
    try {
      const filePath = `${user.id}/avatar`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, selectedFile, { upsert: true, contentType: selectedFile.type });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const urlWithBust = `${publicUrl}?t=${Date.now()}`;
      const { error: dbError } = await supabase.from("user_profiles").update({ avatar_url: urlWithBust }).eq("id", user.id);
      if (dbError) console.warn("Could not save avatar URL:", dbError.message);
      updateAvatarUrl?.(urlWithBust);
      setShowUploadModal(false);
      setPreviewUrl(null);
      setSelectedFile(null);
    } catch (err) {
      console.error("Avatar upload failed:", err);
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const cancelUpload = () => {
    setShowUploadModal(false);
    setPreviewUrl(null);
    setSelectedFile(null);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex h-screen w-64 border-r px-4 py-6 flex-col sticky top-0"
        style={{ backgroundColor: "var(--sidebar)", borderColor: "var(--sidebar-border)" }}
      >
        <div className="mb-8 px-2">
          <Logo size={40} />
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all relative overflow-hidden ${isActive
                    ? "text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:text-sidebar-primary-foreground"
                  }`
                }
                style={({ isActive }) => ({
                  backgroundColor: isActive ? "var(--sidebar-primary)" : "transparent",
                })}
              >
                {({ isActive }) => (
                  <>
                    {!isActive && (
                      <motion.span
                        className="absolute inset-0 rounded-lg"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        style={{ backgroundColor: "var(--sidebar-primary)" }}
                      />
                    )}
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-pill"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full"
                        style={{ backgroundColor: "var(--primary-foreground)" }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Icon className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {user && (
          <div className="mt-4 pt-4 border-t border-sidebar-border relative">
            <div
              className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
              onClick={() => navigate("/profile")}
              onMouseEnter={() => setShowPreview(true)}
              onMouseLeave={() => setShowPreview(false)}
            >
              <div className="relative flex-shrink-0">
                <div
                  className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-primary/30 group-hover:ring-primary/60 relative"
                  onClick={(e) => { e.stopPropagation(); handleAvatarClick(); }}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center"
                  onClick={(e) => { e.stopPropagation(); handleAvatarClick(); }}
                >
                  {uploading ? <Loader2 className="w-2.5 h-2.5 text-primary-foreground animate-spin" /> : <Camera className="w-2.5 h-2.5 text-primary-foreground" />}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-sidebar-foreground truncate leading-tight">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate leading-tight">{email}</p>
              </div>
            </div>

            <ProfilePreview 
              profile={profile} 
              user={user} 
              stats={stats} 
              isOpen={showPreview} 
            />
          </div>
        )}
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t z-50 flex items-center justify-around px-2"
        style={{ backgroundColor: "var(--sidebar)", borderColor: "var(--sidebar-border)" }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          // Only show key icons on mobile to avoid crowding, or all with small labels
          // Let's show all with small labels for now
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 gap-1 py-1 rounded-lg transition-all ${isActive ? "text-sidebar-primary" : "text-muted-foreground"}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 ${isActive ? "text-sidebar-primary" : ""}`} />
                  <span className="text-[10px] font-medium">{item.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="mobile-nav-active"
                      className="absolute bottom-0 w-8 h-1 bg-sidebar-primary rounded-t-full"
                    />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {/* Image Preview Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={cancelUpload}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-20"
            >
              <div className="p-6 text-center">
                <h3 className="text-xl font-black text-foreground mb-1">
                  {selectedFile ? 'Preview New Avatar' : 'Update Avatar'}
                </h3>
                <p className="text-xs text-muted-foreground mb-6">
                  {selectedFile ? 'Looking good!' : 'Click upload to select an image'}
                </p>

                <div className="relative w-48 h-48 mx-auto mb-8">
                  <div className="w-full h-full rounded-full overflow-hidden ring-4 ring-primary/30 shadow-2xl bg-muted shrink-0">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-20 h-20 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {!selectedFile ? (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-black hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Image
                    </button>
                  ) : (
                    <button
                      onClick={confirmUpload}
                      disabled={uploading}
                      className="w-full px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-black hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                      {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Confirm
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={cancelUpload}
                    disabled={uploading}
                    className="w-full px-4 py-2.5 rounded-xl border border-border text-foreground text-sm font-bold hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}


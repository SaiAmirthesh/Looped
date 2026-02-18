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
} from "lucide-react";

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

  const { user, profile, updateAvatarUrl } = useUserProfile() ?? {};
  const avatarUrl = profile?.avatar_url ?? null;
  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Adventurer";
  const email = user?.email || "";

  const handleAvatarClick = () => {
    if (!uploading) fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { alert("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { alert("Image must be under 5MB."); return; }
    setUploading(true);
    try {
      const filePath = `${user.id}/avatar`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const urlWithBust = `${publicUrl}?t=${Date.now()}`;
      const { error: dbError } = await supabase.from("user_profiles").update({ avatar_url: urlWithBust }).eq("id", user.id);
      if (dbError) console.warn("Could not save avatar URL:", dbError.message);
      updateAvatarUrl?.(urlWithBust);
    } catch (err) {
      console.error("Avatar upload failed:", err);
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
          <div className="mt-4 pt-4 border-t border-sidebar-border">
            <div
              className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
              onClick={() => navigate("/profile")}
            >
              <div className="relative flex-shrink-0">
                <div
                  className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-primary/30 group-hover:ring-primary/60"
                  onClick={(e) => { e.stopPropagation(); handleAvatarClick(); }}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
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
    </>
  );
}


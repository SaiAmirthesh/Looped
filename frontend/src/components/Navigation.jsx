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
} from "lucide-react";

const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Habits", path: "/habits", icon: CheckSquare },
  { name: "Quests", path: "/quests", icon: Sword },
  { name: "Skills", path: "/skills", icon: Zap },
  { name: "Focus", path: "/focus", icon: Timer },
  { name: "Calendar", path: "/calendar", icon: CalendarDays },
  { name: "Profile", path: "/profile", icon: User },
];

export default function Navigation() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  // Read from context — no local fetch, no re-mount side effects
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
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const urlWithBust = `${publicUrl}?t=${Date.now()}`;

      const { error: dbError } = await supabase
        .from("user_profiles")
        .update({ avatar_url: urlWithBust })
        .eq("id", user.id);

      if (dbError) console.warn("Could not save avatar URL:", dbError.message);

      // Update context so all consumers see the new avatar instantly
      updateAvatarUrl?.(urlWithBust);
    } catch (err) {
      console.error("Avatar upload failed:", err);
      const msg = err?.message || err?.error_description || JSON.stringify(err);
      alert(`Upload failed: ${msg}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <aside
      className="h-screen w-64 border-r px-4 py-6 flex flex-col sticky top-0"
      style={{ backgroundColor: "var(--sidebar)", borderColor: "var(--sidebar-border)" }}
    >
      {/* Logo */}
      <div className="mb-8 px-2">
        <Logo size={40} />
      </div>

      {/* Nav Links */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all relative overflow-hidden ${
                    isActive
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
                        transition={{ duration: 0.15 }}
                        style={{ backgroundColor: "var(--sidebar-primary)", opacity: 0 }}
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
                    <motion.span
                      className="relative z-10"
                      whileHover={{ rotate: [0, -8, 8, 0] }}
                      transition={{ duration: 0.35 }}
                    >
                      <Icon className="w-5 h-5" />
                    </motion.span>
                    <span className="relative z-10">{item.name}</span>
                  </>
                )}
              </NavLink>
            </div>
          );
        })}
      </nav>

      {/* ── User Card (bottom) ── */}
      {user && (
        <div
          className="mt-4 pt-4 border-t"
          style={{ borderColor: "var(--sidebar-border)" }}
        >
          <div
            className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
            onClick={() => navigate("/profile")}
            title="Go to Profile"
          >
            {/* Avatar with upload overlay */}
            <div className="relative flex-shrink-0">
              <div
                className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-primary/30 group-hover:ring-primary/60 transition-all cursor-pointer"
                onClick={(e) => { e.stopPropagation(); handleAvatarClick(); }}
                title="Click to change photo"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                )}
              </div>

              {/* Camera badge */}
              <div
                className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                onClick={(e) => { e.stopPropagation(); handleAvatarClick(); }}
                title="Upload photo"
              >
                {uploading ? (
                  <Loader2 className="w-2.5 h-2.5 text-primary-foreground animate-spin" />
                ) : (
                  <Camera className="w-2.5 h-2.5 text-primary-foreground" />
                )}
              </div>
            </div>

            {/* Name + email */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate leading-tight">
                {displayName}
              </p>
              <p className="text-xs text-muted-foreground truncate leading-tight">
                {email}
              </p>
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}
    </aside>
  );
}

import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import Logo from "./Logo";
import {
  LayoutDashboard,
  Target,
  Sword,
  Brain,
  Timer,
  Calendar,
  User,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Habits", path: "/habits", icon: Target },
  { name: "Quests", path: "/quests", icon: Sword },
  { name: "Skills", path: "/skills", icon: Brain },
  { name: "Focus", path: "/focus", icon: Timer },
  { name: "Calendar", path: "/calendar", icon: Calendar },
  { name: "Profile", path: "/profile", icon: User },
];

export default function Navigation() {
  return (
    <aside
      className="fixed left-0 top-0 h-screen w-64 border-r px-4 py-6 flex flex-col z-50"
      style={{
        backgroundColor: "var(--sidebar)",
        borderColor: "var(--sidebar-border)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8 px-2"
      >
        <Logo size={40} />
      </motion.div>

      <nav className="flex flex-col gap-1">
        {navItems.map((item, i) => (
          <NavLink key={item.path} to={item.path}>
            {({ isActive }) => (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                whileHover={{ x: 4, transition: { duration: 0.15 } }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${isActive
                  ? "text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  }`}
                style={{
                  backgroundColor: isActive ? "var(--sidebar-primary)" : "transparent",
                }}
              >
                <item.icon className="w-5 h-5 shrink-0" strokeWidth={2} />
                {item.name}
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

import { NavLink } from "react-router-dom";
import Logo from "./Logo";

export default function Navigation() {
  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: "🏠" },
    { name: "Habits", path: "/habits", icon: "✅" },
    { name: "Quests", path: "/quests", icon: "🎯" },
    { name: "Skills", path: "/skills", icon: "📊" },
    { name: "Focus", path: "/focus", icon: "⏱️" },
    { name: "Calendar", path: "/calendar", icon: "📅" },
    { name: "Profile", path: "/profile", icon: "👤" },
  ];

  return (
    <aside className="h-screen w-64 border-r px-4 py-6 transition-colors" style={{ backgroundColor: "var(--sidebar)", borderColor: "var(--sidebar-border)" }}>
      {/* Logo */}
      <div className="mb-8 px-2">
        <Logo size={40} />
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${
                isActive
                  ? "text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:opacity-80"
              }`
            }
            style={({ isActive }) => ({
              backgroundColor: isActive ? "var(--sidebar-primary)" : "transparent",
            })}
          >
            {item.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

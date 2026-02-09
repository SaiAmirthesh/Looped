import { NavLink } from "react-router-dom";
import Logo from "./Logo";

export default function Navigation() {
  const navItems = [
    { name: "Dashboard", path: "/dashboard"},
    { name: "Habits", path: "/habits" },
    { name: "Quests", path: "/quests" },
    { name: "Skills", path: "/skills"},
    { name: "Focus", path: "/focus"},
    { name: "Calendar", path: "/calendar"},
    { name: "Profile", path: "/profile"},
  ];

  return (
    <aside className="h-100vh w-64 border-r px-4 py-6 transition-colors" style={{ backgroundColor: "var(--sidebar)", borderColor: "var(--sidebar-border)" }}>
      <div className="mb-8 px-2">
        <Logo size={40} />
      </div>

      <nav className="flex flex-col gap-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-xl transition-colors
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

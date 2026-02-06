import logo from "../assets/looped-logo.png";

export default function Logo({
  size = 48,
  showText = true,
}) {
  return (
    <div className="flex items-center gap-2 select-none">
      <img
        src={logo}
        alt="Looped logo"
        width={size}
        height={size}
        className="object-contain"
      />

      {showText && (
        <span className="text-xl font-semibold tracking-wide text-foreground">
          Looped
        </span>
      )}
    </div>
  );
}

interface StatusIndicatorProps {
  active: boolean;
  size?: "sm" | "md" | "lg";
}

export function StatusIndicator({ active, size = "md" }: StatusIndicatorProps) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  return (
    <span
      className={`inline-block rounded-full ${sizeClasses[size]} ${
        active ? "led-active" : "led-inactive"
      }`}
      title={active ? "Active" : "Inactive"}
    />
  );
}

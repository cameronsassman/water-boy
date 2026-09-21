export default function Bubble({ className = "" }: { className?: string }) {
    return <div className={`absolute rounded-full border pointer-events-none ${className}`} />;
  }
import { motion } from "motion/react";

export default function Logo({ className = "" }) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      className={`relative flex items-center justify-center overflow-hidden rounded-2xl group ${className}`}
      style={{ background: '#2D5A57' }}
    >
      {/* Shimmer Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

      <svg viewBox="0 0 100 100" className="w-[80%] h-[80%] relative z-10">
        {/* Main White Circle */}
        <motion.circle
          cx="50" cy="50" r="40" fill="white"
          animate={{ r: [40, 41, 40] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Top Dark Shape */}
        <path
          d="M35 30 Q50 20 65 30 L65 35 Q50 25 35 35 Z"
          fill="#2D5A57"
        />

        {/* Two Top Circles */}
        <circle cx="35" cy="35" r="8" fill="#2D5A57" />
        <circle cx="65" cy="35" r="8" fill="#2D5A57" />

        {/* Curved Lines */}
        <motion.path
          d="M20 60 Q50 40 80 60"
          fill="none"
          stroke="#2D5A57"
          strokeWidth="4"
          strokeLinecap="round"
          animate={{ d: ["M20 60 Q50 40 80 60", "M20 62 Q50 42 80 62", "M20 60 Q50 40 80 60"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path
          d="M20 75 Q50 55 80 75"
          fill="none"
          stroke="#2D5A57"
          strokeWidth="4"
          strokeLinecap="round"
          animate={{ d: ["M20 75 Q50 55 80 75", "M20 77 Q50 57 80 77", "M20 75 Q50 55 80 75"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
        />
        <motion.path
          d="M30 85 Q50 70 70 85"
          fill="none"
          stroke="#2D5A57"
          strokeWidth="4"
          strokeLinecap="round"
          animate={{ d: ["M30 85 Q50 70 70 85", "M30 87 Q50 72 70 87", "M30 85 Q50 70 70 85"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
        />
      </svg>
    </motion.div>
  );
}

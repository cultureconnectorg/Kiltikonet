import { motion } from "motion/react";

export default function Background() {
  const sparkles = Array.from({ length: 40 });
  const strands = Array.from({ length: 6 });

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" style={{ background: '#050505' }}>
      {/* Ambient Radial Gradient */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at center, #1a150a 0%, #050505 100%)' }} />

      {/* Starfield / Data Particles */}
      <div className="absolute inset-0">
        {sparkles.map((_, i) => (
          <motion.div
            key={i}
            initial={{
              x: Math.random() * 100 + "%",
              y: Math.random() * 100 + "%",
              opacity: Math.random() * 0.5,
              scale: Math.random() * 0.5 + 0.5
            }}
            animate={{
              opacity: [0.1, 0.6, 0.1],
              scale: [1, 1.2, 1],
              y: ["-2%", "2%", "-2%"],
              x: ["-1%", "1%", "-1%"]
            }}
            transition={{
              duration: 4 + Math.random() * 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 10
            }}
            className="absolute w-0.5 h-0.5 rounded-full"
            style={{ background: '#f2ca50', boxShadow: '0 0 8px #f2ca50' }}
          />
        ))}
      </div>

      {/* Liquid DNA SVG Background */}
      <motion.svg
        viewBox="0 0 800 800"
        className="absolute"
        style={{ width: '200%', height: '200%', top: '-50%', left: '-50%', opacity: 0.25 }}
        animate={{ rotate: [0, 360] }}
        transition={{ rotate: { duration: 240, repeat: Infinity, ease: "linear" } }}
      >
        <defs>
          <linearGradient id="goldGrad" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#f2ca50" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.8" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g filter="url(#glow)">
          {strands.map((_, i) => (
            <motion.path
              key={i}
              d={`M${-100 + i * 50},400 Q${100 + i * 50},${200 + i * 20} ${200 + i * 50},400 T${400 + i * 50},400 T${600 + i * 50},400 T${900 + i * 50},400`}
              fill="none"
              stroke="url(#goldGrad)"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity={0.3 + (i * 0.1)}
              animate={{
                d: [
                  `M${-100 + i * 50},400 Q${100 + i * 50},${200 + i * 20} ${200 + i * 50},400 T${400 + i * 50},400 T${600 + i * 50},400 T${900 + i * 50},400`,
                  `M${-100 + i * 50},400 Q${100 + i * 50},${600 - i * 20} ${200 + i * 50},400 T${400 + i * 50},400 T${600 + i * 50},400 T${900 + i * 50},400`,
                  `M${-100 + i * 50},400 Q${100 + i * 50},${200 + i * 20} ${200 + i * 50},400 T${400 + i * 50},400 T${600 + i * 50},400 T${900 + i * 50},400`,
                ]
              }}
              transition={{
                duration: 15 + i * 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
        </g>
      </motion.svg>

      {/* High-tech Texture Overlay */}
      <div className="absolute inset-0 mix-blend-overlay" style={{ opacity: 0.04, backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }} />

      {/* Scanline Effect */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          opacity: 0.2,
          backgroundImage: 'linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.25) 50%), linear-gradient(90deg, rgba(255,0,0,0.03), rgba(0,255,0,0.01), rgba(0,0,255,0.03))',
          backgroundSize: '100% 4px, 3px 100%'
        }}
      />
    </div>
  );
}

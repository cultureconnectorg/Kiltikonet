import { motion } from "motion/react";

export default function Background() {
  const sparkles = Array.from({ length: 40 });

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" style={{ background: '#050505' }}>
      {/* Ambient Radial Gradient */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at center, #1a150a 0%, #050505 100%)' }} />

      {/* Starfield / Data Particles */}
      <div className="absolute inset-0">
        {sparkles.map((_, i) => {
          const size = 0.5 + Math.random() * 2.5;
          const dur = 2 + Math.random() * 6;
          return (
            <motion.div
              key={i}
              initial={{
                x: Math.random() * 100 + "%",
                y: Math.random() * 100 + "%",
                opacity: Math.random() * 0.5,
                scale: Math.random() * 0.5 + 0.5
              }}
              animate={{
                opacity: [0.1, 0.7, 0.1],
                scale: [1, 1.3, 1],
                y: ["-3%", "3%", "-3%"],
                x: ["-2%", "2%", "-2%"]
              }}
              transition={{
                duration: dur,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 8
              }}
              className="absolute rounded-full"
              style={{ width: size + 'px', height: size + 'px', background: '#f2ca50', boxShadow: `0 0 ${size * 3}px #f2ca50` }}
            />
          );
        })}
      </div>

      {/* Liquid DNA SVG Background — Double Helix */}
      <motion.svg
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
        className="absolute"
        style={{ width: '160%', height: '160%', top: '-30%', left: '-30%' }}
        animate={{ rotate: [0, 360] }}
        transition={{ rotate: { duration: 180, repeat: Infinity, ease: "linear" } }}
      >
        <defs>
          <linearGradient id="omegaGoldGrad" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="1" />
            <stop offset="50%" stopColor="#f2ca50" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Strand pair 1 */}
        <motion.path
          fill="none" stroke="url(#omegaGoldGrad)" strokeWidth="2" strokeLinecap="round" opacity="0.5"
          animate={{
            d: [
              "M0,500 C167,300 333,700 500,500 C667,300 833,700 1000,500",
              "M0,500 C167,700 333,300 500,500 C667,700 833,300 1000,500",
              "M0,500 C167,300 333,700 500,500 C667,300 833,700 1000,500"
            ]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path
          fill="none" stroke="url(#omegaGoldGrad)" strokeWidth="2" strokeLinecap="round" opacity="0.5"
          animate={{
            d: [
              "M0,500 C167,700 333,300 500,500 C667,700 833,300 1000,500",
              "M0,500 C167,300 333,700 500,500 C667,300 833,700 1000,500",
              "M0,500 C167,700 333,300 500,500 C667,700 833,300 1000,500"
            ]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Strand pair 2 — offset */}
        <motion.path
          fill="none" stroke="url(#omegaGoldGrad)" strokeWidth="1.5" strokeLinecap="round" opacity="0.35"
          animate={{
            d: [
              "M-50,450 C150,250 350,650 550,450 C750,250 950,650 1050,450",
              "M-50,450 C150,650 350,250 550,450 C750,650 950,250 1050,450",
              "M-50,450 C150,250 350,650 550,450 C750,250 950,650 1050,450"
            ]
          }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.path
          fill="none" stroke="url(#omegaGoldGrad)" strokeWidth="1.5" strokeLinecap="round" opacity="0.35"
          animate={{
            d: [
              "M-50,550 C150,750 350,350 550,550 C750,750 950,350 1050,550",
              "M-50,550 C150,350 350,750 550,550 C750,350 950,750 1050,550",
              "M-50,550 C150,750 350,350 550,550 C750,750 950,350 1050,550"
            ]
          }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        {/* Strand pair 3 — wider, fainter */}
        <motion.path
          fill="none" stroke="url(#omegaGoldGrad)" strokeWidth="1" strokeLinecap="round" opacity="0.25"
          animate={{
            d: [
              "M-100,400 C100,150 400,650 600,400 C800,150 900,650 1100,400",
              "M-100,400 C100,650 400,150 600,400 C800,650 900,150 1100,400",
              "M-100,400 C100,150 400,650 600,400 C800,150 900,650 1100,400"
            ]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        />
        <motion.path
          fill="none" stroke="url(#omegaGoldGrad)" strokeWidth="1" strokeLinecap="round" opacity="0.25"
          animate={{
            d: [
              "M-100,600 C100,850 400,350 600,600 C800,850 900,350 1100,600",
              "M-100,600 C100,350 400,850 600,600 C800,350 900,850 1100,600",
              "M-100,600 C100,850 400,350 600,600 C800,850 900,350 1100,600"
            ]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        />
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

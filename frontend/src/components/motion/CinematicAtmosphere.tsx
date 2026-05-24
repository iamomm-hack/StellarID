'use client';
export default function CinematicAtmosphere() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[1]" style={{ contain: 'strict' }}>
      {/* Indigo ambient glow — top right */}
      <div className="absolute top-[-30%] right-[-20%] w-[60%] h-[60%] rounded-full opacity-30"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)' }}
      />
      {/* Purple warm glow — bottom left */}
      <div className="absolute bottom-[-30%] left-[-20%] w-[50%] h-[50%] rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.04) 0%, transparent 70%)' }}
      />
    </div>
  );
}
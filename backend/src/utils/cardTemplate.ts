interface CardTemplateData {
  walletAddress: string;
  displayName: string;
  reputationScore: number;
  tier: 'Verified' | 'Proven' | 'Elite Builder';
  credentialCount: number;
  topCredentials: Array<{ name: string; issuer: string; date: string }>;
  badges: string[];
  memberSince: string;
  network: string;
  avatarBase64?: string | null;
}

export function generateCardSvg(data: CardTemplateData): string {
  const truncatedWallet = data.walletAddress.length > 12 
    ? `${data.walletAddress.substring(0, 6)}...${data.walletAddress.substring(data.walletAddress.length - 6)}`
    : data.walletAddress;

  const tierColors = {
    'Verified': { text: '#9ca3af', bg: '#1f2937', stroke: '#374151', glow: '#111827' },
    'Proven': { text: '#60a5fa', bg: '#1e3a8a', stroke: '#2563eb', glow: '#1d4ed8' },
    'Elite Builder': { text: '#a78bfa', bg: '#4c1d95', stroke: '#7c3aed', glow: '#8b5cf6' }
  };

  const colors = tierColors[data.tier] || tierColors['Verified'];

  // Safe formatting for credential names
  const renderCreds = data.topCredentials.slice(0, 3).map((c, i) => {
    const truncatedName = c.name.length > 35 ? `${c.name.substring(0, 32)}...` : c.name;
    const truncatedIssuer = c.issuer.length > 20 ? `${c.issuer.substring(0, 18)}...` : c.issuer;
    const yPos = 310 + i * 55;
    return `
      <g transform="translate(0, ${yPos})">
        <!-- Background pill -->
        <rect width="660" height="42" rx="8" fill="#1e1b4b" fill-opacity="0.3" stroke="#ffffff" stroke-opacity="0.08" stroke-width="1" />
        <!-- Dot indicator -->
        <circle cx="25" cy="21" r="5" fill="${colors.text}" />
        <!-- Name -->
        <text x="45" y="26" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#f3f4f6">${escapeXml(truncatedName)}</text>
        <!-- Issuer -->
        <text x="380" y="26" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="500" fill="#9ca3af">by ${escapeXml(truncatedIssuer)}</text>
        <!-- Date -->
        <text x="580" y="26" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="500" fill="#6b7280">${escapeXml(c.date)}</text>
      </g>
    `;
  }).join('');

  // Render Badges
  const renderBadges = data.badges.slice(0, 4).map((badge, i) => {
    const xPos = 60 + i * 140;
    return `
      <g transform="translate(${xPos}, 505)">
        <rect width="120" height="30" rx="15" fill="#111827" stroke="${colors.stroke}" stroke-opacity="0.4" stroke-width="1" />
        <text x="60" y="19" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="700" fill="#e5e7eb" text-anchor="middle">🏅 ${escapeXml(badge)}</text>
      </g>
    `;
  }).join('');

  return `
    <svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Background definition -->
      <defs>
        <linearGradient id="bg-grad" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#07070a"/>
          <stop offset="60%" stop-color="#0c071a"/>
          <stop offset="100%" stop-color="#1f0f3d"/>
        </linearGradient>
        
        <linearGradient id="score-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#a78bfa"/>
          <stop offset="100%" stop-color="#22d3ee"/>
        </linearGradient>
        
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="15" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        
        <clipPath id="avatar-clip">
          <rect x="60" y="100" width="100" height="100" rx="20" />
        </clipPath>
      </defs>

      <!-- Background card border & fill -->
      <rect width="1200" height="630" fill="url(#bg-grad)" />
      <rect x="15" y="15" width="1170" height="600" rx="20" fill="none" stroke="#7c3aed" stroke-opacity="0.25" stroke-width="2" />
      
      <!-- Subtly decorative cyber grid lines -->
      <path d="M 0,100 L 1200,100" stroke="#ffffff" stroke-opacity="0.03" stroke-width="1" />
      <path d="M 0,200 L 1200,200" stroke="#ffffff" stroke-opacity="0.03" stroke-width="1" />
      <path d="M 0,480 L 1200,480" stroke="#ffffff" stroke-opacity="0.03" stroke-width="1" />
      <path d="M 460,200 L 460,480" stroke="#ffffff" stroke-opacity="0.03" stroke-width="1" />

      <!-- Top Branding -->
      <text x="60" y="60" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="900" fill="#ffffff" letter-spacing="1">STELLAR<tspan fill="#a78bfa">ID</tspan></text>
      <rect x="260" y="42" width="80" height="22" rx="11" fill="#1e1b4b" stroke="#8b5cf6" stroke-opacity="0.4" stroke-width="1" />
      <text x="300" y="57" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="700" fill="#a78bfa" text-anchor="middle">${data.network.toUpperCase()}</text>

      <!-- Left Column: User Profile Info -->
      
      <!-- Avatar Section -->
      <rect x="59" y="99" width="102" height="102" rx="21" fill="none" stroke="${colors.stroke}" stroke-width="2" />

      ${data.avatarBase64 ? `
        <!-- Image -->
        <image
          href="${data.avatarBase64}"
          x="60"
          y="100"
          width="100"
          height="100"
          clip-path="url(#avatar-clip)"
          preserveAspectRatio="xMidYMid slice"
        />
      ` : `
        <!-- Avatar Fallback -->
        <rect x="60" y="100" width="100" height="100" rx="20" fill="#7c3aed" fill-opacity="0.15" />
        <text x="110" y="162" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="700" fill="#f3f4f6" text-anchor="middle">
          ${escapeXml(data.displayName.substring(0, 1).toUpperCase())}
        </text>
      `}

      <!-- Verified Badge Icon Overlay -->
      <g transform="translate(144, 184)">
        <circle cx="8" cy="8" r="10" fill="#07070a" stroke="#ffffff" stroke-opacity="0.1" stroke-width="1" />
        <path d="M 5,8 L 7,10 L 11,6" stroke="#a78bfa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      </g>

      <text x="180" y="145" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="800" fill="#ffffff">${escapeXml(data.displayName)}</text>
      <text x="180" y="170" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" fill="#9ca3af" letter-spacing="0.5">${truncatedWallet}</text>
      
      <!-- Tier Badge -->
      <g transform="translate(180, 185)">
        <rect width="130" height="28" rx="6" fill="${colors.bg}" stroke="${colors.stroke}" stroke-width="1.5" />
        <text x="65" y="18" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="800" fill="${colors.text}" text-anchor="middle" letter-spacing="1">
          ${escapeXml(data.tier.toUpperCase())}
        </text>
      </g>

      <!-- Stats Area (Left Bottom) -->
      
      <!-- Reputation Score Box -->
      <g transform="translate(60, 260)">
        <rect width="165" height="190" rx="12" fill="#111827" fill-opacity="0.4" stroke="#ffffff" stroke-opacity="0.05" stroke-width="1" />
        <text x="82.5" y="40" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="700" fill="#9ca3af" letter-spacing="0.5" text-anchor="middle">REPUTATION SCORE</text>
        <text x="82.5" y="125" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="900" fill="#a78bfa" text-anchor="middle">${data.reputationScore}</text>
      </g>

      <!-- Credentials Box -->
      <g transform="translate(235, 260)">
        <rect width="165" height="190" rx="12" fill="#111827" fill-opacity="0.4" stroke="#ffffff" stroke-opacity="0.05" stroke-width="1" />
        <text x="82.5" y="40" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="700" fill="#9ca3af" letter-spacing="0.5" text-anchor="middle">CREDENTIALS</text>
        <text x="82.5" y="125" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="800" fill="#ffffff" text-anchor="middle">${data.credentialCount}</text>
      </g>

      <!-- Right Column: Achievements / Verified Credentials -->
      <text x="460" y="245" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="800" fill="#ffffff" letter-spacing="1">VERIFIED ACHIEVEMENTS</text>
      <line x1="460" y1="260" x2="1120" y2="260" stroke="#ffffff" stroke-opacity="0.1" stroke-width="1" />
      
      <!-- Top Credentials list -->
      <g transform="translate(460, 0)">
        ${renderCreds || `
          <g transform="translate(0, 310)">
            <rect width="660" height="150" rx="8" fill="#1e1b4b" fill-opacity="0.15" stroke="#ffffff" stroke-opacity="0.05" stroke-width="1" />
            <text x="330" y="80" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#6b7280" text-anchor="middle">No credentials claimed yet.</text>
          </g>
        `}
      </g>

      <!-- Badges Showcase Section -->
      <text x="60" y="495" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="800" fill="#ffffff" letter-spacing="1">BADGES COLLECTED</text>
      ${renderBadges}

      <!-- Bottom Branding Watermark -->
      <g transform="translate(1000, 560)">
        <text x="-50" y="12" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="#6b7280" opacity="0.6">Powered by</text>
        <!-- Custom Stellar Spark graphic -->
        <path d="M 30,5 L 36,-1 L 32,7 L 40,8 L 32,9 L 36,17 L 30,11 L 24,17 L 28,9 L 20,8 L 28,7 L 24,-1 Z" fill="#7c3aed" opacity="0.8" />
        <text x="48" y="12" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="900" fill="#ffffff" opacity="0.8">Stellar<tspan fill="#a78bfa">ID</tspan></text>
      </g>

      <!-- Member Since Date -->
      <text x="60" y="572" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" fill="#6b7280" opacity="0.8">Member since ${escapeXml(data.memberSince)}</text>
    </svg>
  `;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

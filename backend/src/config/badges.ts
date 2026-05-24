export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'achievement' | 'reputation' | 'streak' | 'ecosystem';
  check: (stats: BadgeStats) => boolean;
}

export interface BadgeStats {
  total_credentials: number;
  tier: string;
  has_stellar_credential: boolean;
  has_win_credential: boolean;
  streak_days: number;
  github_verified: boolean;
  join_order: number;
}

export const BADGE_DEFINITIONS: Badge[] = [
  {
    id: 'first_credential',
    name: 'First Step',
    description: 'Earned your first verified credential',
    icon: '🏅',
    category: 'achievement',
    check: (stats) => stats.total_credentials >= 1,
  },
  {
    id: 'collector',
    name: 'Collector',
    description: 'Earned 10 or more credentials',
    icon: '🏆',
    category: 'achievement',
    check: (stats) => stats.total_credentials >= 10,
  },
  {
    id: 'elite_builder',
    name: 'Elite Builder',
    description: 'Reached the Elite Builder reputation tier',
    icon: '⚡',
    category: 'reputation',
    check: (stats) => stats.tier === 'Elite Builder',
  },
  {
    id: 'stellar_contributor',
    name: 'Stellar Contributor',
    description: 'Contributed to Stellar open-source projects',
    icon: '🌟',
    category: 'ecosystem',
    check: (stats) => stats.has_stellar_credential,
  },
  {
    id: 'hackathon_winner',
    name: 'Hackathon Winner',
    description: 'Won a prize in a Stellar ecosystem hackathon',
    icon: '🥇',
    category: 'ecosystem',
    check: (stats) => stats.has_win_credential,
  },
  {
    id: 'consistent_builder',
    name: 'Consistent Builder',
    description: 'Maintained a 30-day activity streak',
    icon: '🔥',
    category: 'streak',
    check: (stats) => stats.streak_days >= 30,
  },
  {
    id: 'open_source_dev',
    name: 'Open Source Dev',
    description: 'Connected a verified GitHub account to StellarID',
    icon: '💻',
    category: 'ecosystem',
    check: (stats) => stats.github_verified,
  },
  {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'Joined StellarID in the first 100 users',
    icon: '🚀',
    category: 'achievement',
    check: (stats) => stats.join_order <= 100,
  },
];

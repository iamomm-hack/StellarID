import ProfileClient from './ProfileClient';

interface ProfilePageProps {
  params: {
    wallet: string;
  };
}

export async function generateMetadata({ params }: ProfilePageProps) {
  const { wallet } = params;
  const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5555';
  const ogImageUrl = `${backendUrl}/api/v1/profile/${wallet}/og-image`;
  const truncatedWallet = wallet.length > 12 ? `${wallet.slice(0, 6)}...${wallet.slice(-6)}` : wallet;

  return {
    title: `StellarID Builder Profile - ${truncatedWallet}`,
    description: `Check out this developer's verified identity credentials, badges, and reputation score on StellarID.`,
    openGraph: {
      title: `StellarID Builder Profile - ${truncatedWallet}`,
      description: `Check out this developer's verified identity credentials, badges, and reputation score on StellarID.`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${truncatedWallet} StellarID Card`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `StellarID Builder Profile - ${truncatedWallet}`,
      description: `Check out this developer's verified identity credentials, badges, and reputation score on StellarID.`,
      images: [ogImageUrl],
    },
  };
}

export default function ProfilePage({ params }: ProfilePageProps) {
  return <ProfileClient wallet={params.wallet} />;
}

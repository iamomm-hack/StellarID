import ClaimClient from './ClaimClient';

export default function ClaimPage({ params }: { params: { token: string } }) {
  return <ClaimClient token={params.token} />;
}

import { TransportScreen } from '../TransportScreen';
import { useAppState } from './_layout';
export default function TransportRoute() {
  const { t, transportListing } = useAppState();
  return <TransportScreen key={transportListing?.id || 'manual'} t={t} listing={transportListing} />;
}

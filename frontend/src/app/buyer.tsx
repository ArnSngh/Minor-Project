import { BuyerScreen } from '../BuyerScreen';
import { useAppState } from './_layout';
export default function BuyerRoute() {
  const { t, version, openTransport } = useAppState();
  return <BuyerScreen t={t} version={version} onTransport={openTransport} />;
}

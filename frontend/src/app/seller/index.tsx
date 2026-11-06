import { useAppState } from '../_layout';
import { SellerDashboard } from '../../seller/SellerDashboard';
export default function SellerHomeRoute() {
  const { t } = useAppState();
  return <SellerDashboard t={t} />;
}
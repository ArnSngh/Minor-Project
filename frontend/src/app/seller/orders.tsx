import { useAppState } from '../_layout';
import { SellerOrders } from '../../seller/SellerOrders';
export default function SellerOrdersRoute() {
  const { t } = useAppState();
  return <SellerOrders t={t} />;
}
import { useAppState } from '../_layout';
import { SellerInventory } from '../../seller/SellerInventory';
export default function SellerInventoryRoute() {
  const { t } = useAppState();
  return <SellerInventory t={t} />;
}
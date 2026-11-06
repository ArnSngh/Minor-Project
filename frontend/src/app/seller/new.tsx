import { useAppState } from '../_layout';
import { SellerListingForm } from '../../seller/SellerListingForm';
export default function SellerNewRoute() {
  const { t } = useAppState();
  return <SellerListingForm t={t} />;
}
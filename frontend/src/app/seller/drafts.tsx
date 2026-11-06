import { useAppState } from '../_layout';
import { SellerDrafts } from '../../seller/SellerDrafts';
export default function SellerDraftsRoute() {
  const { t } = useAppState();
  return <SellerDrafts t={t} />;
}
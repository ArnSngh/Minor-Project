import { SellerScreen } from '../SellerScreen';
import { useAppState } from './_layout';
export default function SellerRoute() {
  const { t, published } = useAppState();
  return <SellerScreen t={t} onPublished={published} />;
}

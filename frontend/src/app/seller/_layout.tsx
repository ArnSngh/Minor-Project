import { Slot } from 'expo-router';
import { useAppState } from '../_layout';
import { SellerProvider } from '../../seller/SellerProvider';
import { SellerShell } from '../../seller/SellerShell';

export default function SellerLayout() {
  const { published } = useAppState();
  return <SellerProvider onPublished={published}><SellerShell><Slot /></SellerShell></SellerProvider>;
}
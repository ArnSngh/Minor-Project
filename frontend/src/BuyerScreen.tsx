import React, { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { API, createRequest, displayError, getListings, setRequestStatus } from './api';
import type { Key } from './i18n';
import type { Listing, OrderRequest } from './types';
import { Button, Field, Num, s, showAlert } from './ui';

type Props = { t: (key: Key) => string; version: number; onTransport: (listing: Listing) => void };
export function BuyerScreen({ t, version, onTransport }: Props) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Listing | null>(null);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [request, setRequest] = useState<OrderRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const refresh = async () => { try { setListings(await getListings(q)); } catch { showAlert(t('error')); } };
  const loadError = t('error');
  useEffect(() => {
    let active = true;
    getListings().then(items => { if (active) setListings(items); })
      .catch(() => { if (active) showAlert(loadError); });
    return () => { active = false; };
  }, [version, loadError]);
  const send = async () => {
    if (!selected || !buyerName.trim() || !/^\+?[0-9]{10,15}$/.test(buyerPhone) || !Number.isFinite(quantity) || quantity <= 0) { showAlert(t('invalid')); return; }
    setBusy(true);
    try { setRequest(await createRequest({ listingId: selected.id, buyerName, buyerPhone, quantity })); }
    catch (e) { showAlert(t('error'), displayError(e, t)); }
    finally { setBusy(false); }
  };
  const refreshRequest = async () => {
    if (!request) return;
    try { const response = await fetch(`${API}/api/requests/${request.id}`); if (!response.ok) throw new Error(); setRequest(await response.json()); }
    catch { showAlert(t('error')); }
  };
  const withdraw = async () => { if (!request) return; try { setRequest(await setRequestStatus(request.id, { action: 'withdraw' })); } catch (e) { showAlert(t('error'), displayError(e, t)); } };
  return <View>
    <Text style={s.heading}>{t('products')}</Text>
    <Field label={t('search')} value={q} onChangeText={setQ} /><Button label={t('search')} onPress={refresh} />
    {listings.length === 0 && <Text>{t('noProducts')}</Text>}
    {listings.map(l => <View style={s.card} key={l.id}>
      {l.imageUrl && <Image source={{ uri: `${API}${l.imageUrl}` }} style={s.photo} />}
      <Text style={s.cardTitle}>{l.title}</Text><Text>{l.village} · {l.availableQuantity} {l.unit} · ₹{l.unitPriceRupees}/{l.unit}</Text>
      <Text>{l.description}</Text>
      <Button label={t('order')} onPress={() => { setSelected(l); setQuantity(1); }} secondary />
      <Button label={t('transport')} onPress={() => onTransport(l)} secondary />
    </View>)}
    {selected && <View style={s.card}><Text style={s.cardTitle}>{t('order')}: {selected.title}</Text>
      <Field label={t('buyerName')} value={buyerName} onChangeText={setBuyerName} />
      <Field label={t('phone')} value={buyerPhone} onChangeText={setBuyerPhone} />
      <Num label={t('amount')} value={quantity} onChange={setQuantity} />
      <Text>{t('total')}: ₹{Number.isFinite(quantity) ? quantity * selected.unitPriceRupees : 0}</Text>
      <Button label={t('order')} onPress={send} disabled={busy} />
    </View>}
    {request && <View style={s.card}>
      <Text style={s.cardTitle}>{t('requestSent')} · {t(request.status as Key)}</Text>
      <Text>{t('sellerContact')}: {request.sellerPhone}</Text>
      <Button label={t('refresh')} onPress={refreshRequest} secondary />
      {request.status === 'pending' && <Button label={t('withdraw')} onPress={withdraw} secondary />}
    </View>}
  </View>;
}

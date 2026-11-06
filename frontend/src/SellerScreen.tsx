import React, { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { displayError, getSellerRequests, publishDraft, setRequestStatus } from './api';
import { loadDrafts, putDraft, removeDraft } from './draftStore';
import { deletePhoto, photoPreview, savePhoto } from './photoStore';
import type { Key } from './i18n';
import type { Draft, ListingInput, OrderRequest } from './types';
import { Button, Field, Num, s, showAlert } from './ui';

type Props = { t: (key: Key) => string; onPublished: () => void };
const id = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const fresh = (): ListingInput => ({ title: '', category: 'produce', description: '', quantity: 1, unit: 'kg', unitPriceRupees: 80, estimatedWeightKgPerUnit: 1, packageLengthCmPerUnit: 30, packageWidthCmPerUnit: 30, packageHeightCmPerUnit: 30, village: 'Kondagaon', pickupLocation: { lat: 19.5939, lng: 81.6689 } });

function LocalPhoto({ refId }: { refId: string }) {
  const [uri, setUri] = useState<string>();
  useEffect(() => { photoPreview(refId).then(setUri).catch(() => setUri(undefined)); }, [refId]);
  return uri ? <Image source={{ uri }} style={s.photo} /> : null;
}
function RequestCard({ request: r, t, changed }: { request: OrderRequest; t: Props['t']; changed: () => void }) {
  const [qty, setQty] = useState(r.quantity);
  const [unitPrice, setUnitPrice] = useState(r.requestedUnitPriceRupees);
  const [total, setTotal] = useState(r.quantity * r.requestedUnitPriceRupees);
  const act = async (action: 'accept' | 'decline') => {
    try { await setRequestStatus(r.id, { action, exactQuantity: qty, unitPriceRupees: unitPrice, totalPriceRupees: total }); changed(); }
    catch (e) { showAlert(t('error'), displayError(e, t)); }
  };
  return <View style={s.card}>
    <Text style={s.cardTitle}>{r.buyerName} · {r.quantity} {r.unit}</Text>
    <Text>{t(r.status as Key)} · ₹{r.requestedUnitPriceRupees}/{r.unit}</Text>
    <Text>{t('buyerContact')}: {r.buyerPhone}</Text>
    {r.status === 'pending' && <>
      <Text>{t('sellerTerms')}</Text>
      <Num label={t('exactQty')} value={qty} onChange={v => { setQty(v); setTotal(v * unitPrice); }} />
      <Num label={t('price')} value={unitPrice} onChange={v => { setUnitPrice(v); setTotal(qty * v); }} />
      <Num label={t('total')} value={total} onChange={setTotal} />
      <Button label={t('accept')} onPress={() => act('accept')} />
      <Button label={t('decline')} onPress={() => act('decline')} secondary />
    </>}
  </View>;
}

export function SellerScreen({ t, onPublished }: Props) {
  const [form, setForm] = useState<ListingInput>(fresh);
  const [photoRef, setPhotoRef] = useState('');
  const [photoMime, setPhotoMime] = useState('image/jpeg');
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [requests, setRequests] = useState<OrderRequest[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const refreshDrafts = async () => setDrafts(await loadDrafts());
  const refreshRequests = async () => { try { setRequests(await getSellerRequests()); } catch { setMessage(t('error')); } };
  const loadError = t('error');
  useEffect(() => {
    let active = true;
    loadDrafts().then(items => { if (active) setDrafts(items); })
      .catch(() => { if (active) setMessage(loadError); });
    getSellerRequests().then(items => { if (active) setRequests(items); })
      .catch(() => { if (active) setMessage(loadError); });
    return () => { active = false; };
  }, [loadError]);
  const update = <K extends keyof ListingInput>(key: K, value: ListingInput[K]) => setForm(p => ({ ...p, [key]: value }));

  const pick = async (camera: boolean) => {
    try {
      const result = camera ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 }) : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 4_000_000) { showAlert(t('invalid'), t('photoTooLarge')); return; }
      setPhotoRef(await savePhoto(asset, id())); setPhotoMime(asset.mimeType || 'image/jpeg');
    } catch (e) { showAlert(t('error'), displayError(e, t)); }
  };
  const save = async () => {
    if (!form.title.trim() || !photoRef || ![form.quantity, form.unitPriceRupees, form.estimatedWeightKgPerUnit, form.packageLengthCmPerUnit, form.packageWidthCmPerUnit, form.packageHeightCmPerUnit].every(n => Number.isFinite(n) && n > 0)) { showAlert(t('invalid'), photoRef ? t('invalid') : t('noPhoto')); return; }
    await putDraft({ localId: id(), clientPhotoId: id(), photoRef, photoMimeType: photoMime, fields: form, status: 'queued' });
    await refreshDrafts(); setForm(fresh()); setPhotoRef(''); setMessage(t('saved'));
  };
  const sync = async () => {
    setBusy(true); let failed = false; let uploaded = false;
    for (const d of await loadDrafts()) {
      try {
        await putDraft({ ...d, status: 'uploading' });
        await publishDraft(d);
        await removeDraft(d.localId);
        await deletePhoto(d.photoRef);
        uploaded = true;
      } catch (e) {
        failed = true;
        await putDraft({ ...d, status: 'failed', error: e instanceof Error ? e.message : String(e) });
      }
    }
    await refreshDrafts(); if (uploaded) onPublished();
    setMessage(failed ? t('uploadFailed') : uploaded ? t('uploaded') : t('offline'));
    setBusy(false);
  };
  return <View>
    <Text style={s.heading}>{t('listing')}</Text>
    <Field label={t('titleField')} value={form.title} onChangeText={v => update('title', v)} />
    <Text style={s.label}>{t('category')}</Text>
    <View style={s.row}>{(['produce', 'handicraft', 'small_industry'] as const).map(c => <Button key={c} label={t(c === 'produce' ? 'categoryProduce' : c === 'handicraft' ? 'categoryCraft' : 'categoryIndustry')} secondary={form.category !== c} onPress={() => update('category', c)} />)}</View>
    <Field label={t('description')} value={form.description} onChangeText={v => update('description', v)} />
    <Num label={t('quantity')} value={form.quantity} onChange={v => update('quantity', v)} />
    <View style={s.row}><Button label={t('unitKg')} onPress={() => update('unit', 'kg')} secondary={form.unit !== 'kg'} /><Button label={t('unitPiece')} onPress={() => update('unit', 'piece')} secondary={form.unit !== 'piece'} /></View>
    <Num label={t('price')} value={form.unitPriceRupees} onChange={v => update('unitPriceRupees', v)} />
    <Num label={t('weight')} value={form.estimatedWeightKgPerUnit} onChange={v => update('estimatedWeightKgPerUnit', v)} />
    <Num label={t('length')} value={form.packageLengthCmPerUnit} onChange={v => update('packageLengthCmPerUnit', v)} />
    <Num label={t('width')} value={form.packageWidthCmPerUnit} onChange={v => update('packageWidthCmPerUnit', v)} />
    <Num label={t('height')} value={form.packageHeightCmPerUnit} onChange={v => update('packageHeightCmPerUnit', v)} />
    <Field label={t('village')} value={form.village} onChangeText={v => update('village', v)} />
    <View style={s.row}><Button label={t('takePhoto')} onPress={() => pick(true)} secondary /><Button label={t('choosePhoto')} onPress={() => pick(false)} secondary /></View>
    {photoRef ? <LocalPhoto refId={photoRef} /> : <Text style={s.muted}>{t('noPhoto')}</Text>}
    <Button label={t('saveOffline')} onPress={save} />
    {!!message && <Text>{message}</Text>}
    <Text style={s.heading}>{t('drafts')} ({drafts.length})</Text>
    {drafts.map(d => <View style={s.card} key={d.localId}><Text style={s.cardTitle}>{d.fields.title}</Text><LocalPhoto refId={d.photoRef} /><Text>{d.status === 'failed' ? t('uploadFailed') : t('offline')}</Text></View>)}
    <Button label={t('sync')} onPress={sync} disabled={busy || !drafts.length} />
    <Text style={s.heading}>{t('requests')}</Text><Button label={t('refresh')} onPress={refreshRequests} secondary />
    {requests.length === 0 && <Text>{t('noRequests')}</Text>}
    {requests.map(r => <RequestCard key={r.id} request={r} t={t} changed={() => { refreshRequests(); onPublished(); }} />)}
  </View>;
}

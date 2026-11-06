import React, { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { displayError, getMatches } from './api';
import type { Key } from './i18n';
import type { Listing, Match } from './types';
import { Button, Num, s, showAlert } from './ui';

const places = { Kondagaon: { lat: 19.5939, lng: 81.6689 }, Kanker: { lat: 20.2719, lng: 81.4917 }, Raipur: { lat: 21.2514, lng: 81.6296 }, Jagdalpur: { lat: 19.0741, lng: 82.0080 } };
type Place = keyof typeof places;
export function TransportScreen({ t, listing }: { t: (key: Key) => string; listing: Listing | null }) {
  const [destination, setDestination] = useState<Place>('Raipur');
  const [pickupKm, setPickupKm] = useState(10);
  const [dropKm, setDropKm] = useState(10);
  const [loadKg, setLoadKg] = useState(listing?.estimatedWeightKgPerUnit || 100);
  const [packageCount, setPackageCount] = useState(1);
  const [length, setLength] = useState(listing?.packageLengthCmPerUnit || 80);
  const [width, setWidth] = useState(listing?.packageWidthCmPerUnit || 60);
  const [height, setHeight] = useState(listing?.packageHeightCmPerUnit || 50);
  const [matches, setMatches] = useState<Match[]>([]);
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);
  const search = async () => {
    if (![pickupKm, dropKm, loadKg, packageCount, length, width, height].every(Number.isFinite) || pickupKm < 0 || dropKm < 0 || loadKg <= 0 || packageCount <= 0 || length <= 0 || width <= 0 || height <= 0) { showAlert(t('invalid')); return; }
    setBusy(true); setSearched(false);
    try {
      const result = await getMatches({ origin: listing?.pickupLocation || places.Kondagaon, destination: places[destination], pickupRadiusKm: pickupKm, dropRadiusKm: dropKm, loadKg, packageCount, packageLengthCm: length, packageWidthCm: width, packageHeightCm: height, earliestDepartAt: new Date().toISOString() });
      setMatches(result); setSearched(true);
    } catch (e) { showAlert(t('error'), displayError(e, t)); }
    finally { setBusy(false); }
  };
  return <View>
    <Text style={s.heading}>{t('transport')}</Text>
    <Text>{t('from')}: {listing?.village || 'Kondagaon'}</Text>
    <Text style={s.label}>{t('to')}</Text>
    <View style={s.row}>{(['Raipur', 'Kanker', 'Jagdalpur'] as Place[]).map(p => <Button key={p} label={p} onPress={() => setDestination(p)} secondary={destination !== p} />)}</View>
    <Num label={t('pickupRadius')} value={pickupKm} onChange={setPickupKm} />
    <Num label={t('dropRadius')} value={dropKm} onChange={setDropKm} />
    <Num label={t('load')} value={loadKg} onChange={setLoadKg} />
    <Num label={t('packages')} value={packageCount} onChange={setPackageCount} />
    <Num label={t('length')} value={length} onChange={setLength} />
    <Num label={t('width')} value={width} onChange={setWidth} />
    <Num label={t('height')} value={height} onChange={setHeight} />
    <Button label={t('findTrucks')} onPress={search} disabled={busy} />
    {searched && !matches.length && <Text>{t('noTrucks')}</Text>}
    {matches.map(m => <View style={s.card} key={m.tripId}>
      <Text style={s.cardTitle}>{m.vehicleType} · {m.routeSummary}</Text>
      <Text>{t('departure')}: {m.departAt}</Text><Text>{t('available')}: {m.availableCapacityKg} kg</Text>
      <Text>{m.pickupPoint.name} → {m.dropPoint.name}</Text>
      <Text>{t('roadPickup')}: {m.pickupDistanceKm} km</Text><Text>{t('roadDrop')}: {m.dropDistanceKm} km</Text>
      <Text>{t('potential')}</Text><Text>{m.transporterName}: {m.transporterPhone}</Text>
      <Button label={t('call')} onPress={() => Linking.openURL(`tel:${m.transporterPhone}`)} />
    </View>)}
  </View>;
}

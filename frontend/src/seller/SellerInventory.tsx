import React, { useState } from 'react';
import { router } from 'expo-router';
import { Text, TextInput, View } from 'react-native';
import { useSeller } from './SellerProvider';
import { Action, EmptyState, Money, PageHeader, ProductPhoto, StatusBadge, type Translate } from './SellerUI';
import { st } from './styles';

export function SellerInventory({ t }: { t: Translate }) {
  const { listings, refreshRemote, remoteAvailable } = useSeller();
  const [query, setQuery] = useState('');
  const shown = listings.filter(item => item.title.toLowerCase().includes(query.toLowerCase().trim()));
  return <View>
    <PageHeader kicker={t('sellerHub')} title={t('inventory')} subtitle={t('inventorySubtitle')}
      action={<Action label={t('addProduct')} onPress={() => router.navigate('/seller/new')} />} />
    <View style={st.card}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Text style={st.cardTitle}>{t('activeListings')} ({listings.length})</Text>
        <Action label={t('refresh')} onPress={refreshRemote} secondary />
      </View>
      <TextInput value={query} onChangeText={setQuery} placeholder={t('searchInventory')}
        placeholderTextColor="#94A3B8" style={[st.input, { marginTop: 17, maxWidth: 390 }]} />
      {!remoteAvailable ? <EmptyState title={t('offlineReady')} detail={t('offlineBanner')} glyph="↻" /> :
      shown.length === 0 ? <EmptyState title={query ? t('noSearchResults') : t('noInventory')}
        detail={query ? t('tryAnotherSearch') : t('noInventoryHelp')}
        action={!query && <Action label={t('addProduct')} onPress={() => router.navigate('/seller/new')} secondary />} /> :
      shown.map((item, index) => <View key={item.id} style={[st.listRow, index === shown.length - 1 && { borderBottomWidth: 0 }]}>
        <ProductPhoto remotePath={item.imageUrl} />
        <View style={{ flex: 1, minWidth: 150 }}>
          <Text style={st.listTitle}>{item.title}</Text>
          <Text style={st.listMeta}>{item.village} · {item.category === 'produce' ? t('categoryProduce') : item.category === 'handicraft' ? t('categoryCraft') : t('categoryIndustry')}</Text>
          <Text style={st.listMeta}>{t('stockLabel')}: {item.availableQuantity} {item.unit}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 7 }}>
          <Money value={item.unitPriceRupees} />
          <StatusBadge label={t('statusActive')} />
        </View>
      </View>)}
    </View>
  </View>;
}
import React from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { useSeller } from './SellerProvider';
import { Action, EmptyState, Money, PageHeader, ProductPhoto, StatusBadge, type Translate } from './SellerUI';
import { st } from './styles';

export function SellerDrafts({ t }: { t: Translate }) {
  const { drafts, syncing, syncDrafts, notice } = useSeller();
  return <View>
    <PageHeader kicker={t('sellerHub')} title={t('drafts')} subtitle={t('draftSubtitle')}
      action={<Action label={syncing ? t('syncing') : t('sync')} onPress={syncDrafts} disabled={syncing || drafts.length === 0} />} />
    {notice && <View style={st.notice}><Text style={st.noticeText}>{t(notice)}</Text></View>}
    <View style={st.card}>
      <Text style={st.cardTitle}>{t('pendingUploads')} ({drafts.length})</Text>
      <Text style={[st.cardSub, { marginTop: 5 }]}>{t('offlineHint')}</Text>
      {drafts.length === 0 ? <EmptyState title={t('noDrafts')} detail={t('noDraftsHelp')}
        action={<Action label={t('addProduct')} onPress={() => router.navigate('/seller/new')} secondary />} glyph="▤" /> :
      drafts.map((draft, index) => <View key={draft.localId} style={[st.listRow, index === drafts.length - 1 && { borderBottomWidth: 0 }]}>
        <ProductPhoto localRef={draft.photoRef} />
        <View style={{ flex: 1, minWidth: 160 }}>
          <Text style={st.listTitle}>{draft.fields.title}</Text>
          <Text style={st.listMeta}>{draft.fields.village} · {draft.fields.quantity} {draft.fields.unit}</Text>
          <Text style={st.listMeta}><Money value={draft.fields.unitPriceRupees} /> / {draft.fields.unit}</Text>
        </View>
        <StatusBadge label={draft.status === 'failed' ? t('uploadFailedShort') : t('offline')} amber />
      </View>)}
    </View>
  </View>;
}
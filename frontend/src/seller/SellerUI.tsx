import React, { useEffect, useState } from 'react';
import { Image, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { API } from '../api';
import { photoPreview } from '../photoStore';
import type { Key } from '../i18n';
import { c, st } from './styles';

export type Translate = (key: Key) => string;
export function Action({ label, onPress, secondary, disabled }: { label: string; onPress: () => void; secondary?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled}
    style={[secondary ? st.secondaryButton : st.primaryButton, disabled && { opacity: 0.45 }]}>
    <Text style={secondary ? st.secondaryText : st.primaryText}>{label}</Text>
  </Pressable>;
}
export function PageHeader({ kicker, title, subtitle, action }: { kicker: string; title: string; subtitle: string; action?: React.ReactNode }) {
  return <View style={st.pageHeader}>
    <View style={{ flexShrink: 1 }}><Text style={st.pageKicker}>{kicker}</Text><Text style={st.pageTitle}>{title}</Text><Text style={st.pageSubtitle}>{subtitle}</Text></View>
    {action}
  </View>;
}
export function EmptyState({ title, detail, action, glyph = '◫' }: { title: string; detail: string; action?: React.ReactNode; glyph?: string }) {
  return <View style={st.empty}>
    <Text style={st.emptyGlyph}>{glyph}</Text>
    <Text style={st.emptyTitle}>{title}</Text>
    <Text style={st.emptyText}>{detail}</Text>
    {action}
  </View>;
}
export function StatusBadge({ label, amber }: { label: string; amber?: boolean }) {
  return <View style={[st.status, amber && st.statusAmber]}><Text style={[st.statusText, amber && st.statusAmberText]}>{label}</Text></View>;
}
export function ProductPhoto({ remotePath, localRef, large }: { remotePath?: string | null; localRef?: string; large?: boolean }) {
  const [localUri, setLocalUri] = useState<string>();
  useEffect(() => {
    if (!localRef) return;
    let active = true;
    let objectUrl: string | undefined;
    photoPreview(localRef).then(uri => {
      if (Platform.OS === 'web') objectUrl = uri;
      if (active) setLocalUri(uri);
      else if (objectUrl) URL.revokeObjectURL(objectUrl);
    }).catch(() => {});
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [localRef]);
  const uri = localRef ? localUri : remotePath ? API + remotePath : undefined;
  if (!uri) return <View style={st.thumbPlaceholder}><Text style={st.thumbPlaceholderText}>◫</Text></View>;
  return <Image source={{ uri }} style={{ width: large ? 210 : 66, height: large ? 160 : 66, borderRadius: 8, backgroundColor: c.blueSoft }} />;
}
export function FormField({ label, value, onChange, numeric, multiline, wide }: { label: string; value: string; onChange: (value: string) => void; numeric?: boolean; multiline?: boolean; wide?: boolean }) {
  return <View style={wide ? st.fieldFull : st.field}>
    <Text style={st.label}>{label}</Text>
    <TextInput value={value} onChangeText={onChange} style={[st.input, multiline && { minHeight: 84, textAlignVertical: 'top' }]}
      placeholder={label} placeholderTextColor="#94A3B8" keyboardType={numeric ? 'decimal-pad' : 'default'} multiline={multiline} />
  </View>;
}
export function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <FormField label={label} value={Number.isNaN(value) ? '' : String(value)}
    onChange={raw => onChange(raw === '' ? NaN : Number(raw))} numeric />;
}
export function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} accessibilityRole="button" style={[st.choice, selected && st.choiceActive]}>
    <Text style={[st.choiceText, selected && st.choiceTextActive]}>{label}</Text>
  </Pressable>;
}
export function SectionLink({ title, action, onPress }: { title: string; action: string; onPress: () => void }) {
  return <View style={st.sectionHeader}><Text style={st.sectionTitle}>{title}</Text>
    <Pressable onPress={onPress} accessibilityRole="link"><Text style={st.textLink}>{action} →</Text></Pressable></View>;
}
export function Money({ value }: { value: number }) {
  return <Text style={{ color: c.ink, fontWeight: '800' }}>₹{Number(value).toLocaleString('en-IN')}</Text>;
}
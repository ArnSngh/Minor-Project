import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Draft } from './types';

const KEY = 'marketplace-drafts-v1';
export async function loadDrafts(): Promise<Draft[]> {
  const raw = await AsyncStorage.getItem(KEY);
  try { return raw ? JSON.parse(raw) as Draft[] : []; } catch { return []; }
}
export async function putDraft(draft: Draft) {
  const drafts = await loadDrafts();
  const index = drafts.findIndex(d => d.localId === draft.localId);
  if (index < 0) drafts.push(draft); else drafts[index] = draft;
  await AsyncStorage.setItem(KEY, JSON.stringify(drafts));
}
export async function removeDraft(id: string) {
  await AsyncStorage.setItem(KEY, JSON.stringify((await loadDrafts()).filter(d => d.localId !== id)));
}

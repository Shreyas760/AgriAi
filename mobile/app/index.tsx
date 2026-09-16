import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../lib/api';
import { readCache, saveCache } from '../lib/cache';

type Profile = { name: string; region: string; soilType: string; soilMoisture: string; landSizeAcres: number; language: string };
type Recommendation = { crop: string; confidence: number; why: string[] };
const copy = { en: { save: 'Save profile', weather: 'Get crop advice', scan: 'Scan leaf', title: 'Your farm dashboard' }, hi: { save: 'प्रोफ़ाइल सहेजें', weather: 'फसल सलाह पाएं', scan: 'पत्ता स्कैन करें', title: 'आपका खेत डैशबोर्ड' }, pa: { save: 'ਪ੍ਰੋਫਾਈਲ ਸੇਵ ਕਰੋ', weather: 'ਫਸਲ ਸਲਾਹ ਲਵੋ', scan: 'ਪੱਤਾ ਸਕੈਨ ਕਰੋ', title: 'ਤੁਹਾਡਾ ਖੇਤ ਡੈਸ਼ਬੋਰਡ' } };

export default function Home() {
  const [profile, setProfile] = useState<Profile>({ name: '', region: 'Ludhiana, Punjab', soilType: 'loamy', soilMoisture: 'adequate', landSizeAcres: 2, language: 'en' });
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]); const [alerts, setAlerts] = useState<string[]>([]); const [detection, setDetection] = useState<any>(); const [photo, setPhoto] = useState<string>(); const [loading, setLoading] = useState(false);
  const t = copy[profile.language as keyof typeof copy] || copy.en;
  useEffect(() => { api.profile().then((value) => { setProfile(value); saveCache('profile', value); }).catch(() => { const saved = readCache<Profile>('profile'); if (saved) setProfile(saved); }); }, []);
  const update = (key: keyof Profile, value: string) => setProfile({ ...profile, [key]: key === 'landSizeAcres' ? Number(value) || 0 : value });
  async function save() { try { await api.saveProfile(profile); saveCache('profile', profile); Alert.alert('Saved', 'Your farm profile is saved.'); } catch { saveCache('profile', profile); Alert.alert('Saved offline', 'We will sync this profile when the network returns.'); } }
  async function advise() { setLoading(true); try { const data = await api.recommendations(); setRecommendations(data.recommendations); setAlerts(data.alerts.map((a: any) => a.message)); saveCache('advice', data); } catch { const saved = readCache<any>('advice'); if (saved) { setRecommendations(saved.recommendations); setAlerts(saved.alerts.map((a: any) => a.message)); Alert.alert('Offline advice', 'Showing your last saved recommendations.'); } else Alert.alert('Unavailable', 'Start the backend or connect to the network.'); } finally { setLoading(false); } }
  async function scan() { const permission = await ImagePicker.requestCameraPermissionsAsync(); if (!permission.granted) return Alert.alert('Camera permission needed', 'Allow camera access to scan a leaf.'); const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 }); if (result.canceled) return; const uri = result.assets[0].uri; setPhoto(uri); setLoading(true); try { setDetection(await api.detect(uri)); } catch (error: any) { Alert.alert('Analysis failed', error.message); } finally { setLoading(false); } }
  return <ScrollView contentContainerStyle={styles.page}>
    <Text style={styles.heading}>{t.title}</Text><Text style={styles.subheading}>Localized advisory • disease-aware • offline-ready</Text>
    <View style={styles.card}><Text style={styles.cardTitle}>Farmer onboarding</Text>
      <Field label="Name" value={profile.name} onChangeText={(v) => update('name', v)} /><Field label="Village / region" value={profile.region} onChangeText={(v) => update('region', v)} />
      <Field label="Soil type (e.g. loamy)" value={profile.soilType} onChangeText={(v) => update('soilType', v)} /><Field label="Soil moisture (low / moderate / adequate)" value={profile.soilMoisture} onChangeText={(v) => update('soilMoisture', v)} />
      <Field label="Land size (acres)" value={String(profile.landSizeAcres)} keyboardType="numeric" onChangeText={(v) => update('landSizeAcres', v)} /><Field label="Language: en / hi / pa" value={profile.language} onChangeText={(v) => update('language', v)} />
      <Button title={t.save} color="#176b3a" onPress={save} />
    </View>
    <View style={styles.actions}><Button title={t.weather} color="#176b3a" onPress={advise} /><Button title={t.scan} color="#b66a16" onPress={scan} /></View>{loading && <ActivityIndicator size="large" color="#176b3a" />}
    {alerts.map((item) => <View key={item} style={styles.alert}><Text>⚠ {item}</Text></View>)}
    {recommendations.map((item) => <View key={item.crop} style={styles.card}><Text style={styles.cardTitle}>{item.crop} · {item.confidence}% confidence</Text>{item.why.map((reason) => <Text key={reason} style={styles.reason}>• {reason}</Text>)}</View>)}
    {photo && <Image source={{ uri: photo }} style={styles.photo} />}{detection && <View style={styles.card}><Text style={styles.cardTitle}>{detection.disease} · {detection.confidence}%</Text>{detection.guidance.map((item: string) => <Text key={item} style={styles.reason}>• {item}</Text>)}</View>}
  </ScrollView>;
}
function Field(props: any) { return <View style={styles.field}><Text style={styles.label}>{props.label}</Text><TextInput style={styles.input} {...props} /></View>; }
const styles = StyleSheet.create({ page: { padding: 18, gap: 12, backgroundColor: '#f6faf5' }, heading: { fontSize: 26, fontWeight: '700', color: '#16452b' }, subheading: { color: '#52705d' }, card: { backgroundColor: '#fff', padding: 14, borderRadius: 12, gap: 6, elevation: 1 }, cardTitle: { fontSize: 17, fontWeight: '700', color: '#16452b' }, field: { gap: 3 }, label: { fontSize: 12, color: '#4b6353' }, input: { borderWidth: 1, borderColor: '#d4e1d5', borderRadius: 7, padding: 8, backgroundColor: '#fff' }, actions: { gap: 10 }, alert: { backgroundColor: '#fff4d8', padding: 12, borderRadius: 8 }, reason: { color: '#33483a', lineHeight: 20 }, photo: { height: 180, borderRadius: 10, resizeMode: 'cover' } });

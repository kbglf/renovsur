import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { analyzeQuote, createCheckout, type AnalyzeResponse } from "./src/api";
import { API_URL, COLORS } from "./src/config";

const SAMPLE = `Entreprise Dupont Rénovation
SIRET : 123 456 789 00012
Peinture salon 35m2 — 980 €
Total TTC : 2048 €
Acompte : 45%
Assurance décennale n° DEC-2024-88921`;

type Screen = "home" | "analyze" | "results";

const WORK_TYPES = [
  { value: "peinture", label: "Peinture" },
  { value: "carrelage", label: "Carrelage" },
  { value: "plomberie", label: "Plomberie" },
  { value: "electricite", label: "Électricité" },
  { value: "isolation", label: "Isolation" },
  { value: "autre", label: "Autre" },
];

const REGIONS = [
  { value: "ile-de-france", label: "Île-de-France" },
  { value: "paca", label: "PACA" },
  { value: "auvergne-rhone-alpes", label: "AuRA" },
  { value: "occitanie", label: "Occitanie" },
  { value: "autre", label: "Autre" },
];

function ScoreCircle({ score, label }: { score: number; label: string }) {
  const color =
    score >= 80 ? COLORS.primary : score >= 60 ? COLORS.amber : COLORS.red;

  return (
    <View style={styles.scoreContainer}>
      <View style={[styles.scoreCircle, { borderColor: color }]}>
        <Text style={[styles.scoreNumber, { color }]}>{score}</Text>
        <Text style={styles.scoreMax}>/100</Text>
      </View>
      <Text style={[styles.scoreLabel, { color }]}>{label}</Text>
    </View>
  );
}

function AlertBadge({ severity }: { severity: string }) {
  const bg =
    severity === "critical"
      ? "#fef2f2"
      : severity === "warning"
        ? "#fffbeb"
        : "#eff6ff";
  const color =
    severity === "critical"
      ? COLORS.red
      : severity === "warning"
        ? COLORS.amber
        : "#2563eb";

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>
        {severity === "critical" ? "Critique" : severity === "warning" ? "Attention" : "Info"}
      </Text>
    </View>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [loading, setLoading] = useState(false);
  const [quoteText, setQuoteText] = useState("");
  const [workType, setWorkType] = useState("autre");
  const [region, setRegion] = useState("autre");
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  async function handleAnalyze() {
    if (quoteText.trim().length < 50) {
      Alert.alert("Devis trop court", "Collez au minimum 50 caractères.");
      return;
    }

    setLoading(true);
    try {
      const data = await analyzeQuote({ quoteText, workType, region });
      setResult(data);
      setScreen("results");
    } catch (e) {
      const err = e as Error & { reportId?: string };
      if (err.message === "DUPLICATE" && err.reportId) {
        Linking.openURL(`${API_URL}/resultats/${err.reportId}`);
        return;
      }
      Alert.alert(
        "Erreur",
        err instanceof Error
          ? `${err.message}\n\nVérifiez que le serveur web tourne sur ${API_URL}`
          : "Erreur inconnue",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleUnlock(planId: "complete" | "negotiation") {
    if (!result) return;
    try {
      const data = await createCheckout(result.id, planId);
      if (data.url) {
        Linking.openURL(data.url);
      } else if (data.demo) {
        Linking.openURL(`${API_URL}/resultats/${result.id}?unlocked=${planId}`);
      }
    } catch {
      Alert.alert("Erreur", "Impossible de lancer le paiement.");
    }
  }

  if (screen === "home") {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.homeContent}>
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoIconText}>✓</Text>
            </View>
            <Text style={styles.logoText}>
              Rénov<Text style={{ color: COLORS.primary }}>Sûr</Text>
            </Text>
          </View>

          <Text style={styles.heroTitle}>
            Ne signez plus un devis qui vous coûte cher
          </Text>
          <Text style={styles.heroSub}>
            Analyse anti-arnaque · Conformité légale · Prix régionaux
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>1 850€</Text>
              <Text style={styles.statLabel}>économie moyenne</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>30 sec</Text>
              <Text style={styles.statLabel}>analyse gratuite</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => setScreen("analyze")}
          >
            <Text style={styles.primaryBtnText}>Analyser mon devis</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => Linking.openURL(`${API_URL}/tarifs`)}
          >
            <Text style={styles.secondaryBtnText}>Voir les tarifs</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryBtn, { marginTop: 8 }]}
            onPress={() => Linking.openURL(`${API_URL}/faq`)}
          >
            <Text style={styles.secondaryBtnText}>FAQ</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (screen === "analyze") {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.formContent}>
          <TouchableOpacity onPress={() => setScreen("home")}>
            <Text style={styles.backLink}>← Retour</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={styles.formTitle}>Collez votre devis</Text>
            <TouchableOpacity onPress={() => setQuoteText(SAMPLE)}>
              <Text style={{ color: COLORS.primary, fontWeight: "600", fontSize: 13 }}>Exemple</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.textarea}
            multiline
            numberOfLines={10}
            placeholder="Copiez le texte de votre devis ici…"
            placeholderTextColor={COLORS.textMuted}
            value={quoteText}
            onChangeText={setQuoteText}
            textAlignVertical="top"
          />

          <Text style={styles.fieldLabel}>Type de travaux</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
            {WORK_TYPES.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[styles.chip, workType === t.value && styles.chipActive]}
                onPress={() => setWorkType(t.value)}
              >
                <Text style={[styles.chipText, workType === t.value && styles.chipTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.fieldLabel}>Région</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
            {REGIONS.map((r) => (
              <TouchableOpacity
                key={r.value}
                style={[styles.chip, region === r.value && styles.chipActive]}
                onPress={() => setRegion(r.value)}
              >
                <Text style={[styles.chipText, region === r.value && styles.chipTextActive]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={handleAnalyze}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.primaryBtnText}>Analyser — gratuit</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.formContent}>
        <TouchableOpacity onPress={() => setScreen("analyze")}>
          <Text style={styles.backLink}>← Nouvelle analyse</Text>
        </TouchableOpacity>

        {result && (
          <>
            <ScoreCircle score={result.score} label={result.scoreLabel} />
            <Text style={styles.summary}>{result.summary}</Text>

            <Text style={styles.sectionTitle}>
              Alertes ({result.alertsCount})
            </Text>
            {result.alerts.map((alert) => (
              <View key={alert.id} style={styles.alertCard}>
                <AlertBadge severity={alert.severity} />
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertDesc}>{alert.description}</Text>
                <Text style={styles.alertRec}>→ {alert.recommendation}</Text>
              </View>
            ))}

            {result.alertsCount > 3 && (
              <View style={styles.upsellBox}>
                <Text style={styles.upsellTitle}>
                  +{result.alertsCount - 3} alertes dans le rapport complet
                </Text>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => handleUnlock("complete")}
                >
                  <Text style={styles.primaryBtnText}>Débloquer — 19 €</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => handleUnlock("negotiation")}
                >
                  <Text style={styles.secondaryBtnText}>Pack négociation — 39 €</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  homeContent: { padding: 24, paddingTop: 60 },
  formContent: { padding: 20, paddingTop: 56, paddingBottom: 40 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 32 },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoIconText: { color: COLORS.white, fontSize: 20, fontWeight: "700" },
  logoText: { fontSize: 24, fontWeight: "700", color: COLORS.text },
  heroTitle: { fontSize: 28, fontWeight: "800", color: COLORS.text, lineHeight: 36 },
  heroSub: { fontSize: 16, color: COLORS.textMuted, marginTop: 12, lineHeight: 24 },
  statsRow: { flexDirection: "row", gap: 12, marginTop: 28, marginBottom: 32 },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: { fontSize: 20, fontWeight: "700", color: COLORS.primary },
  statLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  primaryBtnText: { color: COLORS.white, fontSize: 16, fontWeight: "700" },
  secondaryBtn: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  secondaryBtnText: { color: COLORS.text, fontSize: 15, fontWeight: "600" },
  btnDisabled: { opacity: 0.6 },
  backLink: { color: COLORS.primary, fontWeight: "600", marginBottom: 16 },
  formTitle: { fontSize: 24, fontWeight: "700", color: COLORS.text, marginBottom: 16 },
  textarea: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    minHeight: 180,
    fontSize: 14,
    color: COLORS.text,
  },
  fieldLabel: { fontSize: 14, fontWeight: "600", color: COLORS.text, marginTop: 20, marginBottom: 8 },
  chips: { flexDirection: "row", marginBottom: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.textMuted },
  chipTextActive: { color: COLORS.white, fontWeight: "600" },
  scoreContainer: { alignItems: "center", marginVertical: 20 },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreNumber: { fontSize: 36, fontWeight: "800" },
  scoreMax: { fontSize: 12, color: COLORS.textMuted },
  scoreLabel: { fontSize: 16, fontWeight: "700", marginTop: 8 },
  summary: { fontSize: 15, color: COLORS.textMuted, lineHeight: 22, textAlign: "center", marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text, marginBottom: 12 },
  alertCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginBottom: 8 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  alertTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  alertDesc: { fontSize: 13, color: COLORS.textMuted, marginTop: 6, lineHeight: 20 },
  alertRec: { fontSize: 13, fontWeight: "600", color: COLORS.primary, marginTop: 8 },
  upsellBox: {
    marginTop: 20,
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  upsellTitle: { fontSize: 15, fontWeight: "700", color: "#065f46", textAlign: "center", marginBottom: 12 },
});

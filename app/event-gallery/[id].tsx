import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import * as Haptics from "expo-haptics";

export default function EventGalleryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = parseInt(id ?? "0", 10);
  const { user } = useAuth();
  const router = useRouter();
  const [showUpload, setShowUpload] = useState(false);
  const [caption, setCaption] = useState("");
  const [selectedUri, setSelectedUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const { data: photos, refetch, isLoading } = trpc.photos.list.useQuery({ eventId }, { enabled: !!eventId });

  const addPhoto = trpc.photos.add.useMutation({
    onSuccess: () => {
      refetch();
      setShowUpload(false);
      setCaption("");
      setSelectedUri(null);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err) => Alert.alert("Error", err.message),
  });

  const deletePhoto = trpc.photos.delete.useMutation({
    onSuccess: () => refetch(),
    onError: (err) => Alert.alert("Error", err.message),
  });

  const handlePickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tu galería para subir fotos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedUri(result.assets[0].uri);
    }
  };

  const handleUpload = async () => {
    if (!selectedUri) { Alert.alert("Error", "Selecciona una foto primero."); return; }
    setUploading(true);
    try {
      // Upload to server storage
      const formData = new FormData();
      formData.append("file", { uri: selectedUri, name: "photo.jpg", type: "image/jpeg" } as any);
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      if (!response.ok) throw new Error("Error al subir la foto");
      const { url } = await response.json();
      addPhoto.mutate({ eventId, photoUrl: url, caption: caption.trim() || undefined });
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "No se pudo subir la foto");
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = (photoId: number, photoUserId: number) => {
    if (photoUserId !== user?.id) { Alert.alert("Error", "Solo puedes eliminar tus propias fotos."); return; }
    Alert.alert("Eliminar foto", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => deletePhoto.mutate({ photoId }) },
    ]);
  };

  const renderPhoto = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.photoCard}
      onPress={() => setSelectedPhoto(item.photoUrl)}
      onLongPress={() => handleDeletePhoto(item.id, item.userId)}
      activeOpacity={0.9}
    >
      <Image source={{ uri: item.photoUrl }} style={styles.photoThumb} resizeMode="cover" />
      <View style={styles.photoMeta}>
        <Text style={styles.photoUser}>{item.userName}</Text>
        {item.caption ? <Text style={styles.photoCaption}>{item.caption}</Text> : null}
        <Text style={styles.photoTime}>
          {new Date(item.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer containerClassName="bg-black">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📸 Galería del Evento</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={() => setShowUpload(true)}>
          <Text style={styles.uploadBtnText}>+ Foto</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loading}><ActivityIndicator color="#C9A84C" size="large" /></View>
      ) : !photos || photos.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📷</Text>
          <Text style={styles.emptyTitle}>Sin fotos aún</Text>
          <Text style={styles.emptyText}>Sé el primero en compartir un momento del evento.</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowUpload(true)}>
            <Text style={styles.emptyBtnText}>SUBIR FOTO</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPhoto}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Upload Modal */}
      <Modal visible={showUpload} transparent animationType="slide" onRequestClose={() => setShowUpload(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowUpload(false)}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Subir foto</Text>

            <TouchableOpacity style={styles.pickBtn} onPress={handlePickImage}>
              {selectedUri ? (
                <Image source={{ uri: selectedUri }} style={styles.previewImg} resizeMode="cover" />
              ) : (
                <View style={styles.pickPlaceholder}>
                  <Text style={styles.pickIcon}>📷</Text>
                  <Text style={styles.pickText}>Toca para seleccionar foto</Text>
                </View>
              )}
            </TouchableOpacity>

            <TextInput
              style={styles.captionInput}
              placeholder="Añade una descripción (opcional)..."
              placeholderTextColor="#555"
              value={caption}
              onChangeText={setCaption}
              maxLength={100}
              returnKeyType="done"
            />

            <TouchableOpacity
              style={[styles.submitBtn, (!selectedUri || uploading || addPhoto.isPending) && styles.submitBtnDisabled]}
              onPress={handleUpload}
              disabled={!selectedUri || uploading || addPhoto.isPending}
            >
              {uploading || addPhoto.isPending ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.submitBtnText}>PUBLICAR FOTO</Text>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Full-screen photo viewer */}
      <Modal visible={!!selectedPhoto} transparent animationType="fade" onRequestClose={() => setSelectedPhoto(null)}>
        <TouchableOpacity style={styles.photoViewer} activeOpacity={1} onPress={() => setSelectedPhoto(null)}>
          {selectedPhoto && (
            <Image source={{ uri: selectedPhoto }} style={styles.fullPhoto} resizeMode="contain" />
          )}
          <Text style={styles.photoViewerClose}>✕ Cerrar</Text>
        </TouchableOpacity>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  backBtn: { padding: 4 },
  backIcon: { fontSize: 22, color: "#C9A84C" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#fff" },
  uploadBtn: {
    backgroundColor: "#C9A84C",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  uploadBtnText: { color: "#000", fontWeight: "800", fontSize: 13 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  emptyText: { fontSize: 14, color: "#666", textAlign: "center" },
  emptyBtn: {
    backgroundColor: "#C9A84C",
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 8,
  },
  emptyBtnText: { color: "#000", fontWeight: "800", letterSpacing: 1 },
  grid: { padding: 8 },
  row: { gap: 8, marginBottom: 8 },
  photoCard: {
    flex: 1,
    backgroundColor: "#111",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  photoThumb: { width: "100%", height: 140 },
  photoMeta: { padding: 8 },
  photoUser: { fontSize: 11, fontWeight: "700", color: "#C9A84C", marginBottom: 2 },
  photoCaption: { fontSize: 11, color: "#ccc", marginBottom: 2 },
  photoTime: { fontSize: 10, color: "#555" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#111",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderColor: "#2a2200",
  },
  handle: { width: 40, height: 4, backgroundColor: "#333", borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: "700", color: "#fff", marginBottom: 16 },
  pickBtn: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 12,
  },
  pickPlaceholder: { flex: 1, justifyContent: "center", alignItems: "center", gap: 8 },
  pickIcon: { fontSize: 36 },
  pickText: { color: "#555", fontSize: 14 },
  previewImg: { width: "100%", height: "100%" },
  captionInput: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#fff",
    marginBottom: 16,
  },
  submitBtn: {
    backgroundColor: "#C9A84C",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: "#000", fontWeight: "800", fontSize: 14, letterSpacing: 1 },
  photoViewer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullPhoto: { width: "100%", height: "80%" },
  photoViewerClose: {
    color: "#aaa",
    fontSize: 14,
    marginTop: 16,
  },
});

import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { supabase } from '../../../lib/supabase';
import { authenticateWithBiometrics } from '../../../lib/auth';
import { Colors, Spacing, Radius } from '../../../constants/theme';

interface Document {
  id: string;
  name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  category: string | null;
  created_at: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼';
  if (mimeType.startsWith('video/')) return '🎬';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('pdf')) return '📕';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📋';
  if (mimeType.includes('zip') || mimeType.includes('archive')) return '🗜';
  return '📄';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DocumentsScreen() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => { loadDocuments(); }, []);

  async function loadDocuments() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setDocuments(data || []);
    setLoading(false);
  }

  async function handleUpload() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setUploading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const binaryData = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, binaryData, {
          contentType: file.mimeType || 'application/octet-stream',
        });

      if (uploadError) throw uploadError;

      // Save record to DB
      const { error: dbError } = await supabase.from('documents').insert({
        user_id: user.id,
        name: file.name,
        file_path: fileName,
        file_size: file.size || 0,
        mime_type: file.mimeType || 'application/octet-stream',
        category: null,
      });

      if (dbError) throw dbError;

      await loadDocuments();
      Alert.alert('Success', 'Document uploaded successfully');
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(doc: Document) {
    const ok = await authenticateWithBiometrics('Download document');
    if (!ok) return;

    setDownloading(doc.id);
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(doc.file_path);

      if (error) throw error;

      const localPath = FileSystem.documentDirectory + doc.name;
      const reader = new FileReader();
      reader.readAsDataURL(data);
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        await FileSystem.writeAsStringAsync(localPath, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(localPath, { mimeType: doc.mime_type });
        } else {
          Alert.alert('Downloaded', `Saved to: ${localPath}`);
        }
      };
    } catch (error: any) {
      Alert.alert('Download Failed', error.message);
    } finally {
      setDownloading(null);
    }
  }

  async function handleDelete(doc: Document) {
    const ok = await authenticateWithBiometrics('Delete document');
    if (!ok) return;

    Alert.alert('Delete Document', `Delete "${doc.name}"?`, [
      { text: 'Cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await supabase.storage.from('documents').remove([doc.file_path]);
          await supabase.from('documents').delete().eq('id', doc.id);
          setDocuments(d => d.filter(item => item.id !== doc.id));
        }
      },
    ]);
  }

  const totalSize = documents.reduce((sum, d) => sum + d.file_size, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Documents</Text>
        <TouchableOpacity
          style={[styles.uploadBtn, uploading && { opacity: 0.5 }]}
          onPress={handleUpload}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={styles.uploadBtnText}>↑</Text>
          )}
        </TouchableOpacity>
      </View>

      {documents.length > 0 && (
        <View style={styles.statsBar}>
          <Text style={styles.statText}>{documents.length} files</Text>
          <Text style={styles.statDot}>•</Text>
          <Text style={styles.statText}>{formatSize(totalSize)} total</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : documents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📁</Text>
            <Text style={styles.emptyTitle}>No documents yet</Text>
            <Text style={styles.emptySubtitle}>Upload any file type — PDFs, images, videos, and more</Text>
            <TouchableOpacity style={styles.uploadEmptyBtn} onPress={handleUpload}>
              <Text style={styles.uploadEmptyBtnText}>↑ Upload Document</Text>
            </TouchableOpacity>
          </View>
        ) : (
          documents.map(doc => (
            <View key={doc.id} style={styles.docItem}>
              <View style={styles.docIcon}>
                <Text style={styles.docIconText}>{getFileIcon(doc.mime_type)}</Text>
              </View>
              <View style={styles.docInfo}>
                <Text style={styles.docName} numberOfLines={1}>{doc.name}</Text>
                <Text style={styles.docMeta}>
                  {formatSize(doc.file_size)} • {formatDate(doc.created_at)}
                </Text>
              </View>
              <View style={styles.docActions}>
                <TouchableOpacity
                  style={styles.docActionBtn}
                  onPress={() => handleDownload(doc)}
                  disabled={downloading === doc.id}
                >
                  {downloading === doc.id ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <Text style={styles.docActionIcon}>↓</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.docActionBtn, styles.docDeleteBtn]}
                  onPress={() => handleDelete(doc)}
                >
                  <Text style={styles.docDeleteIcon}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {documents.length > 0 && (
          <TouchableOpacity style={styles.uploadMoreBtn} onPress={handleUpload} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <>
                <Text style={styles.uploadMoreIcon}>↑</Text>
                <Text style={styles.uploadMoreText}>Upload More Files</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: 12,
  },
  backBtn: { color: Colors.primary, fontSize: 22 },
  title: { color: Colors.textPrimary, fontSize: 20, fontWeight: '700' },
  uploadBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  uploadBtnText: { color: '#000', fontSize: 20, fontWeight: '700' },
  statsBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingBottom: 12, gap: 8,
  },
  statText: { color: Colors.textTertiary, fontSize: 13 },
  statDot: { color: Colors.textTertiary },
  list: { padding: Spacing.lg, gap: 10, paddingBottom: 40 },
  docItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    padding: 14, gap: 12, borderWidth: 1, borderColor: Colors.border,
  },
  docIcon: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: Colors.surface2, justifyContent: 'center', alignItems: 'center',
  },
  docIconText: { fontSize: 22 },
  docInfo: { flex: 1, gap: 3 },
  docName: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  docMeta: { color: Colors.textTertiary, fontSize: 12 },
  docActions: { flexDirection: 'row', gap: 8 },
  docActionBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.surface2, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  docActionIcon: { color: Colors.primary, fontSize: 16, fontWeight: '700' },
  docDeleteBtn: { borderColor: Colors.error + '44' },
  docDeleteIcon: { color: Colors.error, fontSize: 14, fontWeight: '700' },
  emptyState: { alignItems: 'center', marginTop: 60, gap: 12, paddingHorizontal: 20 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: '600' },
  emptySubtitle: { color: Colors.textTertiary, fontSize: 14, textAlign: 'center' },
  uploadEmptyBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.lg,
    paddingHorizontal: 28, paddingVertical: 12, marginTop: 8,
  },
  uploadEmptyBtnText: { color: '#000', fontWeight: '700', fontSize: 15 },
  uploadMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.surface2, borderRadius: Radius.lg,
    padding: 14, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed',
    marginTop: 4,
  },
  uploadMoreIcon: { color: Colors.primary, fontSize: 18 },
  uploadMoreText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '500' },
});

import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, ScrollView, RefreshControl, Platform, Linking, Image } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as WebBrowser from 'expo-web-browser';
import { ProfileContext } from '../context/ProfileContext';
import { documentAPI } from '../services/api';
import { ConfirmModal } from '../components/ConfirmModal';
import { CONFIG } from '../config';

export const VaultScreen = () => {
  const { activeProfile } = useContext(ProfileContext);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [openingPdf, setOpeningPdf] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [fileViewerDoc, setFileViewerDoc] = useState(null);
  const [docToDelete, setDocToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchDocs = async () => {
    if (!activeProfile) return;
    try {
      const data = await documentAPI.getDocuments(activeProfile.id);
      setDocuments(data);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [activeProfile]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDocs();
  };

  const handlePickDocument = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/pdf,image/*';
        input.onchange = async (e) => {
          if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const fileUri = URL.createObjectURL(file);
            await uploadFileToBackend(fileUri, file.name, file.type, file);
          }
        };
        input.click();
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await uploadFileToBackend(asset.uri, asset.name, asset.mimeType || 'application/pdf');
      }
    } catch (err) {
      console.error('Document pick error:', err);
    }
  };

  const uploadFileToBackend = async (uri, name, mimeType) => {
    if (!activeProfile) return;
    setUploading(true);
    try {
      await documentAPI.uploadDocument(activeProfile.id, uri, name, mimeType);
      await fetchDocs();
    } catch (err) {
      console.error('Upload API error:', err);
      await fetchDocs();
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmDeleteDoc = async () => {
    if (!docToDelete) return;
    setDeleteLoading(true);
    try {
      await documentAPI.deleteDocument(docToDelete.id);
      await fetchDocs();
    } catch (e) {
      console.error('Delete document error:', e);
    } finally {
      setDeleteLoading(false);
      setDocToDelete(null);
    }
  };

  const getFullFileUrl = (doc) => {
    if (!doc || !doc.file_url) return null;
    let url = doc.file_url;
    if (!url.startsWith('http')) {
      const baseUrl = CONFIG.FILE_BASE_URL || CONFIG.API_BASE_URL.replace(/\/api$/, '');
      url = `${baseUrl}${url}`;
    }
    return url;
  };

  const isImageFile = (doc) => {
    if (!doc) return false;
    const fn = (doc.file_name || '').toLowerCase();
    const url = (doc.file_url || '').toLowerCase();
    return fn.endsWith('.png') || fn.endsWith('.jpg') || fn.endsWith('.jpeg') || fn.endsWith('.webp') ||
           url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.webp');
  };

  const handleOpenDocFile = async (doc) => {
    if (!doc) return;
    const fullUrl = getFullFileUrl(doc);
    if (!fullUrl) return;

    if (isImageFile(doc)) {
      setFileViewerDoc(doc);
      return;
    }

    setOpeningPdf(true);
    try {
      if (Platform.OS === 'android') {
        const cleanName = (doc.file_name || 'report.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
        const localUri = `${FileSystem.cacheDirectory}${cleanName}`;
        
        const downloadRes = await FileSystem.downloadAsync(fullUrl, localUri);
        const contentUri = await FileSystem.getContentUriAsync(downloadRes.uri);
        
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
          type: 'application/pdf',
        });
      } else if (Platform.OS === 'web') {
        window.open(fullUrl, '_blank');
      } else {
        await WebBrowser.openBrowserAsync(fullUrl);
      }
    } catch (err) {
      console.log('PDF intent failed, using WebBrowser:', err);
      try {
        await WebBrowser.openBrowserAsync(fullUrl);
      } catch (e) {
        Linking.openURL(fullUrl);
      }
    } finally {
      setOpeningPdf(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Upload Header Tile */}
      <View style={styles.uploadHeaderBox}>
        <View style={{ flex: 1 }}>
          <Text style={styles.uploadBoxTitle}>Medical Record Vault</Text>
          <Text style={styles.uploadBoxSub}>Digitize & Vault Lab Reports for {activeProfile?.name}</Text>
        </View>
        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={handlePickDocument}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#0f172a" />
          ) : (
            <Text style={styles.uploadBtnText}>+ Upload PDF / Storage</Text>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={CONFIG.THEME.primary} style={{ marginTop: 40 }} />
      ) : documents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📁</Text>
          <Text style={styles.emptyTitle}>Vault is Empty</Text>
          <Text style={styles.emptySub}>No medical documents uploaded for {activeProfile?.name}. Tap '+ Upload PDF / Storage' above to choose files from mobile storage.</Text>
          <TouchableOpacity style={styles.bigUploadBtn} onPress={handlePickDocument}>
            <Text style={styles.bigUploadBtnText}>📂 Browse Mobile Storage</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={CONFIG.THEME.primary} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.docCard} onPress={() => setSelectedDoc(item)}>
              <View style={styles.docCardHeader}>
                <View style={styles.docIconBox}>
                  <Text style={{ fontSize: 20 }}>📄</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docFileName} numberOfLines={1}>{item.file_name}</Text>
                  <Text style={styles.docDateText}>📅 {item.document_date} • {item.document_type}</Text>
                </View>

                <TouchableOpacity style={styles.viewFileBtn} onPress={() => handleOpenDocFile(item)}>
                  <Text style={styles.viewFileBtnText}>👁️ View File</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setDocToDelete(item)} style={{ padding: 6, marginLeft: 4 }}>
                  <Text style={{ color: CONFIG.THEME.danger, fontSize: 16 }}>🗑️</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.docSummaryText} numberOfLines={2}>{item.ai_summary}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={!!selectedDoc} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalDocTitle} numberOfLines={1}>{selectedDoc?.file_name}</Text>
              <TouchableOpacity onPress={() => setSelectedDoc(null)}>
                <Text style={styles.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              <TouchableOpacity style={styles.bigViewFileBtn} onPress={() => { const doc = selectedDoc; setSelectedDoc(null); handleOpenDocFile(doc); }}>
                <Text style={styles.bigViewFileBtnText}>👁️ View Original Report File / PDF</Text>
              </TouchableOpacity>

              <Text style={styles.modalSectionLabel}>Document Date & Type</Text>
              <Text style={styles.modalDateVal}>{selectedDoc?.document_date} • {selectedDoc?.document_type}</Text>

              <Text style={styles.modalSectionLabel}>Clinical Summary</Text>
              <Text style={styles.modalSummaryVal}>{selectedDoc?.ai_summary}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={!!fileViewerDoc} animationType="slide">
        <View style={styles.viewerContainer}>
          <View style={styles.viewerHeader}>
            <View style={styles.viewerTitleBox}>
              <Text style={styles.viewerIconText}>{isImageFile(fileViewerDoc) ? '🖼️' : '📄'}</Text>
              <Text style={styles.viewerTitleText} numberOfLines={1}>{fileViewerDoc?.file_name}</Text>
            </View>
            <TouchableOpacity onPress={() => setFileViewerDoc(null)} style={styles.viewerCloseBtn}>
              <Text style={styles.viewerCloseText}>✕ Close</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.viewerBody}>
            {fileViewerDoc && isImageFile(fileViewerDoc) ? (
              <Image
                source={{ uri: getFullFileUrl(fileViewerDoc) }}
                style={styles.fullPreviewImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.pdfViewerBox}>
                <Text style={{ fontSize: 50, marginBottom: 12 }}>📄</Text>
                <Text style={styles.pdfViewerTitle}>{fileViewerDoc?.file_name}</Text>
                <Text style={styles.pdfViewerSub}>Medical PDF Report • {fileViewerDoc?.document_date}</Text>

                <TouchableOpacity
                  style={styles.openExternalBtn}
                  disabled={openingPdf}
                  onPress={() => handleOpenDocFile(fileViewerDoc)}
                >
                  {openingPdf ? (
                    <ActivityIndicator color="#0f172a" />
                  ) : (
                    <Text style={styles.openExternalBtnText}>🔗 Open PDF in Native Viewer</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.docSummaryPreviewBox}>
                  <Text style={styles.docSummaryPreviewHeader}>Clinical Summary Preview:</Text>
                  <Text style={styles.docSummaryPreviewBody}>{fileViewerDoc?.ai_summary}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <ConfirmModal
        visible={!!docToDelete}
        title="Delete Medical Document"
        message={`Are you sure you want to remove "${docToDelete?.file_name}" from your vault? Associated parameter trends will also be removed.`}
        confirmText="Delete Report"
        cancelText="Cancel"
        danger={true}
        loading={deleteLoading}
        onConfirm={handleConfirmDeleteDoc}
        onCancel={() => setDocToDelete(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CONFIG.THEME.bgDark,
  },
  uploadHeaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CONFIG.THEME.cardBg,
    padding: 16,
    margin: 16,
    borderRadius: 16,
    borderColor: CONFIG.THEME.cardBorder,
    borderWidth: 1,
  },
  uploadBoxTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: CONFIG.THEME.textMain,
  },
  uploadBoxSub: {
    fontSize: 12,
    color: CONFIG.THEME.textMuted,
    marginTop: 2,
  },
  uploadBtn: {
    backgroundColor: CONFIG.THEME.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  uploadBtnText: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 13,
  },
  bigUploadBtn: {
    backgroundColor: CONFIG.THEME.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  bigUploadBtnText: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 14,
  },
  docCard: {
    backgroundColor: CONFIG.THEME.cardBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderColor: CONFIG.THEME.cardBorder,
    borderWidth: 1,
  },
  docCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  docIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#38bdf815',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  docFileName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: CONFIG.THEME.textMain,
  },
  docDateText: {
    fontSize: 12,
    color: CONFIG.THEME.textMuted,
    marginTop: 2,
  },
  viewFileBtn: {
    backgroundColor: '#38bdf820',
    borderColor: '#38bdf855',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 4,
  },
  viewFileBtnText: {
    color: CONFIG.THEME.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  bigViewFileBtn: {
    backgroundColor: CONFIG.THEME.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  bigViewFileBtnText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: 'bold',
  },
  docSummaryText: {
    fontSize: 13,
    color: CONFIG.THEME.textMuted,
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyIcon: {
    fontSize: 50,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CONFIG.THEME.textMain,
  },
  emptySub: {
    color: CONFIG.THEME.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: CONFIG.THEME.cardBg,
    borderRadius: 20,
    padding: 20,
    borderColor: CONFIG.THEME.cardBorder,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalDocTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CONFIG.THEME.textMain,
  },
  closeModalText: {
    color: CONFIG.THEME.textMuted,
    fontSize: 20,
    padding: 4,
  },
  modalSectionLabel: {
    color: CONFIG.THEME.primary,
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 12,
  },
  modalDateVal: {
    color: CONFIG.THEME.textMain,
    fontSize: 14,
    marginTop: 4,
  },
  modalSummaryVal: {
    color: CONFIG.THEME.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: CONFIG.THEME.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: CONFIG.THEME.cardBorder,
  },
  viewerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 10,
  },
  viewerIconText: {
    fontSize: 20,
  },
  viewerTitleText: {
    color: CONFIG.THEME.textMain,
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  viewerCloseBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewerCloseText: {
    color: '#f8fafc',
    fontWeight: 'bold',
    fontSize: 13,
  },
  viewerBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  fullPreviewImage: {
    width: '100%',
    height: '100%',
  },
  pdfViewerBox: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: CONFIG.THEME.cardBg,
    borderRadius: 20,
    padding: 24,
    borderColor: CONFIG.THEME.cardBorder,
    borderWidth: 1,
  },
  pdfViewerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CONFIG.THEME.textMain,
    textAlign: 'center',
  },
  pdfViewerSub: {
    fontSize: 13,
    color: CONFIG.THEME.textMuted,
    marginTop: 4,
    marginBottom: 20,
  },
  openExternalBtn: {
    backgroundColor: CONFIG.THEME.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  openExternalBtnText: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: 'bold',
  },
  docSummaryPreviewBox: {
    width: '100%',
    backgroundColor: CONFIG.THEME.bgDark,
    borderRadius: 12,
    padding: 16,
    borderColor: CONFIG.THEME.cardBorder,
    borderWidth: 1,
  },
  docSummaryPreviewHeader: {
    color: CONFIG.THEME.primary,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  docSummaryPreviewBody: {
    color: CONFIG.THEME.textMuted,
    fontSize: 13,
    lineHeight: 18,
  }
});

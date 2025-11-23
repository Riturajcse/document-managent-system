import { useState, useCallback } from 'react';
import axios from 'axios';
import { message } from 'antd';

export interface Document {
  id: string;
  name: string;
  path: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentContent {
  id: string;
  name: string;
  path: string;
  content: string;
}

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get<Document[]>('/api/document/list');
      setDocuments(response.data);
    } catch (error) {
      message.error('Failed to fetch documents');
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadDocument = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      await axios.post('/api/document/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      message.success('File uploaded successfully!');
      // Fetch documents again after successful upload
      await fetchDocuments();
      return true;
    } catch (error) {
      message.error('File upload failed!');
      console.error('Error uploading document:', error);
      return false;
    } finally {
      setUploading(false);
    }
  }, [fetchDocuments]);

  const fetchDocumentContent = useCallback(async (id: string): Promise<DocumentContent | null> => {
    try {
      const response = await axios.get<DocumentContent>(`/api/document/content/${id}`);
      return response.data;
    } catch (error) {
      message.error('Failed to fetch document content');
      console.error('Error fetching document content:', error);
      return null;
    }
  }, []);

  const deleteDocument = useCallback(async (id: string) => {
    setDeleting(true);
    try {
      await axios.delete(`/api/document/${id}`);
      message.success('Document deleted successfully!');
      // Fetch documents again after successful deletion
      await fetchDocuments();
      return true;
    } catch (error) {
      message.error('Failed to delete document');
      console.error('Error deleting document:', error);
      return false;
    } finally {
      setDeleting(false);
    }
  }, [fetchDocuments]);

  return {
    documents,
    loading,
    uploading,
    deleting,
    fetchDocuments,
    uploadDocument,
    fetchDocumentContent,
    deleteDocument,
  };
};

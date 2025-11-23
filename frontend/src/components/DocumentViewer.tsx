import { Modal, Spin, Typography, Alert } from 'antd';
import { useEffect, useState } from 'react';
import { DocumentContent } from '../hooks/useDocuments';

const { Title, Paragraph } = Typography;

interface DocumentViewerProps {
  open: boolean;
  documentId: string | null;
  documentName: string;
  onClose: () => void;
  fetchContent: (id: string) => Promise<DocumentContent | null>;
}

const DocumentViewer = ({ open, documentId, documentName, onClose, fetchContent }: DocumentViewerProps) => {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && documentId) {
      loadDocumentContent(documentId);
    }
  }, [open, documentId]);

  const loadDocumentContent = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchContent(id);
      if (data) {
        setContent(data.content);
      } else {
        setError('Failed to fetch document content');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setContent('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      title={<Title level={4} style={{ margin: 0 }}>{documentName}</Title>}
      open={open}
      onCancel={handleClose}
      width={800}
      footer={null}
      style={{ top: 20 }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>Loading document content...</div>
        </div>
      ) : error ? (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
        />
      ) : (
        <div style={{ 
          maxHeight: '60vh', 
          overflowY: 'auto',
          backgroundColor: '#f5f5f5',
          padding: '16px',
          borderRadius: '4px'
        }}>
          <Paragraph style={{ 
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            fontSize: '14px',
            margin: 0
          }}>
            {content || 'No content available'}
          </Paragraph>
        </div>
      )}
    </Modal>
  );
};

export default DocumentViewer;

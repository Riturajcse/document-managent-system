import { useEffect, useState } from 'react';
import { Button, List, Card, Typography, Spin, Empty, Popconfirm } from 'antd';
import { FileTextOutlined, PlusOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import { useDocuments } from '../hooks/useDocuments';
import UploadModal from './UploadModal';
import DocumentViewer from './DocumentViewer';

const { Title } = Typography;

const DocumentList = () => {
  const { documents, loading, uploading, deleting, fetchDocuments, uploadDocument, fetchDocumentContent, deleteDocument } = useDocuments();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUpload = async (file: File) => {
    const success = await uploadDocument(file);
    if (success) {
      setIsModalOpen(false);
    }
    return success;
  };

  const handleViewDocument = (id: string, name: string) => {
    setSelectedDocument({ id, name });
    setIsViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setSelectedDocument(null);
  };

  const handleDeleteDocument = async (id: string, name: string) => {
    const success = await deleteDocument(id);
    if (success) {
      console.log(`Document "${name}" deleted successfully`);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f0f2f5',
      padding: '24px'
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <Title level={2} style={{ margin: 0 }}>
            Documents
          </Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            size="large"
            onClick={() => setIsModalOpen(true)}
          >
            Upload Document
          </Button>
        </div>

        <Card>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
            </div>
          ) : documents.length === 0 ? (
            <Empty 
              description="No documents found. Upload your first document!"
              style={{ padding: '40px' }}
            />
          ) : (
            <List
              dataSource={documents}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button
                      type="primary"
                      icon={<EyeOutlined />}
                      onClick={() => handleViewDocument(item.id, item.name)}
                    >
                      View
                    </Button>,
                    <Popconfirm
                      title="Delete Document"
                      description={`Are you sure you want to delete "${item.name}"?`}
                      onConfirm={() => handleDeleteDocument(item.id, item.name)}
                      okText="Yes"
                      cancelText="No"
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        loading={deleting}
                      >
                        Delete
                      </Button>
                    </Popconfirm>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <FileTextOutlined 
                        style={{ 
                          fontSize: '32px', 
                          color: '#1890ff',
                          marginRight: '12px'
                        }} 
                      />
                    }
                    title={item.name}
                    description={`Uploaded on ${new Date(item.createdAt).toLocaleString()}`}
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      </div>

      <UploadModal 
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onUpload={handleUpload}
        uploading={uploading}
      />

      <DocumentViewer
        open={isViewerOpen}
        documentId={selectedDocument?.id || null}
        documentName={selectedDocument?.name || ''}
        onClose={handleCloseViewer}
        fetchContent={fetchDocumentContent}
      />
    </div>
  );
};

export default DocumentList;

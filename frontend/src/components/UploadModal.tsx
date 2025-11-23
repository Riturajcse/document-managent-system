import { Modal, Upload, Typography } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';

const { Dragger } = Upload;
const { Paragraph } = Typography;

interface UploadModalProps {
  open: boolean;
  onCancel: () => void;
  onUpload: (file: File) => Promise<boolean>;
  uploading: boolean;
}

const UploadModal = ({ open, onCancel, onUpload, uploading }: UploadModalProps) => {
  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.txt',
    beforeUpload: (file) => {
      const isText = file.type === 'text/plain';
      if (!isText) {
        return Upload.LIST_IGNORE;
      }
      // Call onUpload and prevent default upload behavior
      onUpload(file as File);
      return false; // Prevent default upload
    },
    showUploadList: false,
  };

  return (
    <Modal
      title="Upload Document"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={600}
    >
      <Paragraph style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
        Upload text files to the server
      </Paragraph>
      
      <Dragger {...uploadProps} disabled={uploading}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">
          Click or drag a text file to this area to upload
        </p>
        <p className="ant-upload-hint">
          Only .txt files are supported
        </p>
      </Dragger>
    </Modal>
  );
};

export default UploadModal;

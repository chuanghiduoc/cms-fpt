import { useState, useRef } from 'react';
import { FiUpload, FiFileText, FiX } from 'react-icons/fi';

interface FileUploaderProps {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  maxSize?: number; // in MB
  label?: string;
  required?: boolean;
  error?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png',
  maxSize = 10, // 10MB default
  label = 'Tệp tin',
  required = false,
  error
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    // Check file size
    if (selectedFile.size > maxSize * 1024 * 1024) {
      alert(`Kích thước tệp tin không được vượt quá ${maxSize}MB`);
      return;
    }
    
    setFile(selectedFile);
    onFileSelect(selectedFile);
  };

  const removeFile = () => {
    setFile(null);
    onFileSelect(null);
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${
          isDragging 
            ? 'border-orange-400 bg-orange-50' 
            : error 
              ? 'border-red-300 border-dashed' 
              : 'border-gray-300 border-dashed'
        } rounded-md transition-colors duration-200`}
      >
        {!file ? (
          <div className="space-y-1 text-center">
            <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer rounded-md font-medium text-orange-600 hover:text-orange-500 outline-none"
              >
                <span>Tải lên tệp tin</span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  accept={accept}
                  onChange={handleFileChange}
                  ref={fileInputRef}
                />
              </label>
              <p className="pl-1">hoặc kéo và thả</p>
            </div>
            <p className="text-xs text-gray-500">
              {accept.split(',').map(ext => ext.replace('.', '').toUpperCase()).join(', ')}
            </p>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        ) : (
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FiFileText className="h-8 w-8 text-gray-500" />
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="inline-flex items-center p-1.5 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 outline-none"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploader; 
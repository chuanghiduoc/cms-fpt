'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiSave, FiX, FiPaperclip, FiImage, FiEye, FiCheckCircle, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';

// Import React Quill dynamically to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

interface FilePreview {
  name: string;
  size: number;
  type: string;
  url: string;
}

interface QuillInstance {
  getEditorSelection: () => { index: number };
  getEditor: () => { 
    insertEmbed: (index: number, type: string, value: string) => void 
  };
}

declare global {
  interface Window {
    quillInstance: QuillInstance;
  }
}

export default function CreatePostPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [attachments, setAttachments] = useState<FilePreview[]>([]);
  const [coverImage, setCoverImage] = useState<FilePreview | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // Set up quill instance on client side
  useEffect(() => {
    // This is a workaround since the component doesn't expose onMount prop
    const setupQuill = () => {
      const quillEditor = document.querySelector('.quill');
      if (quillEditor) {
        const quillInstance = {
          getEditorSelection: () => ({ index: 0 }),
          getEditor: () => ({
            insertEmbed: (index: number, type: string, value: string) => {
              // Insert content at cursor position
              const editor = document.querySelector('.ql-editor');
              if (editor && type === 'image') {
                const img = document.createElement('img');
                img.src = value;
                editor.appendChild(img);
              }
            }
          })
        };
        
        window.quillInstance = quillInstance;
      }
    };
    
    // Wait for Quill to be initialized
    setTimeout(setupQuill, 100);
  }, []);

  if (status === 'loading') {
    return <div className="p-6 text-center">Đang tải...</div>;
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  if (session?.user?.role !== 'ADMIN' ) {
    router.push('/dashboard');
    toast.error('Bạn không có quyền truy cập trang này');
    return null;
  }

  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    // Kiểm tra kiểu file
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh');
      return;
    }

    // Kiểm tra kích thước file (giới hạn ở 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước hình ảnh không được vượt quá 5MB');
      return;
    }

    try {
      // Tải file lên Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/cloudinary-upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Không thể tải lên ảnh bìa');
      }
      
      const data = await response.json();
      
      setCoverImage({
        name: file.name,
        size: file.size,
        type: file.type,
        url: data.file.fileUrl
      });
      
    } catch (error) {
      console.error('Lỗi khi tải ảnh bìa:', error);
      toast.error('Không thể tải lên ảnh bìa');
    }
  };

  const handleFileAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Kiểm tra kích thước file (giới hạn ở 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Kích thước file không được vượt quá 10MB');
      return;
    }

    try {
      // Tải file lên server
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Không thể tải lên tệp đính kèm');
      }
      
      const data = await response.json();
      
      setAttachments(prev => [...prev, {
        name: file.name,
        size: file.size,
        type: file.type,
        url: data.file.fileUrl
      }]);
      
    } catch (error) {
      console.error('Lỗi khi tải tệp đính kèm:', error);
      toast.error('Không thể tải lên tệp đính kèm');
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const removeCoverImage = () => {
    setCoverImage(null);
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleQuillImageUpload = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    
    input.onchange = async () => {
      if (input.files && input.files[0]) {
        const file = input.files[0];
        
        // Kiểm tra kích thước (giới hạn 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error('Kích thước hình ảnh không được vượt quá 5MB');
          return;
        }

        try {
          // Tải file lên Cloudinary
          const formData = new FormData();
          formData.append('file', file);
          
          const response = await fetch('/api/cloudinary-upload', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error('Không thể tải lên hình ảnh');
          }
          
          const data = await response.json();
          
          // Chèn hình ảnh vào editor
          if (window.quillInstance) {
            const range = window.quillInstance.getEditorSelection();
            window.quillInstance.getEditor().insertEmbed(range.index, 'image', data.file.fileUrl);
          }
          
        } catch (error) {
          console.error('Lỗi khi tải hình ảnh vào editor:', error);
          toast.error('Không thể tải lên hình ảnh');
        }
      }
    };
    input.click();
  };

  // Quill editor modules and formats configuration
  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'align': [] }],
        [{ 'color': [] }, { 'background': [] }],
        ['link', 'image'],
        ['clean'],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        ['blockquote', 'code-block'],
      ],
      handlers: {
        image: handleQuillImageUpload
      }
    },
    clipboard: {
      matchVisual: false,
    }
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list',
    'link', 'image',
    'color', 'background',
    'align',
    'indent',
    'blockquote', 'code-block'
  ];

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean = false) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề bài viết');
      return;
    }

    if (!content.trim()) {
      toast.error('Vui lòng nhập nội dung bài viết');
      return;
    }

    setLoading(true);

    try {
      const postData = {
        title: title.trim(),
        content,
        isPublic,
        tags,
        coverImageUrl: coverImage?.url || null,
        status: isDraft ? 'DRAFT' : 'PENDING'
      };

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        throw new Error('Không thể tạo bài viết');
      }

      toast.success(isDraft ? 'Đã lưu bài viết nháp' : 'Đã tạo bài viết mới');
      router.push('/admin/posts');
    } catch (error) {
      console.error('Lỗi khi tạo bài viết:', error);
      toast.error('Đã xảy ra lỗi khi tạo bài viết');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/admin/posts" className="mr-4 text-gray-500 hover:text-gray-700 cursor-pointer">
            <FiArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center">
            Tạo bài viết mới
          </h1>
        </div>
        
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`inline-flex items-center px-4 py-2 ${
              showPreview 
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } border border-transparent rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
          >
            <FiEye className="mr-2 h-4 w-4" />
            Xem trước
          </button>
        </div>
      </div>
      
      {showPreview ? (
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Xem trước bài viết</h1>
              <button
                onClick={() => setShowPreview(false)}
                className="bg-orange-100 hover:bg-orange-200 text-orange-600 px-4 py-2 rounded-md flex items-center cursor-pointer"
              >
                <FiX className="mr-2" /> Đóng xem trước
              </button>
            </div>
            
            {coverImage && (
              <div className="mb-6 relative h-64 w-full rounded-lg overflow-hidden">
                <Image
                  src={coverImage.url}
                  alt={title}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
            )}
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{title || 'Tiêu đề bài viết'}</h1>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {tags.map((tag, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            <div 
              className="prose max-w-none text-gray-900" 
              dangerouslySetInnerHTML={{ __html: content || '<p>Nội dung bài viết sẽ hiển thị ở đây...</p>' }} 
            />
            
            {attachments.length > 0 && (
              <div className="mt-8 border-t pt-4">
                <h3 className="text-lg font-medium mb-2">Tệp đính kèm</h3>
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center p-2 border rounded">
                      <FiPaperclip className="mr-2 text-gray-500" />
                      <span className="flex-1 truncate">{file.name}</span>
                      <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <form className="p-6 space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1 cursor-pointer">
                  Tiêu đề bài viết <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm text-gray-900 cursor-text"
                  placeholder="Nhập tiêu đề bài viết"
                />
              </div>
              
              {/* Cover Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 cursor-pointer">
                  Ảnh bìa
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  {coverImage ? (
                    <div className="space-y-2 w-full">
                      <div className="relative h-48 w-full rounded overflow-hidden">
                        <Image 
                          src={coverImage.url} 
                          alt="Cover preview" 
                          fill
                          style={{ objectFit: 'contain' }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 truncate max-w-xs">
                          {coverImage.name} ({formatFileSize(coverImage.size)})
                        </span>
                        <button
                          type="button"
                          onClick={removeCoverImage}
                          className="text-red-600 hover:text-red-800 text-sm cursor-pointer"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 text-center">
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="cover-image-upload"
                          className="relative cursor-pointer rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none"
                        >
                          <span>Tải lên ảnh bìa</span>
                          <input
                            id="cover-image-upload"
                            name="cover-image-upload"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            ref={imageInputRef}
                            onChange={handleCoverImageChange}
                          />
                        </label>
                        <p className="pl-1">hoặc kéo thả vào đây</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF tối đa 5MB
                      </p>
                      <div className="flex justify-center">
                        <FiImage className="h-10 w-10 text-gray-300" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Tags Input */}
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1 cursor-pointer">
                  Thẻ
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag, index) => (
                    <span 
                      key={index} 
                      className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded flex items-center"
                    >
                      {tag}
                      <button 
                        type="button" 
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        <FiX size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex">
                  <input
                    type="text"
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm text-gray-900 cursor-text"
                    placeholder="Nhập thẻ và nhấn Enter"
                  />
                  <button
                    type="button"
                    onClick={() => addTag(tagInput)}
                    className="ml-2 mt-1 inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                  >
                    Thêm
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Thêm thẻ để phân loại bài viết (ví dụ: hướng dẫn, báo cáo, khoa học)
                </p>
              </div>
              
              {/* Rich Text Editor */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1 cursor-pointer">
                  Nội dung bài viết <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 cursor-text">
                  <ReactQuill
                    theme="snow"
                    value={content}
                    onChange={setContent}
                    modules={modules}
                    formats={formats}
                    className="h-64 sm:h-96 mb-12 text-gray-900"
                    placeholder="Nhập nội dung bài viết của bạn ở đây..."
                  />
                </div>
              </div>
              
              {/* Spacer div to create proper separation */}
              <div className="pt-10 mt-10"></div>
              
              {/* File Attachments */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3 cursor-pointer">
                  Tệp đính kèm
                </label>
                
                {attachments.length > 0 && (
                  <div className="mt-2 mb-4 space-y-2 border border-gray-200 rounded-md p-2 bg-gray-50">
                    {attachments.map((file, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center flex-1 min-w-0">
                          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full mr-3">
                            <FiPaperclip className="text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <div className="ml-2">
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="p-1.5 rounded-full hover:bg-red-100 text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                            aria-label="Xóa tệp đính kèm"
                          >
                            <FiX size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:space-x-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center px-4 py-2.5 border border-dashed border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 cursor-pointer transition-colors w-full justify-center mb-2 sm:mb-0"
                  >
                    <FiPaperclip className="mr-2 text-gray-500" />
                    Thêm tệp đính kèm
                  </button>
                  <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileAttachment}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500 text-center sm:text-left">
                  Hỗ trợ mọi định dạng tệp, tối đa 10MB
                </p>
              </div>
              
              <div className="flex items-start mt-4">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded cursor-pointer"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="isPublic" className="font-medium text-gray-700 cursor-pointer">
                    Đăng bài viết công khai cho phòng ban {isPublic && <span className="text-orange-600">(cần phê duyệt)</span>}
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={loading}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 cursor-pointer disabled:opacity-50"
                >
                  <FiSave className="mr-2 -ml-1 h-4 w-4" />
                  Lưu nháp
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 cursor-pointer"
                >
                  <FiX className="mr-2 -ml-1 h-4 w-4" /> Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, false)}
                  disabled={loading}
                  className="inline-flex items-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className="mr-2 -ml-1 h-4 w-4" />
                      {isPublic ? 'Gửi bài viết để duyệt' : 'Đăng bài viết nội bộ'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import 'react-quill-new/dist/quill.snow.css';
import dynamic from 'next/dynamic';

// Dynamic import for React Quill since it uses window/document
const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => <div className="border rounded-lg p-4 min-h-[300px] animate-pulse bg-gray-100"></div>
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    [{ align: [] }],
    ['link', 'image'],
    ['clean'],
  ],
};

const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet', 'indent',
  'link', 'image',
  'align'
];

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return <div className="border rounded-lg p-4 min-h-[300px] animate-pulse bg-gray-100"></div>;
  }
  
  return (
    <div className="rounded-lg border border-gray-300 overflow-hidden">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={quillModules}
        formats={quillFormats}
        className="h-[300px] max-h-[500px]"
      />
    </div>
  );
} 
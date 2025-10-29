// app/components/UploadForm.tsx
'use client';

import { Upload, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

interface FileInfo {
  file: File;
  number: string;
  type: string;
  name: string;
  issued_date: string;
}

export default function UploadForm({ onSuccess }: { onSuccess: () => void }) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [uploading, setUploading] = useState(false);
  const { addToast } = useToast();

  const extract = (name: string) => {
    const base = name.replace(/\.[^.]+$/, '').trim();
    let type = '', number = '', tr = base;
    const map: Record<string, string> = { 'KH': 'Kế hoạch', 'QĐ': 'Quyết định', 'CV': 'Công văn' };
    const p = base.match(/^([A-ZĐ]{1,4})\s+/i);
    if (p) { type = map[p[1].toUpperCase()] || p[1]; tr = base.slice(p[0].length).trim(); }
    const n = tr.match(/(\d{1,6}(?:\/\d{2,4})?)/);
    if (n) { number = n[1]; tr = tr.replace(n[0], '').replace(/[-:–]\s*/g, '').trim(); }
    tr = tr.replace(/\s+/g, ' ').replace(/^\w/, c => c.toUpperCase()).trim() || 'Không xác định';
    return { type, number, name: tr };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const newFiles = selected.map(f => ({ file: f, issued_date: '', ...extract(f.name) }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const update = (i: number, field: keyof FileInfo, value: string) => {
    setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, [field]: value } : f));
  };

  const remove = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.length) return;
    setUploading(true);
    const results = await Promise.all(files.map(async ({ file, number, type, name, issued_date }) => {
      const fd = new FormData();
      fd.append('file', file); fd.append('number', number); fd.append('type', type);
      fd.append('name', name); fd.append('issued_date', issued_date);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      return res.ok;
    }));
    setUploading(false);
    if (results.every(r => r)) {
      addToast(`Đã upload ${files.length} file!`, 'success');
      setFiles([]); onSuccess();
    } else addToast('Lỗi upload', 'error');
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-5 border border-slate-200 dark:border-slate-700">
      <form onSubmit={submit} className="space-y-4">
        <label className="block w-full p-4 border-2 border-dashed rounded-lg text-center cursor-pointer hover:border-blue-500">
          <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
          <span className="text-sm">{files.length ? `${files.length} file` : 'Chọn nhiều file PDF'}</span>
          <input type="file" accept=".pdf" multiple onChange={handleFileChange} className="hidden" />
        </label>

        {files.map((f, i) => (
          <div key={i} className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="truncate flex-1 mr-2">{f.file.name}</span>
              <button type="button" onClick={() => remove(i)} className="text-red-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <input value={f.number} onChange={e => update(i, 'number', e.target.value)} placeholder="Số" className="px-2 py-1 border rounded" required />
              <input value={f.type} onChange={e => update(i, 'type', e.target.value)} placeholder="Loại" className="px-2 py-1 border rounded" required />
              <input value={f.name} onChange={e => update(i, 'name', e.target.value)} placeholder="Trích yếu" className="px-2 py-1 border rounded col-span-1" required />
              <input type="date" value={f.issued_date} onChange={e => update(i, 'issued_date', e.target.value)} className="px-2 py-1 border rounded" />
            </div>
          </div>
        ))}

        <button type="submit" disabled={uploading || !files.length} className="w-full bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50">
          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Upload tất cả'}
        </button>
      </form>
    </div>
  );
}
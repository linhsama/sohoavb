// app/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, FileText, Moon, Sun, Trash2, Eye, ChevronLeft, ChevronRight, Calendar, ArrowUpDown } from 'lucide-react';
import UploadForm from './components/UploadForm';
import { useToast } from './components/Toast';

interface Doc {
  id: number; number: string; type: string; name: string;
  file_path: string; issued_date: string | null; created_at: string;
}

const ITEMS_PER_PAGE = 10;

export default function Home() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState<keyof Doc>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [darkMode, setDarkMode] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const { addToast } = useToast();

  const fetchDocs = async () => {
    const res = await fetch('/api/documents');
    const data = await res.json();
    setDocs(data);
  };

  useEffect(() => { fetchDocs(); }, []);

  const data = useMemo(() => {
    let res = docs;
    if (search) res = res.filter(d => [d.number, d.type, d.name].some(f => f.toLowerCase().includes(search.toLowerCase())));
    if (dateFrom || dateTo) res = res.filter(d => {
      if (!d.issued_date) return false;
      if (dateFrom && d.issued_date < dateFrom) return false;
      if (dateTo && d.issued_date > dateTo) return false;
      return true;
    });
    res.sort((a, b) => {
      const av = a[sortField] || '', bv = b[sortField] || '';
      return (av > bv ? 1 : -1) * (sortOrder === 'asc' ? 1 : -1);
    });
    return res;
  }, [docs, search, dateFrom, dateTo, sortField, sortOrder]);

  const paginated = data.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);

  const sort = (f: keyof Doc) => {
    if (sortField === f) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortField(f); setSortOrder('asc'); }
  };

  const toggle = (id: number) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleAll = () => setSelected(selected.length === paginated.length ? [] : paginated.map(d => d.id));

  const del = async () => {
    if (!selected.length || !confirm(`Xóa ${selected.length} mục?`)) return;
    await Promise.all(selected.map(id => fetch(`/api/documents/${id}`, { method: 'DELETE' })));
    addToast('Đã xóa!', 'success');
    setSelected([]); fetchDocs();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <header className="bg-white dark:bg-slate-800 shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="w-7 h-7 text-blue-600" />Quản lý Văn bản</h1>
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <UploadForm onSuccess={fetchDocs} />

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input type="text" placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500" />
            </div>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2 rounded-lg border" />
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2 rounded-lg border" />
            {selected.length > 0 && <button onClick={del} className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Trash2 className="w-4 h-4" />Xóa {selected.length}</button>}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th className="p-3 text-left"><input type="checkbox" checked={selected.length === paginated.length && paginated.length > 0} onChange={toggleAll} className="w-4 h-4 rounded" /></th>
                  {(['number', 'type', 'name', 'issued_date', 'created_at'] as const).map(f => (
                    <th key={f} onClick={() => sort(f)} className="p-3 text-left font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600">
                      <div className="flex items-center gap-1">
                        {f === 'number' && 'Số'}
                        {f === 'type' && 'Loại'}
                        {f === 'name' && 'Trích yếu'}
                        {f === 'issued_date' && <><Calendar className="w-4 h-4" />Ngày ban hành</>}
                        {f === 'created_at' && 'Tải lên'}
                        {sortField === f && <ArrowUpDown className={`w-4 h-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />}
                      </div>
                    </th>
                  ))}
                  <th className="p-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(d => (
                  <tr key={d.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-700">
                    <td className="p-3"><input type="checkbox" checked={selected.includes(d.id)} onChange={() => toggle(d.id)} className="w-4 h-4 rounded" /></td>
                    <td className="p-3 font-medium text-blue-600">{d.number}</td>
                    <td className="p-3"><span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs">{d.type}</span></td>
                    <td className="p-3 max-w-md truncate" title={d.name}>{d.name}</td>
                    <td className="p-3">{d.issued_date ? new Date(d.issued_date).toLocaleDateString('vi-VN') : '-'}</td>
                    <td className="p-3 text-xs text-slate-500">{new Date(d.created_at).toLocaleDateString('vi-VN')}</td>
                    <td className="p-3 text-right flex justify-end gap-2">
                      <a href={d.file_path} target="_blank" className="text-green-600 hover:text-green-700"><Eye className="w-4 h-4" /></a>
                      <button onClick={() => { setSelected([d.id]); del(); }} className="text-red-600 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-6">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 disabled:opacity-50"><ChevronLeft className="w-5 h-5" /></button>
              <span className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 disabled:opacity-50"><ChevronRight className="w-5 h-5" /></button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
// app/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Search, FileText, Moon, Sun, Trash2, Eye,
  ChevronLeft, ChevronRight, Calendar, ArrowUpDown,
  Upload, FolderOpen, LayoutGrid, ChevronDown
} from 'lucide-react';
import UploadForm from './components/UploadForm';
import { useToast } from './components/Toast';

interface Doc {
  id: number;
  number: string;
  type: string;
  name: string;
  file_path: string;
  issued_date: string | null;
  created_at: string;
}

const ITEMS_PER_PAGE = 10;

export default function Home() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    field: keyof Doc;
    order: 'asc' | 'desc';
  }>({ field: 'created_at', order: 'desc' });
  const [darkMode, setDarkMode] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [showUpload, setShowUpload] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const { addToast } = useToast();

  // === MẶC ĐỊNH: TẤT CẢ CÁC NĂM (từ trước → hôm nay) ===
  useEffect(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    setDateFrom('');
    setDateTo(todayStr);
  }, []);

  // === FETCH DATA ===
  const fetchDocs = async () => {
    try {
      const res = await fetch('/api/documents');
      if (!res.ok) throw new Error('Lỗi tải dữ liệu');
      const data = await res.json();
      setDocs(data);
    } catch {
      addToast('Không thể tải văn bản!', 'error');
    }
  };

  useEffect(() => { fetchDocs(); }, []);

  // === DANH SÁCH NĂM ===
  const years = useMemo(() => {
    const yearSet = new Set<number>();
    docs.forEach(d => {
      if (d.issued_date) yearSet.add(new Date(d.issued_date).getFullYear());
    });
    const hasUnknown = docs.some(d => !d.issued_date);
    const list = Array.from(yearSet).sort((a, b) => b - a);
    return hasUnknown ? [...list, 0] : list;
  }, [docs]);

  // === LỌC + SORT ===
  const filteredData = useMemo(() => {
    let res = docs;

    // Lọc theo năm
    if (selectedYear !== null) {
      res = res.filter(d => {
        if (selectedYear === 0) return !d.issued_date;
        return d.issued_date && new Date(d.issued_date).getFullYear() === selectedYear;
      });
    }

    // Tìm kiếm
    if (search) {
      const q = search.toLowerCase();
      res = res.filter(d =>
        d.number.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q)
      );
    }

    // Lọc loại
    if (typeFilter) {
      res = res.filter(d => d.type === typeFilter);
    }

    // Lọc ngày
    if (dateFrom || dateTo) {
      res = res.filter(d => {
        if (!d.issued_date) return false;
        if (dateFrom && d.issued_date < dateFrom) return false;
        if (dateTo && d.issued_date > dateTo) return false;
        return true;
      });
    }

    // Sắp xếp - ĐÚNG A→Z / Z→A
    res.sort((a, b) => {
      let av = a[sortConfig.field];
      let bv = b[sortConfig.field];
      if (av == null) av = '';
      if (bv == null) bv = '';
      const aStr = String(av).toLowerCase();
      const bStr = String(bv).toLowerCase();
      if (aStr < bStr) return sortConfig.order === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortConfig.order === 'asc' ? 1 : -1;
      return 0;
    });

    return res;
  }, [docs, selectedYear, search, typeFilter, dateFrom, dateTo, sortConfig]);

  // === LOẠI + SỐ LƯỢNG (theo filter hiện tại) ===
  const uniqueTypesWithCount = useMemo(() => {
    const typeCount: Record<string, number> = {};
    filteredData.forEach(d => {
      const type = d.type || 'Không xác định';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    return Object.entries(typeCount)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => a.type.localeCompare(b.type));
  }, [filteredData]);

  // === PHÂN TRANG ===
  const paginated = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, page]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  // === HÀM HỖ TRỢ ===
  const sort = (field: keyof Doc) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggle = (id: number) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    const pageIds = paginated.map(d => d.id);
    const allSelected = pageIds.every(id => selected.includes(id));
    setSelected(prev =>
      allSelected
        ? prev.filter(id => !pageIds.includes(id))
        : [...new Set([...prev, ...pageIds])]
    );
  };

  const del = async () => {
    if (!selected.length || !confirm(`Xóa ${selected.length} văn bản?`)) return;
    try {
      await Promise.all(
        selected.map(id => fetch(`/api/documents/${id}`, { method: 'DELETE' }))
      );
      addToast('Đã xóa thành công!', 'success');
      setSelected([]);
      fetchDocs();
    } catch {
      addToast('Lỗi khi xóa!', 'error');
    }
  };

  const handleYearSelect = (year: number | null) => {
    setSelectedYear(year);
    setPage(1);
  };

  const yearLabel = (year: number) => (year === 0 ? 'Không xác định' : `Năm ${year}`);

  // === PHÂN TRANG ===
  const renderPagination = (current: number, total: number, onChange: (p: number) => void) => {
    if (total <= 1) return null;
    return (
      <div className="flex justify-center items-center gap-3 mt-6">
        <button
          onClick={() => onChange(Math.max(1, current - 1))}
          disabled={current === 1}
          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 disabled:opacity-50 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
          {current} / {total}
        </span>
        <button
          onClick={() => onChange(Math.min(total, current + 1))}
          disabled={current === total}
          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 disabled:opacity-50 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  return (
    <div className={`min-h-screen flex bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-colors ${darkMode ? 'dark' : ''}`}>
      {/* === SIDEBAR === */}
      <aside className="w-64 bg-white dark:bg-slate-800 shadow-xl border-r flex flex-col h-screen sticky top-0">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold">Quản lý Văn bản</h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Upload */}
          <button
            onClick={() => setShowUpload(true)}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all font-medium shadow-md"
          >
            <Upload className="w-5 h-5" />
            Upload Văn bản
          </button>

          {/* Bộ lọc */}
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2">
              Bộ lọc
            </h3>

            {/* Tất cả */}
            <button
              onClick={() => handleYearSelect(null)}
              className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all ${selectedYear === null
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 shadow-sm'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
            >
              <span className="flex items-center gap-2 font-medium">
                <LayoutGrid className="w-4 h-4" />
                Tất cả
              </span>
              <span className="text-xs bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded-full font-medium">
                {docs.length}
              </span>
            </button>

            {/* Các năm */}
            {years.map(year => {
              const count = docs.filter(d => {
                if (year === 0) return !d.issued_date;
                return d.issued_date && new Date(d.issued_date).getFullYear() === year;
              }).length;

              return (
                <button
                  key={year}
                  onClick={() => handleYearSelect(year)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all ${selectedYear === year
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 shadow-sm'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                >
                  <span className="flex items-center gap-2 font-medium">
                    <FolderOpen className="w-4 h-4" />
                    {yearLabel(year)}
                  </span>
                  <span className="text-xs bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded-full font-medium">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* === MAIN CONTENT === */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white dark:bg-slate-800 shadow-md border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {selectedYear === null
              ? `Tất cả văn bản (${docs.length})`
              : `${yearLabel(selectedYear)} (${filteredData.length} văn bản)`}
          </h2>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </header>

        <main className="flex-1 p-6 space-y-6">
          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm số hiệu, loại, trích yếu..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Dropdown Loại + Số lượng */}
            <div className="relative">
              <button
                onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                className="w-56 px-4 py-3 rounded-xl border bg-white dark:bg-slate-700 flex items-center justify-between focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <span className="truncate">
                  {typeFilter ? `${typeFilter} (${uniqueTypesWithCount.find(t => t.type === typeFilter)?.count || 0})` : 'Tất cả loại'}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showTypeDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showTypeDropdown && (
                <div className="absolute top-full mt-1 w-full bg-white dark:bg-slate-700 border rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                  <button
                    onClick={() => { setTypeFilter(''); setShowTypeDropdown(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-600 flex justify-between"
                  >
                    <span>Tất cả loại</span>
                    <span className="text-xs text-slate-500">({filteredData.length})</span>
                  </button>
                  {uniqueTypesWithCount.map(({ type, count }) => (
                    <button
                      key={type}
                      onClick={() => { setTypeFilter(type); setShowTypeDropdown(false); }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-600 flex justify-between"
                    >
                      <span>{type}</span>
                      <span className="text-xs text-slate-500">({count})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500"
            />

            {selected.length > 0 && (
              <button
                onClick={del}
                className="bg-red-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-red-700 transition-colors font-medium"
              >
                <Trash2 className="w-5 h-5" />
                Xóa {selected.length}
              </button>
            )}
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-700 sticky top-0">
                  <tr>
                    <th className="p-4 text-left w-12">
                      <input
                        type="checkbox"
                        checked={paginated.length > 0 && paginated.every(d => selected.includes(d.id))}
                        onChange={toggleAll}
                        className="w-4 h-4 rounded border-slate-300"
                      />
                    </th>
                    {(['number', 'type', 'name', 'issued_date', 'created_at'] as const).map(f => (
                      <th
                        key={f}
                        onClick={() => sort(f)}
                        className="p-4 text-left font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          {f === 'number' && 'Số hiệu'}
                          {f === 'type' && 'Loại'}
                          {f === 'name' && 'Trích yếu'}
                          {f === 'issued_date' && (
                            <>
                              <Calendar className="w-4 h-4" /> Ngày ban hành
                            </>
                          )}
                          {f === 'created_at' && 'Tải lên'}
                          {sortConfig.field === f && (
                            <ArrowUpDown
                              className={`w-4 h-4 transition-transform ${sortConfig.order === 'asc' ? 'rotate-180' : ''
                                }`}
                            />
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="p-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        Không có văn bản nào.
                      </td>
                    </tr>
                  ) : (
                    paginated.map(d => (
                      <tr
                        key={d.id}
                        className="border-b hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selected.includes(d.id)}
                            onChange={() => toggle(d.id)}
                            className="w-4 h-4 rounded border-slate-300"
                          />
                        </td>
                        <td className="p-4 font-medium text-blue-600">{d.number}</td>
                        <td className="p-4">
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                            {d.type}
                          </span>
                        </td>
                        <td className="p-4 max-w-md truncate" title={d.name}>
                          {d.name}
                        </td>
                        <td className="p-4">
                          {d.issued_date
                            ? new Date(d.issued_date).toLocaleDateString('vi-VN')
                            : '-'}
                        </td>
                        <td className="p-4 text-xs text-slate-500">
                          {new Date(d.created_at).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="p-4 text-right flex justify-end gap-2">
                          <a
                            href={d.file_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-700 transition-colors"
                          >
                            <Eye className="w-5 h-5" />
                          </a>
                          <button
                            onClick={() => {
                              setSelected([d.id]);
                              del();
                            }}
                            className="text-red-600 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Phân trang */}
            {renderPagination(page, totalPages, setPage)}
          </div>
        </main>
      </div>

      {/* === MODAL UPLOAD === */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-2xl max-w-lg w-full">
            <h3 className="text-lg font-bold mb-4">Upload Văn bản</h3>
            <UploadForm
              onSuccess={() => {
                fetchDocs();
                setShowUpload(false);
                addToast('Upload thành công!', 'success');
              }}
            />
            <button
              onClick={() => setShowUpload(false)}
              className="mt-4 w-full py-2 bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
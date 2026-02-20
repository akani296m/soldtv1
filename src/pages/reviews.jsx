import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2, Plus, Upload, X, Star, BadgeCheck, Image as ImageIcon, Pencil, Trash2, EyeOff, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { uploadImage } from '../lib/uploadImage';
import { useProducts } from '../context/productcontext';

function clampRating(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(5, n));
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') return defaultValue;
  const s = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(s)) return true;
  if (['false', '0', 'no', 'n'].includes(s)) return false;
  return defaultValue;
}

function parseCsv(text) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  const normalized = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];

    if (inQuotes) {
      if (ch === '"') {
        const next = normalized[i + 1];
        if (next === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === ',') {
      currentRow.push(currentField);
      currentField = '';
      continue;
    }

    if (ch === '\n') {
      currentRow.push(currentField);
      currentField = '';
      rows.push(currentRow);
      currentRow = [];
      continue;
    }

    currentField += ch;
  }

  // last field/row
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  // drop trailing empty rows
  while (rows.length > 0 && rows[rows.length - 1].every((v) => String(v || '').trim() === '')) {
    rows.pop();
  }

  return rows;
}

function StarRow({ value = 0, size = 14 }) {
  const r = clampRating(value);
  const filled = Math.round(r);
  return (
    <div className="flex items-center gap-0.5">
      {[0, 1, 2, 3, 4].map((idx) => (
        <Star
          key={idx}
          size={size}
          className={idx < filled ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}
        />
      ))}
    </div>
  );
}

function Modal({ title, onClose, children, widthClass = 'max-w-2xl' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative w-full ${widthClass} bg-white rounded-xl shadow-xl border border-gray-200`}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function ReviewsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { products, loading: productsLoading } = useProducts();

  const initialProductId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const pid = params.get('productId');
    const n = pid ? Number(pid) : null;
    return Number.isFinite(n) ? n : null;
  }, [location.search]);

  const productById = useMemo(() => {
    const map = new Map();
    for (const p of products || []) map.set(Number(p.id), p);
    return map;
  }, [products]);

  const [filters, setFilters] = useState({
    productId: initialProductId || 'all',
    rating: 'all',
    published: 'all',
    search: '',
  });

  useEffect(() => {
    if (initialProductId) {
      setFilters((f) => ({ ...f, productId: initialProductId }));
    }
  }, [initialProductId]);

  const pageSize = 25;
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [isImportOpen, setIsImportOpen] = useState(false);

  const openCreate = () => {
    setEditing({
      id: null,
      product_id: filters.productId !== 'all' ? Number(filters.productId) : null,
      reviewer_name: '',
      reviewer_email: '',
      rating: 5,
      title: '',
      body: '',
      photo_url: '',
      verified_purchase: false,
      is_published: true,
      reviewed_at: '',
    });
    setIsEditOpen(true);
  };

  const openEdit = (r) => {
    setEditing({
      id: r.id,
      product_id: Number(r.product_id),
      reviewer_name: r.reviewer_name || '',
      reviewer_email: r.reviewer_email || '',
      rating: Number(r.rating || 0) || 5,
      title: r.title || '',
      body: r.body || '',
      photo_url: r.photo_url || '',
      verified_purchase: !!r.verified_purchase,
      is_published: !!r.is_published,
      reviewed_at: r.reviewed_at ? new Date(r.reviewed_at).toISOString().slice(0, 10) : '',
    });
    setIsEditOpen(true);
  };

  const closeEdit = () => {
    setIsEditOpen(false);
    setEditing(null);
  };

  const fetchPage = async ({ offset, append }) => {
    try {
      setError('');
      if (!append) setLoading(true);
      else setLoadingMore(true);

      let q = supabase
        .from('product_reviews')
        .select('*')
        .order('reviewed_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (filters.productId !== 'all') q = q.eq('product_id', Number(filters.productId));
      if (filters.rating !== 'all') q = q.eq('rating', Number(filters.rating));
      if (filters.published === 'published') q = q.eq('is_published', true);
      if (filters.published === 'unpublished') q = q.eq('is_published', false);

      const search = filters.search.trim();
      if (search) {
        const safe = search.replace(/%/g, '\\%').replace(/_/g, '\\_');
        q = q.or(`reviewer_name.ilike.%${safe}%,title.ilike.%${safe}%,body.ilike.%${safe}%`);
      }

      const { data, error: e } = await q;
      if (e) throw e;

      const next = data || [];
      setReviews((prev) => (append ? [...prev, ...next] : next));
      setHasMore(next.length === pageSize);
    } catch (e) {
      console.error(e);
      setError(e?.message || 'Failed to load reviews');
      if (!append) setReviews([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPage({ offset: 0, append: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.productId, filters.rating, filters.published, filters.search]);

  const loadMore = () => fetchPage({ offset: reviews.length, append: true });

  const handleTogglePublish = async (review) => {
    try {
      const next = !review.is_published;
      const { error: e } = await supabase.from('product_reviews').update({ is_published: next }).eq('id', review.id);
      if (e) throw e;
      setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, is_published: next } : r)));
    } catch (e) {
      alert(e?.message || 'Failed to update');
    }
  };

  const handleDelete = async (review) => {
    if (!confirm('Delete this review?')) return;
    try {
      const { error: e } = await supabase.from('product_reviews').delete().eq('id', review.id);
      if (e) throw e;
      setReviews((prev) => prev.filter((r) => r.id !== review.id));
    } catch (e) {
      alert(e?.message || 'Failed to delete');
    }
  };

  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef(null);

  const onPickPhoto = async (file) => {
    if (!file) return;
    try {
      setPhotoUploading(true);
      const res = await uploadImage(file, 'product-images', 'reviews');
      if (!res.success) throw new Error(res.error || 'Upload failed');
      setEditing((prev) => ({ ...prev, photo_url: res.url }));
    } catch (e) {
      alert(e?.message || 'Failed to upload photo');
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const saveReview = async () => {
    if (!editing) return;
    const productId = Number(editing.product_id);
    if (!Number.isFinite(productId)) return alert('Please select a product');

    const rating = Number(editing.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) return alert('Rating must be 1–5');

    const reviewerName = (editing.reviewer_name || '').trim() || 'Anonymous';
    const title = (editing.title || '').trim();
    const body = (editing.body || '').trim();
    if (!title && !body) return alert('Please add a title or body');

    const reviewedAt = editing.reviewed_at ? new Date(editing.reviewed_at) : null;
    const reviewedAtIso = reviewedAt && !Number.isNaN(reviewedAt.getTime()) ? reviewedAt.toISOString() : null;

    const payload = {
      product_id: productId,
      reviewer_name: reviewerName,
      reviewer_email: (editing.reviewer_email || '').trim() || null,
      rating,
      title: title || null,
      body: body || null,
      photo_url: (editing.photo_url || '').trim() || null,
      verified_purchase: !!editing.verified_purchase,
      is_published: !!editing.is_published,
      reviewed_at: reviewedAtIso,
    };

    try {
      if (!editing.id) {
        const { data, error: e } = await supabase
          .from('product_reviews')
          .insert([{ ...payload, source: 'manual' }])
          .select()
          .single();
        if (e) throw e;
        setReviews((prev) => [data, ...prev]);
      } else {
        const { data, error: e } = await supabase
          .from('product_reviews')
          .update(payload)
          .eq('id', editing.id)
          .select()
          .single();
        if (e) throw e;
        setReviews((prev) => prev.map((r) => (r.id === editing.id ? data : r)));
      }
      closeEdit();
    } catch (e) {
      alert(e?.message || 'Failed to save review');
    }
  };

  // CSV import
  const [csvState, setCsvState] = useState({
    fileName: '',
    preview: [],
    errors: [],
    parsed: [],
    importing: false,
    progress: { done: 0, total: 0 },
    result: null,
  });

  const resetCsv = () => {
    setCsvState({
      fileName: '',
      preview: [],
      errors: [],
      parsed: [],
      importing: false,
      progress: { done: 0, total: 0 },
      result: null,
    });
  };

  const handleCsvFile = async (file) => {
    resetCsv();
    if (!file) return;
    const text = await file.text();
    const matrix = parseCsv(text);
    if (matrix.length < 2) {
      setCsvState((s) => ({ ...s, fileName: file.name, errors: ['CSV must include a header row and at least one data row'] }));
      return;
    }

    const rawHeaders = matrix[0].map((h) => String(h || '').trim());
    const headers = rawHeaders.map((h) => h.toLowerCase());

    const idx = (name) => headers.indexOf(name);
    const required = ['product_id', 'rating', 'name'];
    const missing = required.filter((h) => idx(h) === -1);
    if (missing.length > 0) {
      setCsvState((s) => ({ ...s, fileName: file.name, errors: [`Missing required column(s): ${missing.join(', ')}`] }));
      return;
    }

    const get = (row, name) => {
      const i = idx(name);
      if (i === -1) return '';
      return row[i] ?? '';
    };

    const parsed = [];
    const errors = [];

    for (let r = 1; r < matrix.length; r++) {
      const row = matrix[r];
      if (!row || row.every((v) => String(v || '').trim() === '')) continue;

      const rowNum = r + 1; // 1-based incl header
      const productId = Number(get(row, 'product_id'));
      const rating = Number(get(row, 'rating'));
      const name = String(get(row, 'name') || '').trim() || 'Anonymous';
      const title = String(get(row, 'title') || '').trim();
      const body = String(get(row, 'body') || '').trim();
      const date = String(get(row, 'date') || '').trim();
      const verified = parseBoolean(get(row, 'verified'), false);
      const published = parseBoolean(get(row, 'published'), true);
      const photoUrl = String(get(row, 'photo_url') || '').trim();

      if (!Number.isFinite(productId)) errors.push(`Row ${rowNum}: invalid product_id`);
      if (!Number.isFinite(rating) || rating < 1 || rating > 5) errors.push(`Row ${rowNum}: rating must be 1–5`);
      if (!title && !body) errors.push(`Row ${rowNum}: provide title or body`);

      const reviewedAt = date ? new Date(date) : new Date();
      const reviewedAtIso = !Number.isNaN(reviewedAt.getTime()) ? reviewedAt.toISOString() : new Date().toISOString();

      parsed.push({
        product_id: productId,
        reviewer_name: name,
        rating,
        title: title || null,
        body: body || null,
        reviewed_at: reviewedAtIso,
        verified_purchase: verified,
        is_published: published,
        photo_url: photoUrl || null,
        source: 'csv',
      });
    }

    setCsvState((s) => ({
      ...s,
      fileName: file.name,
      parsed,
      preview: parsed.slice(0, 20),
      errors,
    }));
  };

  const runImport = async () => {
    if (csvState.errors.length > 0) return;
    if (!csvState.parsed.length) return;

    const batchSize = 300;
    const total = csvState.parsed.length;
    setCsvState((s) => ({ ...s, importing: true, progress: { done: 0, total }, result: null }));

    let inserted = 0;
    try {
      for (let i = 0; i < total; i += batchSize) {
        const batch = csvState.parsed.slice(i, i + batchSize);
        const { error: e } = await supabase.from('product_reviews').insert(batch);
        if (e) throw e;
        inserted += batch.length;
        setCsvState((s) => ({ ...s, progress: { done: Math.min(i + batch.length, total), total } }));
      }

      setCsvState((s) => ({ ...s, importing: false, result: { inserted } }));
      // Refresh list after import
      fetchPage({ offset: 0, append: false });
    } catch (e) {
      setCsvState((s) => ({ ...s, importing: false, result: { inserted, error: e?.message || 'Import failed' } }));
    }
  };

  const selectedProductName = (pid) => {
    const p = productById.get(Number(pid));
    return p?.title || `#${pid}`;
  };

  return (
    <div className="p-8" style={{ backgroundColor: '#F1F2F4', minHeight: '100vh' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[32px] font-semibold text-[#1F1F1F]">Reviews</h1>
          <p className="text-sm text-gray-500 mt-1">Manage product reviews shown on your storefront.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E1E3E5] rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Upload size={18} />
            Import CSV
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Add review
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E1E3E5] shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="px-4 py-4 border-b border-[#E1E3E5] grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Product</label>
            <select
              value={filters.productId}
              onChange={(e) => {
                const val = e.target.value;
                setFilters((f) => ({ ...f, productId: val === 'all' ? 'all' : Number(val) }));
                if (val === 'all') navigate('/reviews');
                else navigate(`/reviews?productId=${val}`);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              disabled={productsLoading}
            >
              <option value="all">All products</option>
              {(products || []).map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Rating</label>
            <select
              value={filters.rating}
              onChange={(e) => setFilters((f) => ({ ...f, rating: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="5">5</option>
              <option value="4">4</option>
              <option value="3">3</option>
              <option value="2">2</option>
              <option value="1">1</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Published</label>
            <select
              value={filters.published}
              onChange={(e) => setFilters((f) => ({ ...f, published: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Search</label>
            <input
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              placeholder="Name, title, body…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="px-4 py-3 border-b border-[#E1E3E5] text-xs font-semibold text-gray-500 uppercase tracking-wider grid grid-cols-12 gap-3">
          <div className="col-span-3">Product</div>
          <div className="col-span-2">Reviewer</div>
          <div className="col-span-2">Rating</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-1">Badges</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {loading ? (
          <div className="p-10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="p-6 text-red-600">{error}</div>
        ) : reviews.length === 0 ? (
          <div className="p-10 text-center text-gray-500">No reviews found.</div>
        ) : (
          <div>
            {reviews.map((r, idx) => (
              <div
                key={r.id}
                className="px-4 py-4 grid grid-cols-12 gap-3 items-center hover:bg-gray-50"
                style={{ borderBottom: idx !== reviews.length - 1 ? '1px solid #E1E3E5' : 'none' }}
              >
                <div className="col-span-3 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {selectedProductName(r.product_id)}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {r.title ? r.title : (r.body ? String(r.body).slice(0, 60) : '')}
                  </div>
                </div>

                <div className="col-span-2 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{r.reviewer_name || 'Anonymous'}</div>
                  <div className="text-xs text-gray-500 truncate">{r.source || 'manual'}</div>
                </div>

                <div className="col-span-2 flex items-center gap-2">
                  <StarRow value={r.rating} />
                  <span className="text-sm text-gray-700">{Number(r.rating).toFixed(0)}</span>
                </div>

                <div className="col-span-2 text-sm text-gray-700">{formatDate(r.reviewed_at)}</div>

                <div className="col-span-1 flex items-center gap-2 text-gray-600">
                  {r.verified_purchase && <BadgeCheck size={18} className="text-emerald-600" title="Verified purchase" />}
                  {r.photo_url && <ImageIcon size={18} className="text-gray-500" title="Has photo" />}
                </div>

                <div className="col-span-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleTogglePublish(r)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-700"
                    title={r.is_published ? 'Unpublish' : 'Publish'}
                  >
                    {r.is_published ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <button
                    onClick={() => openEdit(r)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-700"
                    title="Edit"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(r)}
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-700 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}

            {hasMore && (
              <div className="p-4 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-60"
                >
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {isEditOpen && editing && (
        <Modal title={editing.id ? 'Edit review' : 'Add review'} onClose={closeEdit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
              <select
                value={editing.product_id || ''}
                onChange={(e) => setEditing((p) => ({ ...p, product_id: e.target.value ? Number(e.target.value) : null }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a product…</option>
                {(products || []).map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reviewer name</label>
              <input
                value={editing.reviewer_name}
                onChange={(e) => setEditing((p) => ({ ...p, reviewer_name: e.target.value }))}
                placeholder="Anonymous"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reviewer email (optional)</label>
              <input
                value={editing.reviewer_email}
                onChange={(e) => setEditing((p) => ({ ...p, reviewer_email: e.target.value }))}
                placeholder="name@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
              <select
                value={editing.rating}
                onChange={(e) => setEditing((p) => ({ ...p, rating: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reviewed date (optional)</label>
              <input
                type="date"
                value={editing.reviewed_at}
                onChange={(e) => setEditing((p) => ({ ...p, reviewed_at: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
              <input
                value={editing.title}
                onChange={(e) => setEditing((p) => ({ ...p, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Body (optional)</label>
              <textarea
                value={editing.body}
                onChange={(e) => setEditing((p) => ({ ...p, body: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Provide at least a title or body.</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Photo (optional)</label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => onPickPhoto(e.target.files?.[0])}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoUploading}
                  className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-60"
                >
                  {photoUploading ? 'Uploading…' : 'Upload photo'}
                </button>
                {editing.photo_url && (
                  <>
                    <a
                      href={editing.photo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-blue-600 hover:underline truncate max-w-[320px]"
                    >
                      {editing.photo_url}
                    </a>
                    <button
                      onClick={() => setEditing((p) => ({ ...p, photo_url: '' }))}
                      className="px-2 py-2 rounded-lg hover:bg-gray-100 text-gray-600"
                      title="Remove photo"
                    >
                      <X size={16} />
                    </button>
                  </>
                )}
              </div>
              {editing.photo_url && (
                <div className="mt-3">
                  <img src={editing.photo_url} alt="" className="w-32 h-32 object-cover rounded-lg border" />
                </div>
              )}
            </div>

            <div className="md:col-span-2 flex items-center justify-between mt-2">
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={editing.verified_purchase}
                    onChange={(e) => setEditing((p) => ({ ...p, verified_purchase: e.target.checked }))}
                  />
                  Verified purchase
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={editing.is_published}
                    onChange={(e) => setEditing((p) => ({ ...p, is_published: e.target.checked }))}
                  />
                  Published
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={closeEdit}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveReview}
                  disabled={photoUploading}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {isImportOpen && (
        <Modal
          title="Import reviews from CSV"
          onClose={() => {
            setIsImportOpen(false);
            resetCsv();
          }}
          widthClass="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="text-sm text-gray-700">
              <div className="font-medium text-gray-900 mb-1">Required columns</div>
              <div className="text-gray-600">
                <code className="bg-gray-100 px-1 py-0.5 rounded">product_id</code>,{' '}
                <code className="bg-gray-100 px-1 py-0.5 rounded">rating</code>,{' '}
                <code className="bg-gray-100 px-1 py-0.5 rounded">name</code>
              </div>
              <div className="mt-2 text-gray-600">
                Optional: <code className="bg-gray-100 px-1 py-0.5 rounded">title</code>,{' '}
                <code className="bg-gray-100 px-1 py-0.5 rounded">body</code>,{' '}
                <code className="bg-gray-100 px-1 py-0.5 rounded">date</code>,{' '}
                <code className="bg-gray-100 px-1 py-0.5 rounded">verified</code>,{' '}
                <code className="bg-gray-100 px-1 py-0.5 rounded">photo_url</code>,{' '}
                <code className="bg-gray-100 px-1 py-0.5 rounded">published</code>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => handleCsvFile(e.target.files?.[0])}
              />
              {csvState.fileName && (
                <div className="text-sm text-gray-600 truncate">Selected: {csvState.fileName}</div>
              )}
            </div>

            {csvState.errors.length > 0 && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm space-y-1">
                {csvState.errors.slice(0, 15).map((err, i) => (
                  <div key={i}>{err}</div>
                ))}
                {csvState.errors.length > 15 && <div>…and {csvState.errors.length - 15} more</div>}
              </div>
            )}

            {csvState.preview.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Preview (first {Math.min(20, csvState.parsed.length)} of {csvState.parsed.length})
                </div>
                <div className="max-h-[280px] overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white border-b">
                      <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                        <th className="p-2">Product</th>
                        <th className="p-2">Name</th>
                        <th className="p-2">Rating</th>
                        <th className="p-2">Published</th>
                        <th className="p-2">Verified</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvState.preview.map((row, i) => (
                        <tr key={i} className="border-b last:border-b-0">
                          <td className="p-2">{selectedProductName(row.product_id)}</td>
                          <td className="p-2">{row.reviewer_name}</td>
                          <td className="p-2">{row.rating}</td>
                          <td className="p-2">{row.is_published ? 'Yes' : 'No'}</td>
                          <td className="p-2">{row.verified_purchase ? 'Yes' : 'No'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {csvState.result && (
              <div className={`p-3 rounded-lg text-sm ${csvState.result.error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {csvState.result.error ? (
                  <div>Import failed after inserting {csvState.result.inserted}: {csvState.result.error}</div>
                ) : (
                  <div>Imported {csvState.result.inserted} review(s).</div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-gray-600">
                {csvState.importing ? `Importing ${csvState.progress.done}/${csvState.progress.total}…` : null}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsImportOpen(false);
                    resetCsv();
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                  disabled={csvState.importing}
                >
                  Close
                </button>
                <button
                  onClick={runImport}
                  disabled={csvState.importing || csvState.errors.length > 0 || csvState.parsed.length === 0}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {csvState.importing ? 'Importing…' : 'Import'}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

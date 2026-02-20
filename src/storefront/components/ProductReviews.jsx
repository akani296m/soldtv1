import React, { useMemo, useState } from 'react';
import { Star, BadgeCheck, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { useProductReviews } from '../hooks/useProductReviews';

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

function ImageModal({ src, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative max-w-4xl w-full">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 px-3 py-2 rounded-lg bg-white/90 hover:bg-white text-gray-900 flex items-center gap-2"
        >
          <X size={16} />
          Close
        </button>
        <img src={src} alt="" className="w-full max-h-[80vh] object-contain rounded-xl bg-black" />
      </div>
    </div>
  );
}

export default function ProductReviews({ productId, ratingAverage = 0, ratingCount = 0 }) {
  const { reviews, loading, loadingMore, error, hasMore, loadMore } = useProductReviews(productId);
  const [activeImage, setActiveImage] = useState(null);

  const summary = useMemo(() => {
    const avg = clampRating(ratingAverage);
    const count = Number(ratingCount || 0);
    return { avg, count };
  }, [ratingAverage, ratingCount]);

  return (
    <section id="reviews" className="mt-12">
      <div className="flex items-start justify-between gap-6 flex-col md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reviews</h2>
          <div className="mt-2 flex items-center gap-3 text-sm text-gray-600">
            <StarRow value={summary.avg} size={16} />
            {summary.count > 0 ? (
              <span>{summary.avg.toFixed(1)} ({summary.count})</span>
            ) : (
              <span>No reviews yet</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="py-10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : reviews.length === 0 ? (
          <div className="text-gray-500">No reviews yet. Check back soon.</div>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="font-semibold text-gray-900">{r.reviewer_name || 'Anonymous'}</div>
                      {r.verified_purchase && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <BadgeCheck size={14} />
                          Verified
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-sm text-gray-600">
                      <StarRow value={r.rating} />
                      <span>{formatDate(r.reviewed_at)}</span>
                    </div>
                  </div>

                  {r.photo_url && (
                    <button
                      onClick={() => setActiveImage(r.photo_url)}
                      className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
                      title="View photo"
                    >
                      <ImageIcon size={16} />
                      Photo
                    </button>
                  )}
                </div>

                {(r.title || r.body) && (
                  <div className="mt-4">
                    {r.title && <div className="font-semibold text-gray-900">{r.title}</div>}
                    {r.body && <div className="mt-1 text-gray-700 whitespace-pre-wrap">{r.body}</div>}
                  </div>
                )}

                {r.photo_url && (
                  <button onClick={() => setActiveImage(r.photo_url)} className="mt-4 block">
                    <img
                      src={r.photo_url}
                      alt=""
                      className="w-36 h-36 object-cover rounded-lg border border-gray-200 hover:opacity-95"
                    />
                  </button>
                )}
              </div>
            ))}

            {hasMore && (
              <div className="pt-2">
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

      {activeImage && <ImageModal src={activeImage} onClose={() => setActiveImage(null)} />}
    </section>
  );
}

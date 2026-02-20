import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export function useProductReviews(productId, { pageSize = 8 } = {}) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const fetchPage = useCallback(async ({ offset, append }) => {
    if (!productId) {
      setReviews([]);
      setLoading(false);
      setHasMore(false);
      setError(null);
      return;
    }

    try {
      setError(null);
      if (!append) setLoading(true);
      else setLoadingMore(true);

      const { data, error: e } = await supabase
        .from('product_reviews')
        .select('id, product_id, reviewer_name, rating, title, body, photo_url, verified_purchase, reviewed_at')
        .eq('product_id', Number(productId))
        .eq('is_published', true)
        .order('reviewed_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (e) throw e;

      const next = data || [];
      setReviews((prev) => (append ? [...prev, ...next] : next));
      setHasMore(next.length === pageSize);
    } catch (err) {
      console.error('Error fetching product reviews:', err);
      setError(err?.message || 'Failed to load reviews');
      if (!append) setReviews([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [pageSize, productId]);

  const refresh = useCallback(() => fetchPage({ offset: 0, append: false }), [fetchPage]);
  const loadMore = useCallback(() => fetchPage({ offset: reviews.length, append: true }), [fetchPage, reviews.length]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    reviews,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}


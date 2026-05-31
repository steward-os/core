import { useState, useEffect } from 'react';
import pb from '../pb';

export const useRealtimeCollection = (collectionName, options = {}) => {
  const {
    filter = '',
    sort = '',
    expand = '',
    dependencies = [],
    initialData = [],
    transform = null,
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!collectionName) {
      setLoading(false);
      return;
    }

    let unsub;
    let isMounted = true;
    
    const subscribe = async () => {
      try {
        setLoading(true);
        setError(null);

        // Initial fetch first
        const queryOptions = {};
        if (filter) queryOptions.filter = filter;
        if (sort) queryOptions.sort = sort;
        if (expand) queryOptions.expand = expand;

        const rawInitial = await pb.collection(collectionName).getFullList(queryOptions);
        if (isMounted) {
          setData(transform ? await transform(rawInitial) : rawInitial);
          setLoading(false);
        }

        // Subscribe to real-time updates with delay to avoid auto-cancellation
        setTimeout(async () => {
          if (!isMounted) return;

          try {
            unsub = await pb.collection(collectionName).subscribe('*', async () => {
              try {
                const rawUpdated = await pb.collection(collectionName).getFullList(queryOptions);
                if (isMounted) {
                  setData(transform ? await transform(rawUpdated) : rawUpdated);
                }
              } catch (updateError) {
                if (isMounted && !updateError.isAbort) {
                  console.error(`Error updating ${collectionName}:`, updateError);
                  setError(updateError);
                }
              }
            });
          } catch (subscribeError) {
            if (isMounted && !subscribeError.isAbort) {
              console.error(`Error subscribing to ${collectionName}:`, subscribeError);
              setError(subscribeError);
            }
          }
        }, 100);
        
      } catch (subscribeError) {
        if (isMounted && !subscribeError.isAbort) {
          console.error(`Error subscribing to ${collectionName}:`, subscribeError);
          setError(subscribeError);
          setLoading(false);
        }
      }
    };

    subscribe();

    return () => {
      isMounted = false;
      if (unsub) {
        unsub();
      }
    };
  }, [collectionName, filter, sort, expand, ...dependencies]);

  const refresh = async () => {
    try {
      setError(null);
      const queryOptions = {};
      if (filter) queryOptions.filter = filter;
      if (sort) queryOptions.sort = sort;
      if (expand) queryOptions.expand = expand;

      const rawRefreshed = await pb.collection(collectionName).getFullList(queryOptions);
      setData(transform ? await transform(rawRefreshed) : rawRefreshed);
    } catch (refreshError) {
      console.error(`Error refreshing ${collectionName}:`, refreshError);
      setError(refreshError);
    }
  };

  return { data, loading, error, refresh, setData };
};
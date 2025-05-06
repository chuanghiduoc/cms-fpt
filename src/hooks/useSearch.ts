import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

type SearchType = 'all' | 'documents' | 'events' | 'announcements';

interface Department {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

export interface DocumentResult {
  id: string;
  title: string;
  description?: string;
  category: string;
  filePath: string;
  isPublic: boolean;
  createdAt: string;
  department?: Department;
  uploadedBy: User;
}

export interface EventResult {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
  isPublic: boolean;
  department?: Department;
  createdBy: User;
}

export interface AnnouncementResult {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  isPublic: boolean;
  department?: Department;
  createdBy: User;
}

interface Pagination {
  total: number;
  totalDocuments: number;
  totalEvents: number;
  totalAnnouncements: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface SearchResults {
  documents: DocumentResult[];
  events: EventResult[];
  announcements: AnnouncementResult[];
  pagination: Pagination;
}

interface UseSearchOptions {
  type?: SearchType;
  limit?: number;
  debounceMs?: number;
}

export function useSearch({
  type = 'all',
  limit = 10,
  debounceMs = 300
}: UseSearchOptions = {}) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchType, setSearchType] = useState<SearchType>(type);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => {
      clearTimeout(handler);
    };
  }, [query, debounceMs]);

  // Reset page when query or type changes
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, searchType]);

  // Perform search when debounced query changes
  const performSearch = useCallback(async () => {
    if (!debouncedQuery.trim()) {
      setResults(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/search?query=${encodeURIComponent(debouncedQuery)}&type=${searchType}&page=${page}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error('Search request failed');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error('Error performing search:', err);
      setError('Không thể tìm kiếm. Vui lòng thử lại sau.');
      toast.error('Không thể tìm kiếm. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, searchType, page, limit]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  const handleSearchTypeChange = useCallback((newType: SearchType) => {
    setSearchType(newType);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    page,
    searchType,
    handleSearchTypeChange,
    handlePageChange,
  };
} 
import React, { useState, useEffect, useMemo, useCallback } from 'react';

// Custom hook for localStorage
const useLocalStorage = (key, initialValue) => {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [key, value]);

  return [value, setValue];
};

// Custom hook for debounced value
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// ItemCard Component
const ItemCard = ({ item, isFavourite, onToggleFavourite }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-800">{item.name}</h3>
        <button
          onClick={() => onToggleFavourite(item.id)}
          className="text-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded"
          aria-label={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
        >
          {isFavourite ? '★' : '☆'}
        </button>
      </div>
      <p className="text-sm text-gray-600 mb-2">{item.category}</p>
      <div className="flex justify-between items-center">
        <span className="text-lg font-bold text-blue-600">${item.price.toFixed(2)}</span>
        <span className="text-sm text-yellow-600 flex items-center">
          ★ {item.rating.toFixed(1)}
        </span>
      </div>
    </div>
  );
};

// EmptyState Component
const EmptyState = ({ message }) => (
  <div className="text-center py-12">
    <p className="text-xl text-gray-500">{message}</p>
  </div>
);

// Loading Component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// Main App Component
export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showFavouritesOnly, setShowFavouritesOnly] = useState(false);
  const [favourites, setFavourites] = useLocalStorage('favourites', []);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch data from JSON file
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Simulate network delay for realistic loading state
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Fetch from JSON file
        const response = await fetch('/items.json');
        if (!response.ok) throw new Error('Failed to fetch items');
        
        const data = await response.json();
        setItems(data);
      } catch (error) {
        console.error('Error fetching items:', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(items.map(item => item.category))];
    return ['All', ...cats.sort()];
  }, [items]);

  // Toggle favourite
  const toggleFavourite = useCallback((id) => {
    setFavourites(prev => 
      prev.includes(id) 
        ? prev.filter(fId => fId !== id)
        : [...prev, id]
    );
  }, [setFavourites]);

  // Filtered and sorted items
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // Filter by search
    if (debouncedSearchTerm) {
      result = result.filter(item =>
        item.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (categoryFilter !== 'All') {
      result = result.filter(item => item.category === categoryFilter);
    }

    // Filter by favourites
    if (showFavouritesOnly) {
      result = result.filter(item => favourites.includes(item.id));
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'price' || sortBy === 'rating') {
        comparison = a[sortBy] - b[sortBy];
      } else {
        comparison = a.name.localeCompare(b.name);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [items, debouncedSearchTerm, categoryFilter, showFavouritesOnly, favourites, sortBy, sortOrder]);

  // Paginated items
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedItems, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedItems.length / itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, categoryFilter, showFavouritesOnly, sortBy, sortOrder]);

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Product Catalog</h1>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Product Catalog</h1>
        
        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Search products"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filter by category"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Sort Controls */}
            <button
              onClick={() => handleSortChange('price')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Price {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>

            <button
              onClick={() => handleSortChange('rating')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Rating {sortBy === 'rating' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>

            {/* Favourites Toggle */}
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showFavouritesOnly}
                onChange={(e) => setShowFavouritesOnly(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-700">Favourites Only</span>
            </label>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-gray-600">
          Showing {filteredAndSortedItems.length} result{filteredAndSortedItems.length !== 1 ? 's' : ''}
        </div>

        {/* Item Grid */}
        {paginatedItems.length === 0 ? (
          <EmptyState 
            message={showFavouritesOnly 
              ? "No favourites yet. Star some items to see them here!" 
              : "No products found. Try adjusting your filters."
            } 
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {paginatedItems.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  isFavourite={favourites.includes(item.id)}
                  onToggleFavourite={toggleFavourite}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/Layout/Navbar';
import searchService from '../../services/searchService';
import friendService from '../../services/friendService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { getFullAvatarUrl } = useAuth();
  const query = searchParams.get('q') || '';

  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'people' | 'posts'
  const [inputValue, setInputValue] = useState(query);

  const doSearch = useCallback(async (q) => {
    if (!q || q.trim().length < 2) {
      setUsers([]);
      setPosts([]);
      return;
    }
    setLoading(true);
    try {
      const response = await searchService.search(q.trim());
      // axiosClient đã bóc result nên response là { users: [], posts: [] }
      const data = response;
      setUsers(data?.users || data?.Users || []);
      setPosts(data?.posts || data?.Posts || []);
    } catch (error) {
      console.error('Search error:', error);
      toast.error(error.errorMessage || 'Không thể tìm kiếm, thử lại sau!');
    } finally {
      setLoading(false);
    }
  }, []);

  // Gọi API khi query thay đổi
  useEffect(() => {
    doSearch(query);
    setInputValue(query);
  }, [query]);

  // Debounce: Cập nhật URL khi người dùng gõ
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue.trim().length >= 2) {
        setSearchParams({ q: inputValue.trim() });
      } else if (inputValue.trim().length === 0) {
        setSearchParams({});
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const handleAddFriend = async (userId, fullName) => {
    try {
      await friendService.sendRequest(userId);
      toast.success(`Đã gửi lời mời kết bạn đến ${fullName}!`);
    } catch {
      toast.error('Không thể gửi lời mời. Có thể đã gửi rồi!');
    }
  };

  const showUsers = activeTab === 'all' || activeTab === 'people';
  const showPosts = activeTab === 'all' || activeTab === 'posts';
  const hasResults = users.length > 0 || posts.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 pt-8 pb-16">

        {/* Search Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 bg-white rounded-2xl shadow-lg border border-gray-100 px-5 py-4 focus-within:ring-2 focus-within:ring-indigo-400 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Tìm người dùng hoặc bài viết..."
              className="flex-1 outline-none text-base font-medium text-gray-800 placeholder:text-gray-400 bg-transparent"
              autoFocus
            />
            {inputValue && (
              <button
                onClick={() => { setInputValue(''); setSearchParams({}); }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        {query && (
          <div className="flex gap-2 mb-6">
            {['all', 'people', 'posts'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                }`}
              >
                {tab === 'all' ? 'Tất cả' : tab === 'people' ? `People (${users.length})` : `Posts (${posts.length})`}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
              <p className="text-sm text-gray-500 font-medium">Đang tìm kiếm...</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && query && !hasResults && (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-lg font-semibold">Không tìm thấy kết quả</p>
            <p className="text-sm mt-1">Thử từ khóa khác nhé!</p>
          </div>
        )}

        {/* Initial state */}
        {!loading && !query && (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-lg font-semibold">Tìm kiếm người dùng & bài viết</p>
            <p className="text-sm mt-1">Nhập ít nhất 2 ký tự để bắt đầu</p>
          </div>
        )}

        {/* People Section */}
        {!loading && showUsers && users.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-gradient-to-b from-indigo-600 to-blue-600 rounded-full"></div>
              <h2 className="font-black text-gray-700 uppercase tracking-widest text-xs">People</h2>
              <span className="ml-auto text-xs text-gray-400 font-medium">{users.length} kết quả</span>
            </div>
            <div className="space-y-3">
              {users.map((u) => (
                <div
                  key={u.userId}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md hover:border-indigo-100 transition-all duration-200 group"
                >
                  <Link to={`/profile/${u.userId}`} className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex-shrink-0 overflow-hidden">
                    {u.avatarUrl ? (
                      <img
                        src={getFullAvatarUrl(u.avatarUrl)}
                        alt={u.fullName}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName || 'U')}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                        {u.fullName?.charAt(0) || 'U'}
                      </div>
                    )}
                  </Link>
                  <Link to={`/profile/${u.userId}`} className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">{u.fullName}</p>
                    <p className="text-xs text-gray-500 truncate">@{u.username}</p>
                  </Link>
                  <button
                    onClick={() => handleAddFriend(u.userId, u.fullName)}
                    className="flex-shrink-0 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all transform hover:scale-105"
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Posts Section */}
        {!loading && showPosts && posts.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-gradient-to-b from-purple-600 to-pink-600 rounded-full"></div>
              <h2 className="font-black text-gray-700 uppercase tracking-widest text-xs">Posts</h2>
              <span className="ml-auto text-xs text-gray-400 font-medium">{posts.length} kết quả</span>
            </div>
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.postId}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-purple-100 transition-all duration-200"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Link to={`/profile/${post.authorId}`} className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex-shrink-0 overflow-hidden">
                      {post.avatarUrl ? (
                        <img
                          src={getFullAvatarUrl(post.avatarUrl)}
                          alt={post.fullName}
                          className="w-full h-full object-cover"
                          onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(post.fullName || 'U')}`}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-bold">
                          {post.fullName?.charAt(0) || 'U'}
                        </div>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/profile/${post.authorId}`} className="font-bold text-gray-900 hover:text-indigo-600 transition-colors text-sm truncate block">
                        {post.fullName}
                      </Link>
                      <p className="text-xs text-gray-400">
                        {post.createdAt ? new Date(post.createdAt).toLocaleDateString('vi-VN') : ''}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-800 leading-relaxed line-clamp-3">{post.postContent}</p>

                  {post.imageUrl && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-gray-100">
                      <img
                        src={`${process.env.REACT_APP_API_URL || 'https://social-mini-app.onrender.com/api'}${post.imageUrl}`}
                        alt="post"
                        className="w-full max-h-64 object-cover"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
                    <span className="flex items-center gap-1.5 text-xs text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-rose-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                      {post.likeCount}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {post.commentCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Search;

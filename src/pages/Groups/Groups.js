import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Layout/Navbar';
import { useAuth } from '../../context/AuthContext';
import groupService from '../../services/groupService';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

const glass = {
  card: {
    background: 'rgba(255,255,255,0.65)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.55)',
    boxShadow: '0 8px 32px rgba(99,102,241,0.06), 0 2px 8px rgba(0,0,0,0.04)',
  }
};

const Groups = () => {
  const { user, getFullAvatarUrl } = useAuth();
  const { t } = useTranslation();
  const [myGroups, setMyGroups] = useState([]);
  const [discoverGroups, setDiscoverGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', privacy: 'Public', category: '' });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const myRes = await groupService.getMyGroups();
      setMyGroups(Array.isArray(myRes) ? myRes : (myRes?.$values || []));
      
      const discoverRes = await groupService.searchGroups('');
      setDiscoverGroups(Array.isArray(discoverRes) ? discoverRes : (discoverRes?.$values || []));
    } catch (error) {
      toast.error("Không thể tải danh sách nhóm");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const res = await groupService.searchGroups(searchTerm);
      setDiscoverGroups(Array.isArray(res) ? res : (res?.$values || []));
    } catch (error) {
      toast.error("Lỗi tìm kiếm");
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await groupService.createGroup(newGroup);
      toast.success("Tạo nhóm thành công!");
      setIsCreateModalOpen(false);
      setNewGroup({ name: '', description: '', privacy: 'Public', category: '' });
      fetchGroups();
    } catch (error) {
      toast.error("Lỗi tạo nhóm");
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      await groupService.joinGroup(groupId);
      toast.success("Đã gửi yêu cầu tham gia!");
      fetchGroups();
    } catch (error) {
      toast.error("Lỗi tham gia nhóm");
    }
  };

  return (
    <div className="min-h-screen" style={{
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      background: 'linear-gradient(135deg, #f0f0ff 0%, #f5f0ff 30%, #fdf4ff 60%, #f0f6ff 100%)',
    }}>
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Cộng đồng</h1>
            <p className="text-slate-500">Khám phá và kết nối với những người cùng sở thích</p>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95 transition-all"
          >
            + Tạo nhóm mới
          </button>
        </div>

        {/* My Groups Section */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
            Nhóm của bạn
          </h2>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 rounded-3xl animate-pulse bg-white/50 border border-white"></div>
              ))}
            </div>
          ) : myGroups.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {myGroups.map(group => (
                <Link key={group.groupId} to={`/groups/${group.groupId}`} 
                  className="group block rounded-3xl p-6 transition-all duration-300 hover:translate-y-[-4px]"
                  style={glass.card}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-indigo-600 overflow-hidden shadow-inner">
                      {group.avatarUrl ? (
                        <img src={group.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-black">{group.name[0].toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{group.name}</h3>
                      <p className="text-xs text-slate-400">{group.privacy === 'Public' ? 'Công khai' : 'Riêng tư'}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">{group.description || 'Không có mô tả'}</p>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">Đã tham gia</span>
                    <span className="text-xs text-slate-400 italic">Xem chi tiết →</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white/30 border border-white/50 rounded-3xl p-12 text-center">
              <p className="text-slate-400 font-medium">Bạn chưa tham gia nhóm nào. Hãy khám phá bên dưới nhé!</p>
            </div>
          )}
        </section>

        {/* Discover Groups Section */}
        <section>
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2 h-8 bg-violet-500 rounded-full"></span>
              Khám phá cộng đồng
            </h2>
            <form onSubmit={handleSearch} className="relative w-full sm:w-80">
              <input 
                type="text" 
                placeholder="Tìm kiếm nhóm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/80 border border-white rounded-2xl focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </form>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {discoverGroups.filter(dg => !myGroups.some(mg => mg.groupId === dg.groupId)).map(group => (
              <div key={group.groupId} 
                className="rounded-3xl p-5 transition-all duration-300"
                style={glass.card}
              >
                <div className="w-full aspect-video rounded-2xl bg-slate-100 mb-4 overflow-hidden">
                  {group.coverUrl ? (
                    <img src={group.coverUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-100 flex items-center justify-center">
                      <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-slate-800 mb-1 truncate">{group.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 h-8 mb-4">{group.description || 'Tham gia để cùng thảo luận'}</p>
                <button 
                  onClick={() => handleJoinGroup(group.groupId)}
                  className="w-full py-2 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-600 hover:text-white transition-all text-sm"
                >
                  Tham gia
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Create Group Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden p-8">
            <h2 className="text-2xl font-black text-slate-800 mb-6">Tạo nhóm mới</h2>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tên nhóm</label>
                <input 
                  type="text" 
                  required
                  placeholder="Nhập tên nhóm..."
                  value={newGroup.name}
                  onChange={e => setNewGroup({...newGroup, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Mô tả</label>
                <textarea 
                  placeholder="Mô tả mục đích của nhóm..."
                  value={newGroup.description}
                  onChange={e => setNewGroup({...newGroup, description: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-400 outline-none h-24 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Quyền riêng tư</label>
                <select 
                  value={newGroup.privacy}
                  onChange={e => setNewGroup({...newGroup, privacy: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-400 outline-none"
                >
                  <option value="Public">Công khai</option>
                  <option value="Private">Riêng tư</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Lĩnh vực / Sở thích</label>
                <select 
                  value={newGroup.category}
                  onChange={e => setNewGroup({...newGroup, category: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-400 outline-none"
                >
                  <option value="">Chọn lĩnh vực...</option>
                  {["Công nghệ", "Đánh cầu", "Du lịch", "Ẩm thực", "Âm nhạc", "Phim ảnh", "Kinh doanh", "Thể thao", "Nghệ thuật"].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                  Tạo ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;

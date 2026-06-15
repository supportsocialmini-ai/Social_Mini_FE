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
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteActionLoading, setInviteActionLoading] = useState({}); // { [groupId]: 'accept'|'decline' }
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', privacy: 'Public', category: '' });
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  const PRESET_CATEGORIES = ["Công nghệ", "Kinh doanh", "Giải trí", "Giáo dục", "Khoa học", "Sức khỏe", "Thể thao", "Nghệ thuật", "Xã hội", "Đời sống", "Văn hóa", "Thiên nhiên", "Chính trị", "Tôn giáo", "Công nghiệp", "Truyền thông", "Mua sắm", "Du lịch", "Ẩm thực", "Thời trang", "Gia đình", "Quan hệ", "Nghề nghiệp", "Tài chính", "Nhà cửa", "Xe cộ", "Cộng đồng", "Sở thích", "Hoạt động ngoài trời", "Phát triển bản thân"];

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

      const inviteRes = await groupService.getPendingInvites();
      setPendingInvites(Array.isArray(inviteRes) ? inviteRes : (inviteRes?.$values || []));
    } catch (error) {
      toast.error("Không thể tải danh sách nhóm");
    } finally {
      setLoading(false);
    }
  };


  const handleCreateGroup = async (e) => {
    e.preventDefault();
    const finalCategory = newGroup.category === 'Other' ? customCategoryName.trim() : newGroup.category;
    if (!finalCategory) {
      toast.warn("Vui lòng chọn lĩnh vực cho nhóm!");
      return;
    }
    try {
      await groupService.createGroup({
        ...newGroup,
        category: finalCategory
      });
      toast.success("Tạo nhóm thành công!");
      setIsCreateModalOpen(false);
      setNewGroup({ name: '', description: '', privacy: 'Public', category: '' });
      setCustomCategoryName('');
      setShowCustomCategory(false);
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

  const handleAcceptInvite = async (groupId) => {
    setInviteActionLoading(prev => ({ ...prev, [groupId]: 'accept' }));
    try {
      await groupService.acceptInvite(groupId);
      toast.success('Đã chấp nhận lời mời! Chào mừng bạn đến với nhóm 🎉');
      setPendingInvites(prev => prev.filter(inv => inv.groupId !== groupId));
      fetchGroups();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Không thể chấp nhận lời mời');
    } finally {
      setInviteActionLoading(prev => { const n = {...prev}; delete n[groupId]; return n; });
    }
  };

  const handleDeclineInvite = async (groupId) => {
    setInviteActionLoading(prev => ({ ...prev, [groupId]: 'decline' }));
    try {
      await groupService.declineInvite(groupId);
      toast.info('Đã từ chối lời mời');
      setPendingInvites(prev => prev.filter(inv => inv.groupId !== groupId));
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Không thể từ chối lời mời');
    } finally {
      setInviteActionLoading(prev => { const n = {...prev}; delete n[groupId]; return n; });
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
            onClick={() => {
              setIsCreateModalOpen(true);
              setIsCategoryDropdownOpen(false);
              setShowCustomCategory(false);
              setCustomCategoryName('');
            }}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95 transition-all"
          >
            + Tạo nhóm mới
          </button>
        </div>

        {/* Pending Invites Section */}
        {pendingInvites.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-8 bg-amber-500 rounded-full"></span>
              Lời mời tham gia nhóm
              <span className="ml-1 px-2.5 py-0.5 bg-amber-500 text-white text-xs font-black rounded-full">{pendingInvites.length}</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {pendingInvites.map(invite => {
                const gId = invite.groupId;
                const isActioning = !!inviteActionLoading[gId];
                const actionType = inviteActionLoading[gId];
                return (
                  <div key={gId} className="rounded-3xl p-5 flex flex-col gap-4 border-2 border-amber-100"
                    style={{ background: 'rgba(255,251,235,0.85)', backdropFilter: 'blur(20px)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-amber-600 overflow-hidden shadow-inner flex-shrink-0">
                        {invite.groupAvatarUrl ? (
                          <img src={invite.groupAvatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl font-black">{(invite.groupName || 'G')[0].toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-800 truncate">{invite.groupName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {invite.groupCategory && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase tracking-wider">
                              {invite.groupCategory}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">
                            {invite.groupPrivacy === 'Public' ? '🌐 Công khai' : '🔒 Riêng tư'}
                          </span>
                        </div>
                      </div>
                      {/* Bell badge */}
                      <div className="flex-shrink-0 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center shadow-md shadow-amber-200">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-xs text-amber-700 font-semibold">Bạn được mời vào nhóm này</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleDeclineInvite(gId)}
                        disabled={isActioning}
                        className="flex-1 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all active:scale-[0.97] disabled:opacity-60 flex items-center justify-center gap-1.5"
                      >
                        {actionType === 'decline' ? (
                          <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                        Từ chối
                      </button>
                      <button
                        onClick={() => handleAcceptInvite(gId)}
                        disabled={isActioning}
                        className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-sm hover:from-green-600 hover:to-emerald-600 transition-all active:scale-[0.97] shadow-md shadow-green-200 disabled:opacity-60 flex items-center justify-center gap-1.5"
                      >
                        {actionType === 'accept' ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        Chấp nhận
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

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
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2 h-8 bg-violet-500 rounded-full"></span>
            <h2 className="text-xl font-bold text-slate-800">Khám phá cộng đồng</h2>
          </div>

          {discoverGroups.filter(dg => !myGroups.some(mg => mg.groupId === dg.groupId)).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {discoverGroups.filter(dg => !myGroups.some(mg => mg.groupId === dg.groupId)).map(group => (
                <div key={group.groupId}
                  className="rounded-3xl p-5 transition-all duration-300 hover:translate-y-[-4px]"
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
                  {group.category && (
                    <span className="inline-block text-[10px] font-black px-2 py-0.5 rounded-full bg-violet-50 text-violet-500 border border-violet-100 uppercase tracking-wider mb-2">
                      {group.category}
                    </span>
                  )}
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
          ) : (
            <div className="bg-white/30 border border-white/50 rounded-3xl p-12 text-center">
              <p className="text-slate-400 font-medium">Chưa có cộng đồng nào để khám phá</p>
            </div>
          )}
        </section>
      </div>

      {/* Create Group Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8">
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
              <div className="relative">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Lĩnh vực <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-400 outline-none font-semibold text-slate-700 cursor-pointer flex items-center justify-between text-left"
                  >
                    <span>
                      {newGroup.category === 'Other' 
                        ? (customCategoryName.trim() ? customCategoryName : "Lĩnh vực khác...") 
                        : (newGroup.category || "Chọn lĩnh vực...")}
                    </span>
                    <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {isCategoryDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-[30001]" onClick={() => setIsCategoryDropdownOpen(false)} />
                      <div className="absolute z-[30002] left-0 right-0 mt-1.5 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto py-2 animate-in fade-in slide-in-from-top-1 duration-150 custom-scrollbar">
                        <button
                          type="button"
                          onClick={() => {
                            setNewGroup({...newGroup, category: ''});
                            setShowCustomCategory(false);
                            setIsCategoryDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm font-semibold text-slate-400 hover:bg-slate-50 transition-colors"
                        >
                          Chọn lĩnh vực...
                        </button>
                        {PRESET_CATEGORIES.map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              setNewGroup({...newGroup, category: cat});
                              setShowCustomCategory(false);
                              setIsCategoryDropdownOpen(false);
                            }}
                            className={`w-full px-4 py-2.5 text-left text-sm font-semibold transition-colors flex items-center justify-between ${
                              newGroup.category === cat ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span>{cat}</span>
                            {newGroup.category === cat && (
                              <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setNewGroup({...newGroup, category: 'Other'});
                            setShowCustomCategory(true);
                            setIsCategoryDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2.5 text-left text-sm font-semibold transition-colors flex items-center justify-between ${
                            newGroup.category === 'Other' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>Lĩnh vực khác...</span>
                          {newGroup.category === 'Other' && (
                            <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {showCustomCategory && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Nhập lĩnh vực khác <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="Nhập tên lĩnh vực khác..."
                    value={customCategoryName}
                    onChange={e => setCustomCategoryName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-400 outline-none"
                  />
                </div>
              )}
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

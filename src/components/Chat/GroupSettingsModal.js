import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import messageService from '../../services/messageService';
import { useAuth } from '../../context/AuthContext';

const GroupSettingsModal = ({ group, onClose, onGroupUpdated, getFullAvatarUrl }) => {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState(null);

  const isAdmin = group.isAdmin || group.CreatorId === user?.userId;

  useEffect(() => {
    fetchMembers();
  }, [group.conversationId]);

  const fetchMembers = async () => {
    try {
      const res = await messageService.getGroupMembers(group.conversationId);
      const data = res?.result?.$values || res?.$values || res || [];
      setMembers(data);
    } catch (e) {
      console.error(e);
      toast.error('Không thể tải danh sách thành viên');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUpdatingAvatar(true);
    try {
      const res = await messageService.uploadImage(file);
      const imageUrl = res?.imageUrl || res?.result || res;
      if (imageUrl) {
        await messageService.updateGroupAvatar(group.conversationId, imageUrl);
        toast.success('Cập nhật đại diện nhóm thành công!');
        onGroupUpdated({ ...group, displayAvatar: getFullAvatarUrl(imageUrl), avatarUrl: imageUrl });
      }
    } catch (e) {
      console.error(e);
      toast.error('Lỗi khi cập nhật ảnh nhóm');
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Bạn có chắc muốn xóa thành viên này khỏi nhóm?')) return;

    setRemovingMemberId(memberId);
    try {
      await messageService.removeMember(group.conversationId, memberId);
      toast.success('Đã xóa thành viên!');
      setMembers(prev => prev.filter(m => (m.userId || m.UserId) !== memberId));
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'Lỗi khi xóa thành viên');
    } finally {
      setRemovingMemberId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <h2 className="text-xl font-black text-slate-800">Cài đặt nhóm</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-black text-3xl shadow-xl overflow-hidden border-4 border-white">
                {group.displayAvatar ? (
                  <img src={group.displayAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span>{group.displayName?.charAt(0).toUpperCase()}</span>
                )}
                {updatingAvatar && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              {isAdmin && (
                <label className="absolute -bottom-2 -right-2 p-2.5 bg-white shadow-lg rounded-xl cursor-pointer text-indigo-600 hover:text-indigo-700 hover:scale-110 transition-all border border-slate-100">
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} disabled={updatingAvatar} />
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </label>
              )}
            </div>
            <div className="text-center">
              <h3 className="font-black text-slate-800 text-lg">{group.displayName}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest p-1 bg-slate-100 rounded-lg inline-block mt-1">
                {members.length} thành viên
              </p>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Members List */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">Danh sách thành viên</label>
            <div className="space-y-2">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                members.map((m) => {
                  const mId = m.userId || m.UserId;
                  const isTargetAdmin = m.isAdmin || m.IsAdmin;
                  const isMe = mId === user?.userId;
                  const isCreator = mId === group.CreatorId;

                  return (
                    <div key={mId} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border border-slate-200/50 flex-shrink-0">
                        <img 
                          src={getFullAvatarUrl(m.avatarUrl || m.AvatarUrl)} 
                          alt="" 
                          className="w-full h-full object-cover"
                          onError={e => e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(m.fullName || m.username)}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm truncate">{m.fullName || m.username}</span>
                          {isCreator && (
                            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[8px] font-black uppercase rounded shadow-sm">Trưởng nhóm</span>
                          )}
                          {isTargetAdmin && !isCreator && (
                            <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase rounded shadow-sm">Admin</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">@{m.username}</p>
                      </div>
                      
                      {isAdmin && !isMe && !isCreator && (
                        <button 
                          onClick={() => handleRemoveMember(mId)}
                          disabled={removingMemberId === mId}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                          title="Xóa khỏi nhóm"
                        >
                          {removingMemberId === mId ? (
                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/50">
          <button onClick={onClose} className="w-full py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-[0.98]">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupSettingsModal;

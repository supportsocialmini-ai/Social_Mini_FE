import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import userService from '../../services/userService';
import messageService from '../../services/messageService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const CreateGroupModal = ({ onClose, onGroupCreated, getFullAvatarUrl }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [friends, setFriends] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await userService.getUsers();
        const data = res?.$values || res || [];
        setFriends(
          (Array.isArray(data) ? data : [])
            .filter(u => u.userId !== user?.userId)
            .map(u => ({
              ...u,
              displayName: u.fullName || u.username || 'Người dùng',
              displayAvatar: getFullAvatarUrl(u.avatarUrl) || ''
            }))
        );
      } catch (e) {
        console.error(e);
      } finally {
        setFetching(false);
      }
    };
    fetchFriends();
  }, []);

  const toggleMember = (userId) => {
    setSelectedIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      toast.error('Vui lòng nhập tên nhóm!');
      return;
    }
    if (selectedIds.length < 1) {
      toast.error('Chọn ít nhất 1 thành viên!');
      return;
    }

    setLoading(true);
    try {
      const res = await messageService.createGroup(groupName.trim(), selectedIds);
      const newGroup = res?.result || res;
      toast.success(`Tạo nhóm "${groupName}" thành công!`);
      onGroupCreated(newGroup, selectedIds);
      onClose();
    } catch (e) {
      toast.error('Tạo nhóm thất bại, thử lại nhé!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className="text-xl font-black text-slate-800">Tạo nhóm mới</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Group name input */}
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">
              Tên nhóm
            </label>
            <input
              type="text"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="Nhập tên nhóm..."
              maxLength={100}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all font-medium text-sm"
            />
          </div>

          {/* Member selection */}
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">
              Thêm thành viên ({selectedIds.length} đã chọn)
            </label>
            <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {fetching ? (
                <div className="text-center py-6">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : friends.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm font-medium">
                  Không có người dùng nào
                </div>
              ) : (
                friends.map(f => {
                  const isSelected = selectedIds.includes(f.userId);
                  return (
                    <button
                      key={f.userId}
                      onClick={() => toggleMember(f.userId)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                        isSelected ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="relative w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-slate-100">
                        <img
                          src={f.displayAvatar}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={e => e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(f.displayName)}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-800 text-sm truncate">{f.displayName}</div>
                        <div className="text-xs text-slate-400">@{f.username}</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected ? 'bg-indigo-600' : 'border-2 border-slate-300'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all"
          >
            Hủy
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !groupName.trim() || selectedIds.length < 1}
            className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-indigo-100 transition-all active:scale-95"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            ) : (
              'Tạo nhóm'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;

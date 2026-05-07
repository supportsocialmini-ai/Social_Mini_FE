import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/Layout/Navbar';
import PostCard from '../../components/Post/PostCard';
import PostCreator from '../../components/Post/PostCreator';
import { useAuth } from '../../context/AuthContext';
import groupService from '../../services/groupService';
import { toast } from 'react-toastify';
import { useChat } from '../../context/ChatContext';

const glass = {
  card: {
    background: 'rgba(255,255,255,0.65)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.55)',
    boxShadow: '0 8px 32px rgba(99,102,241,0.06), 0 2px 8px rgba(0,0,0,0.04)',
  }
};

const GroupDetail = () => {
  const { groupId } = useParams();
  const { user, getFullAvatarUrl } = useAuth();
  const { handleOpenChat } = useChat();
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    fetchGroupData();
  }, [groupId]);

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      const groupData = await groupService.getGroupById(groupId);
      setGroup(groupData);

      const membersData = await groupService.getGroupMembers(groupId);
      const memberList = Array.isArray(membersData) ? membersData : (membersData?.$values || []);
      setMembers(memberList);
      setIsMember(memberList.some(m => m.userId === user?.userId));

      const postsData = await groupService.getGroupPosts(groupId);
      const postList = Array.isArray(postsData) ? postsData : (postsData?.$values || []);
      setPosts(postList.map(post => ({
        ...post,
        postId: post.postId || post.id,
        author: post.fullName || 'User',
        authorAvatar: getFullAvatarUrl(post.avatarUrl, post.fullName || 'User'),
        likeCount: post.likeCount || 0,
        commentCount: post.commentCount || 0,
        isLiked: post.isLiked || false,
      })));
    } catch (error) {
      toast.error("Không thể tải thông tin nhóm");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    try {
      await groupService.joinGroup(groupId);
      toast.success("Đã tham gia nhóm!");
      fetchGroupData();
    } catch (error) {
      toast.error("Lỗi khi tham gia");
    }
  };

  const handleLeave = async () => {
    if (window.confirm("Bạn có chắc chắn muốn rời nhóm?")) {
      try {
        await groupService.leaveGroup(groupId);
        toast.info("Đã rời nhóm");
        fetchGroupData();
      } catch (error) {
        toast.error("Lỗi khi rời nhóm");
      }
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex items-center justify-center h-[calc(100-64px)]">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );

  if (!group) return <div>Không tìm thấy nhóm</div>;

  return (
    <div className="min-h-screen" style={{
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      background: 'linear-gradient(135deg, #f0f0ff 0%, #f5f0ff 30%, #fdf4ff 60%, #f0f6ff 100%)',
    }}>
      <Navbar />

      {/* Header Section */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="rounded-[2.5rem] overflow-hidden shadow-2xl shadow-indigo-100 bg-white relative">
          {/* Cover */}
          <div className="h-64 sm:h-80 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 relative">
            {group.coverUrl && <img src={group.coverUrl} alt="" className="w-full h-full object-cover opacity-60" />}
            <div className="absolute inset-0 bg-black/10"></div>
          </div>
          
          {/* Info bar */}
          <div className="px-8 pb-8 pt-20 relative">
            <div className="absolute -top-16 left-8 flex items-end gap-6">
              <div className="w-32 h-32 rounded-[2rem] bg-white p-2 shadow-xl">
                <div className="w-full h-full rounded-[1.5rem] bg-indigo-50 flex items-center justify-center overflow-hidden">
                  {group.avatarUrl ? (
                    <img src={group.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-black text-indigo-400">{group.name[0].toUpperCase()}</span>
                  )}
                </div>
              </div>
              <div className="mb-4">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">{group.name}</h1>
                <p className="text-slate-500 font-medium flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${group.privacy === 'Public' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                  {group.privacy === 'Public' ? 'Nhóm công khai' : 'Nhóm riêng tư'} • {members.length} thành viên
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              {isMember ? (
                <>
                  <button 
                    onClick={async () => {
                      try {
                        const conversationId = await groupService.getConversationId(groupId);
                        handleOpenChat({
                          conversationId,
                          isGroup: true,
                          displayName: group.name,
                          displayAvatar: group.avatarUrl,
                        });
                      } catch (err) {
                        toast.error("Không thể mở chat nhóm");
                      }
                    }}
                    className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Thảo luận
                  </button>
                  <button className="px-6 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all">Đã tham gia</button>
                  <button onClick={handleLeave} className="px-6 py-2.5 bg-red-50 text-red-500 font-bold rounded-2xl hover:bg-red-500 hover:text-white transition-all">Rời nhóm</button>
                </>
              ) : (
                <button 
                  onClick={handleJoin}
                  className="px-8 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:scale-105 active:scale-95 transition-all"
                >
                  Tham gia nhóm
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Content: Feed */}
        <div className="lg:col-span-2 space-y-6">
          {isMember ? (
            <PostCreator 
              user={user} 
              getFullAvatarUrl={getFullAvatarUrl} 
              onPostSuccess={fetchGroupData}
              groupId={groupId} // Prop này cần được xử lý trong PostCreator
            />
          ) : (
            <div className="rounded-3xl p-8 text-center" style={glass.card}>
              <p className="text-slate-500 font-medium italic">Chỉ thành viên mới có thể đăng bài trong nhóm này</p>
            </div>
          )}

          <div className="space-y-4">
            {posts.length > 0 ? (
              posts.map(post => (
                <PostCard 
                  key={post.postId} 
                  post={post} 
                  user={user} 
                  getFullAvatarUrl={getFullAvatarUrl} 
                  onLikeChange={fetchGroupData}
                  onPostDelete={fetchGroupData}
                />
              ))
            ) : (
              <div className="rounded-3xl p-16 text-center" style={glass.card}>
                <p className="text-slate-400">Chưa có bài viết nào trong nhóm này</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Content: Sidebar */}
        <div className="space-y-6">
          {/* About Group */}
          <div className="rounded-[2rem] p-6" style={glass.card}>
            <h3 className="font-black text-slate-800 mb-4 uppercase text-xs tracking-widest">Giới thiệu</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              {group.description || "Chào mừng bạn đến với cộng đồng của chúng tôi. Hãy cùng nhau xây dựng một môi trường văn minh và bổ ích."}
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>Tạo ngày {new Date(group.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                <span>Quản trị bởi <span className="font-bold text-indigo-500">{group.creator?.fullName || "Admin"}</span></span>
              </div>
            </div>
          </div>

          {/* Members list */}
          <div className="rounded-[2rem] p-6" style={glass.card}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Thành viên</h3>
              <span className="text-xs font-bold text-indigo-600">{members.length}</span>
            </div>
            <div className="space-y-3">
              {members.slice(0, 5).map(member => (
                <Link key={member.userId} to={`/profile/${member.userId}`} className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white ring-1 ring-slate-100">
                    <img src={getFullAvatarUrl(member.avatarUrl, member.fullName)} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-700 truncate group-hover:text-indigo-600 transition-colors">{member.fullName}</p>
                    <p className="text-[10px] text-slate-400">@{member.username}</p>
                  </div>
                </Link>
              ))}
              {members.length > 5 && (
                <button className="w-full py-2 text-xs font-bold text-slate-400 hover:text-indigo-500 transition-colors">Xem tất cả thành viên</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetail;

import React from 'react';
import { Link } from 'react-router-dom';

const Maintenance = () => {
  return (
    <div className="min-h-screen bg-[#f4f7fe] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/40 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-200/40 rounded-full blur-[100px]"></div>

      <div className="max-w-xl w-full bg-white/70 backdrop-blur-2xl border border-white p-10 md:p-16 rounded-[3rem] shadow-2xl shadow-indigo-100 text-center relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="mb-10 relative inline-block">
          <div className="absolute inset-0 bg-indigo-500 rounded-full blur-2xl opacity-20 animate-ping"></div>
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-3xl flex items-center justify-center shadow-xl relative group">
            <svg className="h-12 w-12 text-white group-hover:rotate-12 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight leading-tight mb-6">
          Under <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">Maintenance</span>
        </h1>
        
        <p className="text-lg text-slate-500 font-medium leading-relaxed mb-10 max-w-sm mx-auto">
          Chúng tôi đang thực hiện một số nâng cấp quan trọng để mang lại trải nghiệm tốt nhất cho bạn. Hệ thống sẽ sớm quay lại!
        </p>

        <div className="grid grid-cols-3 gap-4 mb-12">
          <div className="bg-white/50 p-4 rounded-2xl border border-white shadow-sm">
             <p className="text-2xl font-black text-indigo-600">99%</p>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Uptime</p>
          </div>
          <div className="bg-white/50 p-4 rounded-2xl border border-white shadow-sm">
             <p className="text-2xl font-black text-indigo-600">Soon</p>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Returns</p>
          </div>
          <div className="bg-white/50 p-4 rounded-2xl border border-white shadow-sm">
             <p className="text-2xl font-black text-indigo-600">2.0</p>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Version</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
           <button 
             onClick={() => window.location.reload()}
             className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-indigo-100 active:scale-95"
           >
             Kiểm tra lại
           </button>
           <Link 
             to="/admin" 
             className="w-full sm:w-auto px-8 py-4 text-slate-400 hover:text-slate-600 font-black text-sm uppercase tracking-widest transition-colors"
           >
             Admin Login
           </Link>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center pointer-events-none">
         <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Social Mini &copy; 2026</p>
      </div>
    </div>
  );
};

export default Maintenance;

import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldAlert, KeyRound } from 'lucide-react';

interface AdminLoginProps {
  onLogin: (password: string) => void;
  error?: string | null;
  isLoading?: boolean;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, error, isLoading }) => {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    onLogin(password.trim());
  };

  return (
    <div className="w-full max-w-md mx-auto my-auto p-4 animate-fade-in text-slate-900">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-8 text-center bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center mb-3">
            <KeyRound className="w-7 h-7 text-blue-400" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">관리자 인증</h2>
          <p className="text-xs text-blue-200/80 mt-1">
            보안 위험 찾기 문제 관리 시스템
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">관리자 비밀번호</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="관리자 암호를 입력하세요"
                required
                autoFocus
                className="w-full px-4 py-3 pl-10 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[11px] text-slate-500">
              * 비밀번호는 브라우저 세션 중에만 유지되며 안전하게 전송됩니다.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || !password.trim()}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-400 transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>확인 중...</span>
              </>
            ) : (
              <>
                <span>관리자 로그인</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-2 text-center">
            <a
              href="#/"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1"
            >
              <span>← 게임으로 돌아가기</span>
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

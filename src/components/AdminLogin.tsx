import React, { useState } from 'react';
import { Lock, ArrowLeft, Loader2 } from 'lucide-react';

interface AdminLoginProps {
  onLogin: (password: string) => void;
  error?: string | null;
  isLoading?: boolean;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLogin,
  error,
  isLoading = false,
}) => {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedPassword = password.trim();

    if (!trimmedPassword || isLoading) {
      return;
    }

    onLogin(trimmedPassword);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <a
            href="#/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            게임으로 돌아가기
          </a>
        </div>

        <div className="mb-8">
          <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center mb-5">
            <Lock className="w-5 h-5 text-white" />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            관리자 로그인
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            문제 등록 및 설정 관리를 위해
            관리자 비밀번호를 입력해주세요.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="admin-password"
              className="block mb-2 text-sm font-medium text-slate-700"
            >
              비밀번호
            </label>

            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="관리자 비밀번호"
              required
              autoFocus
              autoComplete="current-password"
              disabled={isLoading}
              className="
                w-full
                h-12
                rounded-lg
                border
                border-slate-300
                bg-white
                px-4
                text-sm
                text-slate-900
                outline-none
                transition
                placeholder:text-slate-400
                focus:border-slate-600
                focus:ring-1
                focus:ring-slate-600
                disabled:bg-slate-100
                disabled:text-slate-500
              "
            />
          </div>

          {error && (
            <div
              role="alert"
              className="
                mt-3
                rounded-lg
                border
                border-red-200
                bg-red-50
                px-4
                py-3
                text-sm
                text-red-700
              "
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !password.trim()}
            className="
              mt-5
              flex
              h-12
              w-full
              items-center
              justify-center
              gap-2
              rounded-lg
              bg-slate-900
              px-4
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-slate-800
              disabled:cursor-not-allowed
              disabled:bg-slate-300
            "
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                확인 중...
              </>
            ) : (
              '로그인'
            )}
          </button>
        </form>

        <p className="mt-5 text-xs leading-5 text-slate-400">
          관리자 비밀번호는 현재 브라우저 세션에서만 사용됩니다.
        </p>
      </div>
    </div>
  );
};
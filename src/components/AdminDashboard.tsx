import React, { useState } from 'react';
import { Plus, Edit3, Trash2, LogOut, CheckCircle2, XCircle, RefreshCw, AlertCircle, Shield } from 'lucide-react';
import type { Question } from '../services/apiService';

interface AdminDashboardProps {
  questions: Question[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onAddNew: () => void;
  onEdit: (q: Question) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, nextActive: boolean) => void;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  questions,
  isLoading,
  error,
  onRefresh,
  onAddNew,
  onEdit,
  onDelete,
  onToggleActive,
  onLogout,
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 animate-fade-in text-slate-900">
      {/* Top Bar */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              보안 위험 찾기 관리자
            </h1>
            <p className="text-xs text-slate-500">
              문제 등록, 정답 좌표 지정 및 출제 관리 대시보드
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            title="새로고침"
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            type="button"
            onClick={onAddNew}
            className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>새 문제 등록</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="px-3.5 py-2.5 rounded-xl font-semibold text-xs text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>로그아웃</span>
          </button>
        </div>
      </header>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="text-xs font-bold underline hover:no-underline"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* Question Cards List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-slate-800">
            등록된 문제 목록 ({questions.length}건)
          </h2>
          <span className="text-xs text-slate-500">
            * 활성화된 문제만 참가자 게임에서 랜덤 출제됩니다.
          </span>
        </div>

        {isLoading && questions.length === 0 ? (
          <div className="p-16 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
            <div className="w-8 h-8 mx-auto border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-600">문제 목록을 불러오는 중입니다...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="p-16 rounded-2xl bg-white border border-dashed border-slate-300 text-center space-y-3">
            <Shield className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">등록된 문제가 없습니다</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              상단의 '+ 새 문제 등록' 버튼을 눌러 첫 번째 캠페인 틀린그림찾기 문제를 등록해보세요.
            </p>
            <button
              type="button"
              onClick={onAddNew}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
            >
              문제 등록하기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {questions.map((q) => (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col"
              >
                {/* Thumbnails Comparison Header */}
                <div className="grid grid-cols-2 gap-1 p-3 bg-slate-50 border-b border-slate-100">
                  <div className="relative aspect-4/3 bg-slate-900 rounded-lg overflow-hidden">
                    <img
                      src={q.normalImageUrl}
                      alt="정상 썸네일"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 left-1 px-1 py-0.5 rounded bg-slate-900/80 text-[10px] text-slate-200 font-semibold">
                      정상
                    </span>
                  </div>
                  <div className="relative aspect-4/3 bg-slate-900 rounded-lg overflow-hidden">
                    <img
                      src={q.riskImageUrl}
                      alt="위험 썸네일"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 left-1 px-1 py-0.5 rounded bg-rose-950/80 text-[10px] text-rose-200 font-semibold">
                      위험
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                        정답 {q.answers?.length || 0}개
                      </span>

                      {/* Active Toggle Button */}
                      <button
                        type="button"
                        onClick={() => onToggleActive(q.id, !q.active)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold transition-colors ${
                          q.active
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {q.active ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>출제 중</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-slate-400" />
                            <span>비활성</span>
                          </>
                        )}
                      </button>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 line-clamp-1">
                      {q.title}
                    </h3>

                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                      <span>제한시간 {q.timeLimit || 60}초</span>
                      <span>목숨 {q.lives || 3}개</span>
                      <span>힌트 {q.hintCount || 1}회</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => onEdit(q)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>수정</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(q.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>삭제</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">문제 삭제 확인</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              정말 삭제하시겠습니까? 삭제된 문제는 복구할 수 없습니다.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

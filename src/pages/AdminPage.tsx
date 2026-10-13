import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  getQuestions,
  saveQuestion,
  deleteQuestion,
  toggleQuestion,
  type Question,
  type SaveQuestionPayload,
} from '../services/apiService';
import { AdminLogin } from '../components/AdminLogin';
import { QuestionEditor } from '../components/QuestionEditor';
import {
  ArrowLeft,
  Plus,
  RefreshCw,
  LogOut,
  Shield,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit3,
  AlertCircle,
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  // Session password state
  const [adminPassword, setAdminPassword] = useState<string>(() => {
    return sessionStorage.getItem('hospital_admin_pw') || '';
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(sessionStorage.getItem('hospital_admin_pw'));
  });

  const [loginError, setLoginError] = useState<string | null>(null);
  const [isVerifyingLogin, setIsVerifyingLogin] = useState<boolean>(false);

  // Questions state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Active question in the right editor
  // null with isCreating = true means creating new question
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Load questions
  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getQuestions();
      if (res.success && res.data) {
        setQuestions(res.data);
        // Automatically select first question if none selected and not creating new
        if (res.data.length > 0 && !selectedQuestionId && !isCreatingNew) {
          setSelectedQuestionId(res.data[0].id);
        }
      } else {
        setError(res.error || '문제 목록을 불러오지 못했습니다.');
      }
    } catch (err) {
      console.warn('Failed to fetch questions:', err);
      setError('서버 연결 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedQuestionId, isCreatingNew]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchQuestions();
    }
  }, [isAuthenticated, fetchQuestions]);

  // Login handler
  const handleLogin = async (pw: string) => {
    setIsVerifyingLogin(true);
    setLoginError(null);

    try {
      sessionStorage.setItem('hospital_admin_pw', pw);
      setAdminPassword(pw);
      setIsAuthenticated(true);
    } catch (e) {
      console.warn(e);
      setLoginError('로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setIsVerifyingLogin(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    sessionStorage.removeItem('hospital_admin_pw');
    setAdminPassword('');
    setIsAuthenticated(false);
    setQuestions([]);
    setSelectedQuestionId(null);
    setIsCreatingNew(false);
  };

  // Toggle active handler
  const handleToggleActive = async (id: string, nextActive: boolean) => {
    try {
      setQuestions((prev) =>
        prev.map((q) => (q.id === id ? { ...q, active: nextActive } : q))
      );

      const res = await toggleQuestion(id, nextActive, adminPassword);
      if (!res.success) {
        alert(res.error || '상태 변경에 실패했습니다. 관리자 암호를 확인하세요.');
        fetchQuestions();
      }
    } catch (err) {
      console.warn('Toggle active error:', err);
      alert('상태 변경 중 오류가 발생했습니다.');
      fetchQuestions();
    }
  };

  // Delete handler
  const handleDelete = async (id: string) => {
    try {
      const res = await deleteQuestion(id, adminPassword);
      if (res.success) {
        const nextList = questions.filter((q) => q.id !== id);
        setQuestions(nextList);
        if (selectedQuestionId === id) {
          if (nextList.length > 0) {
            setSelectedQuestionId(nextList[0].id);
          } else {
            setSelectedQuestionId(null);
            setIsCreatingNew(true);
          }
        }
      } else {
        alert(res.error || '삭제에 실패했습니다. 관리자 암호를 확인하세요.');
      }
    } catch (err) {
      console.warn('Delete question error:', err);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // Save (Create/Update) handler
  const handleSaveQuestion = async (payload: SaveQuestionPayload): Promise<boolean> => {
    try {
      const res = await saveQuestion(payload, adminPassword);
      if (res.success && res.data?.id) {
        setIsCreatingNew(false);
        setSelectedQuestionId(res.data.id);
        await fetchQuestions();
        return true;
      } else {
        alert(res.error || '저장에 실패했습니다. 관리자 암호를 확인해주세요.');
        return false;
      }
    } catch (err) {
      console.warn('Save question error:', err);
      alert('저장 중 네트워크 오류가 발생했습니다.');
      return false;
    }
  };

  // Currently displayed question in the editor
  const activeQuestion = isCreatingNew
    ? null
    : questions.find((q) => q.id === selectedQuestionId) || questions[0] || null;

  return (
    <div className="w-full min-h-screen bg-slate-100 flex flex-col font-sans">
      {!isAuthenticated ? (
        <div className="flex-1 flex flex-col justify-center items-center p-4">
          <AdminLogin
            onLogin={handleLogin}
            error={loginError}
            isLoading={isVerifyingLogin}
          />
        </div>
      ) : (
        <div className="w-full min-h-screen flex flex-col">
          {/* 
            Top Master Navigation Bar:
            - Left: ← 게임으로 돌아가기 (Return to Game)
            - Center: Title Brand
            - Right: Refresh & Logout
          */}
          <header className="w-full bg-white border-b border-slate-200 px-4 sm:px-6 py-3 shrink-0 flex items-center justify-between shadow-xs z-30">
            {/* Left: Return to Game Button */}
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 border border-slate-200 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>← 게임으로 돌아가기</span>
              </Link>
            </div>

            {/* Center: Brand Title */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Shield className="w-4.5 h-4.5" />
              </div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight hidden sm:inline">
                보안 위험 찾기 관리자 대시보드
              </h1>
            </div>

            {/* Right: Utilities */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={fetchQuestions}
                disabled={isLoading}
                title="문제 목록 새로고침"
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="px-3.5 py-2 rounded-xl font-semibold text-xs text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>로그아웃</span>
              </button>
            </div>
          </header>

          {/* 
            Wide 2-Column Desktop Grid Layout:
            - Left: Question Master List (340px)
            - Right: Question Editor & Interactive Coordinate Canvas (minmax(0, 1fr))
          */}
          <div className="w-full flex-1 grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] overflow-hidden">
            {/* ==================================================== */}
            {/* LEFT SIDEBAR: QUESTION LIST                         */}
            {/* ==================================================== */}
            <aside className="bg-slate-50 border-r border-slate-200 flex flex-col h-full overflow-y-auto">
              {/* Sidebar Header */}
              <div className="p-4 border-b border-slate-200 bg-white sticky top-0 z-20 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">문제 목록</h2>
                  <p className="text-[11px] text-slate-500">총 {questions.length}개 등록됨</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNew(true);
                    setSelectedQuestionId(null);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs text-white transition-all flex items-center gap-1 shadow-xs cursor-pointer ${
                    isCreatingNew
                      ? 'bg-blue-700 ring-2 ring-blue-400'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>새 문제</span>
                </button>
              </div>

              {/* Error warning if any */}
              {error && (
                <div className="p-3 m-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Questions List */}
              <div className="p-3 space-y-2.5 flex-1">
                {isLoading && questions.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    <div className="w-6 h-6 mx-auto border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
                    불러오는 중...
                  </div>
                ) : questions.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-2">
                    <p className="text-xs font-semibold text-slate-600">등록된 문제가 없습니다.</p>
                    <button
                      type="button"
                      onClick={() => setIsCreatingNew(true)}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg"
                    >
                      + 새 문제 등록
                    </button>
                  </div>
                ) : (
                  questions.map((q) => {
                    const isSelected = !isCreatingNew && (selectedQuestionId === q.id || (!selectedQuestionId && activeQuestion?.id === q.id));

                    return (
                      <div
                        key={q.id}
                        onClick={() => {
                          setIsCreatingNew(false);
                          setSelectedQuestionId(q.id);
                        }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-500 shadow-sm ring-2 ring-blue-500/20'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                        }`}
                      >
                        {/* Thumbnails Strip */}
                        <div className="grid grid-cols-2 gap-1 mb-2">
                          <div className="relative aspect-3/2 bg-slate-900 rounded-md overflow-hidden">
                            <img
                              src={q.normalImageUrl}
                              alt="정상"
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-0.5 left-0.5 px-1 py-0.2 rounded bg-slate-900/80 text-[8px] text-white">
                              정상
                            </span>
                          </div>
                          <div className="relative aspect-3/2 bg-slate-900 rounded-md overflow-hidden">
                            <img
                              src={q.riskImageUrl}
                              alt="위험"
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-0.5 left-0.5 px-1 py-0.2 rounded bg-rose-900/80 text-[8px] text-white">
                              위험
                            </span>
                          </div>
                        </div>

                        {/* Title & Badge */}
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <h3 className="font-bold text-xs text-slate-900 truncate">
                            {q.title}
                          </h3>
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded shrink-0">
                            {q.answers?.length || 0}개
                          </span>
                        </div>

                        {/* Actions & Active toggle */}
                        <div
                          className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[11px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleActive(q.id, !q.active)}
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-semibold text-[10px] ${
                              q.active
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            {q.active ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-slate-400" />}
                            <span>{q.active ? '출제 중' : '비활성'}</span>
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setIsCreatingNew(false);
                                setSelectedQuestionId(q.id);
                              }}
                              title="문제 수정"
                              className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(q.id)}
                              title="문제 삭제"
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </aside>

            {/* ==================================================== */}
            {/* RIGHT MAIN PANEL: QUESTION EDITOR (WIDE SCREEN)     */}
            {/* ==================================================== */}
            <main className="bg-slate-100 overflow-y-auto flex-1">
              <QuestionEditor
                key={isCreatingNew ? 'new-question' : activeQuestion?.id || 'empty'}
                initialData={activeQuestion}
                adminPassword={adminPassword}
                onSave={handleSaveQuestion}
                onCancel={() => {
                  if (questions.length > 0) {
                    setIsCreatingNew(false);
                    setSelectedQuestionId(questions[0].id);
                  }
                }}
              />
            </main>
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
                      handleDelete(deleteConfirmId);
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
      )}
    </div>
  );
};

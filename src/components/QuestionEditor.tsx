import React, { useState } from 'react';
import { ArrowLeft, Save, Upload, AlertCircle } from 'lucide-react';
import type { Question, SecurityAnswer, SaveQuestionPayload } from '../services/apiService';
import { compressAndConvertToBase64 } from '../utils/imageCompression';
import { ImageAnswerEditor } from './ImageAnswerEditor';

interface QuestionEditorProps {
  initialData?: Question | null;
  adminPassword: string;
  onSave: (payload: SaveQuestionPayload) => Promise<boolean>;
  onCancel: () => void;
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({
  initialData,
  onSave,
  onCancel,
}) => {
  const isEditing = Boolean(initialData?.id);

  // Form State
  const [title, setTitle] = useState(initialData?.title || '');
  const [timeLimit, setTimeLimit] = useState(initialData?.timeLimit || 60);
  const [lives, setLives] = useState(initialData?.lives || 3);
  const [hintCount, setHintCount] = useState(initialData?.hintCount || 1);
  const [active, setActive] = useState(initialData?.active ?? true);

  // Images state
  const [normalPreview, setNormalPreview] = useState<string>(
    initialData?.normalImageUrl || ''
  );
  const [riskPreview, setRiskPreview] = useState<string>(
    initialData?.riskImageUrl || ''
  );
  const [newNormalFile, setNewNormalFile] = useState<File | null>(null);
  const [newRiskFile, setNewRiskFile] = useState<File | null>(null);

  // Answers state
  const [answers, setAnswers] = useState<SecurityAnswer[]>(
    initialData?.answers || []
  );

  // Synchronize state when initialData prop changes
  React.useEffect(() => {
    setTitle(initialData?.title || '');
    setTimeLimit(initialData?.timeLimit || 60);
    setLives(initialData?.lives || 3);
    setHintCount(initialData?.hintCount || 1);
    setActive(initialData?.active ?? true);
    setNormalPreview(initialData?.normalImageUrl || '');
    setRiskPreview(initialData?.riskImageUrl || '');
    setNewNormalFile(null);
    setNewRiskFile(null);
    setAnswers(initialData?.answers || []);
  }, [initialData]);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // File change handlers
  const handleNormalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewNormalFile(file);
    const objectUrl = URL.createObjectURL(file);
    setNormalPreview(objectUrl);
  };

  const handleRiskFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewRiskFile(file);
    const objectUrl = URL.createObjectURL(file);
    setRiskPreview(objectUrl);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('문제명을 입력해주세요.');
      return;
    }

    if (!normalPreview) {
      setErrorMessage('정상 이미지를 선택해주세요.');
      return;
    }

    if (!riskPreview) {
      setErrorMessage('보안 이슈 이미지를 선택해주세요.');
      return;
    }

    if (answers.length === 0) {
      setErrorMessage('보안 위험 정답을 최소 1개 이상 이미지에 등록해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      let normalBase64: string | undefined = undefined;
      let riskBase64: string | undefined = undefined;

      // Compress new images to Base64 if uploaded
      if (newNormalFile) {
        normalBase64 = await compressAndConvertToBase64(newNormalFile);
      }
      if (newRiskFile) {
        riskBase64 = await compressAndConvertToBase64(newRiskFile);
      }

      const payload: SaveQuestionPayload = {
        id: initialData?.id,
        title: title.trim(),
        normalImageBase64: normalBase64,
        riskImageBase64: riskBase64,
        normalImageUrl: !normalBase64 ? initialData?.normalImageUrl : undefined,
        normalImageId: !normalBase64 ? initialData?.normalImageId : undefined,
        riskImageUrl: !riskBase64 ? initialData?.riskImageUrl : undefined,
        riskImageId: !riskBase64 ? initialData?.riskImageId : undefined,
        answers,
        timeLimit: Number(timeLimit) || 60,
        lives: Number(lives) || 3,
        hintCount: Number(hintCount) || 1,
        active,
      };

      const success = await onSave(payload);
      if (!success) {
        setErrorMessage('문제 저장에 실패했습니다. 관리자 암호와 네트워크를 확인해주세요.');
      }
    } catch (err) {
      console.warn('Error saving question:', err);
      setErrorMessage('이미지 압축 또는 전송 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-none p-3 sm:p-5 lg:p-6 animate-fade-in text-slate-900">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {isEditing ? '문제 수정' : '새 문제 등록'}
              </h2>
              <p className="text-xs text-slate-500">
                정상 및 보안 위험 이미지를 등록하고 정답 위치를 지정합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-400 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>저장 중입니다...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>저장하기</span>
                </>
              )}
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Basic Info & Game Rules Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            기본 정보 및 게임 규칙
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700">문제명</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 간호사 스테이션 보안 위험 찾기 01"
                required
                className="w-full mt-1.5 px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-4 pt-5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-bold text-slate-700">문제 활성화 (게임 출제 여부)</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700">제한시간 (초)</label>
              <input
                type="number"
                min="10"
                max="300"
                value={timeLimit}
                onChange={(e) => setTimeLimit(parseInt(e.target.value) || 60)}
                className="w-full mt-1.5 px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">목숨 수</label>
              <input
                type="number"
                min="1"
                max="10"
                value={lives}
                onChange={(e) => setLives(parseInt(e.target.value) || 3)}
                className="w-full mt-1.5 px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">힌트 횟수</label>
              <input
                type="number"
                min="0"
                max="5"
                value={hintCount}
                onChange={(e) => setHintCount(parseInt(e.target.value) || 1)}
                className="w-full mt-1.5 px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Image Upload Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Normal Image Upload */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-800">1. 정상 이미지 (기준 사진)</label>
              <label className="text-xs text-blue-600 font-semibold cursor-pointer hover:underline flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" />
                <span>파일 변경</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleNormalFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {normalPreview ? (
              <div className="relative w-full aspect-3/2 bg-slate-900 rounded-xl overflow-hidden border border-slate-200">
                <img
                  src={normalPreview}
                  alt="정상 이미지 미리보기"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <label className="w-full aspect-3/2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center cursor-pointer transition-colors p-4">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-700">정상 이미지 업로드</span>
                <span className="text-[11px] text-slate-400 mt-0.5">PNG, JPEG, WEBP 지원</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleNormalFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Risk Image Upload */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-800">2. 보안 이슈 이미지 (위험 포함)</label>
              <label className="text-xs text-blue-600 font-semibold cursor-pointer hover:underline flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" />
                <span>파일 변경</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleRiskFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {riskPreview ? (
              <div className="relative w-full aspect-3/2 bg-slate-900 rounded-xl overflow-hidden border border-slate-200">
                <img
                  src={riskPreview}
                  alt="보안 위험 이미지 미리보기"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <label className="w-full aspect-3/2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center cursor-pointer transition-colors p-4">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-700">보안 이슈 이미지 업로드</span>
                <span className="text-[11px] text-slate-400 mt-0.5">PNG, JPEG, WEBP 지원</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleRiskFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Interactive Answer Coordinates Editor */}
        {riskPreview && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              정답 위치 지정 및 판정 영역 설정
            </h3>
            <ImageAnswerEditor
              riskImageSrc={riskPreview}
              answers={answers}
              onChangeAnswers={setAnswers}
            />
          </div>
        )}
      </form>
    </div>
  );
};

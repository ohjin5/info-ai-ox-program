import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  getConfig,
  getQuestions,
  type Question,
  type SecurityAnswer,
  type GameConfig,
} from '../services/apiService';
import { DEFAULT_CONFIG } from '../constants/config';
import { StartScreen } from '../components/StartScreen';
import { GameHUD } from '../components/GameHUD';
import { ImageComparison } from '../components/ImageComparison';
import { HintModal } from '../components/HintModal';
import { ResultScreen } from '../components/ResultScreen';
import { soundManager } from '../utils/audio';
import { AlertCircle, RefreshCw } from 'lucide-react';

const DEMO_QUESTION: Question = {
  id: 'demo-nurse-station',
  title: '간호사 스테이션 보안 취약점 찾기',
  normalImageUrl: '/images/security-normal.png',
  riskImageUrl: '/images/security-risk.png',
  answers: [
    {
      id: 1,
      x: 35.0,
      y: 42.0,
      radius: 8,
      title: '환자정보 화면 노출',
      hint: '가운데 업무용 PC 화면을 확인해보세요.',
      explanation:
        '업무용 PC 모니터에 환자 개인정보가 노출되어 있습니다. 자리를 비울 때는 반드시 화면을 잠그거나 로그아웃해야 합니다.',
    },
    {
      id: 2,
      x: 9.0,
      y: 78.0,
      radius: 8,
      title: '진료정보 문서 폐기',
      hint: '화면 왼쪽 아래를 확인해보세요.',
      explanation:
        '환자정보가 포함된 문서가 일반 휴지통에 버려져 있습니다. 개인정보 문서는 지정된 절차에 따라 안전하게 파기해야 합니다.',
    },
    {
      id: 3,
      x: 52.0,
      y: 66.0,
      radius: 8,
      title: '직원증 노출',
      hint: '의자 주변을 확인해보세요.',
      explanation:
        '외부에서 식별 가능한 직원증이 방치되어 있습니다. 직원증과 출입증은 분실 또는 무단사용되지 않도록 관리해야 합니다.',
    },
    {
      id: 4,
      x: 86.0,
      y: 66.0,
      radius: 8,
      title: '비밀번호 메모 노출',
      hint: '오른쪽 컴퓨터 주변을 확인해보세요.',
      explanation:
        '아이디와 비밀번호가 메모지에 적혀 외부에 노출되어 있습니다. 계정정보는 메모지에 적어 모니터나 책상에 붙여두면 안 됩니다.',
    },
  ],
  timeLimit: 60,
  lives: 3,
  hintCount: 1,
  active: true,
};

type PlayState = 'LOADING' | 'START' | 'PLAYING' | 'RESULT' | 'EMPTY' | 'ERROR';

export const GamePage: React.FC = () => {
  const [playState, setPlayState] = useState<PlayState>('LOADING');
  const [config, setConfig] = useState<GameConfig>(DEFAULT_CONFIG);
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);

  // In-Game state
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [lives, setLives] = useState<number>(3);
  const [hintCount, setHintCount] = useState<number>(1);
  const [foundAnswerIds, setFoundAnswerIds] = useState<number[]>([]);
  const [isHintOpen, setIsHintOpen] = useState<boolean>(false);
  const [currentHintText, setCurrentHintText] = useState<string>('');
  const [activeExplanation, setActiveExplanation] = useState<{ title: string; text: string } | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(!soundManager.isEnabled());

  // Image preloading
  const [isLoadingImages, setIsLoadingImages] = useState<boolean>(true);
  const [imageLoadError, setImageLoadError] = useState<boolean>(false);

  // Result state
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [failReason, setFailReason] = useState<'TIME_OUT' | 'NO_LIVES' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const explanationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFinishedRef = useRef<boolean>(false);

  // 1. Fetch Config & Questions
  const loadGameData = useCallback(async () => {
    setPlayState('LOADING');
    setErrorMessage(null);

    try {
      const [configRes, questionsRes] = await Promise.all([
        getConfig(),
        getQuestions(),
      ]);

      if (configRes.success && configRes.data) {
        setConfig(configRes.data);
      }

      if (!questionsRes.success) {
        setErrorMessage(questionsRes.error || '게임 데이터를 불러오지 못했습니다.');
        setPlayState('ERROR');
        return;
      }

      const all = questionsRes.data || [];
      const actives = all.filter((q) => q.active);

      if (actives.length === 0) {
        setPlayState('EMPTY');
        return;
      }

      setActiveQuestions(actives);
      // Pick random active question
      const chosen = actives[Math.floor(Math.random() * actives.length)];
      setupQuestion(chosen, configRes.data || DEFAULT_CONFIG);
      setPlayState('START');
    } catch (err) {
      console.warn('Failed to load game data:', err);
      setErrorMessage('게임 데이터를 불러오지 못했습니다.');
      setPlayState('ERROR');
    }
  }, []);

  useEffect(() => {
    loadGameData();
  }, [loadGameData]);

  // Setup chosen question and preload images
  const setupQuestion = (q: Question, cfg: GameConfig) => {
    setCurrentQuestion(q);
    const initialTime = q.timeLimit || cfg.defaultTimeLimit || 60;
    const initialLives = q.lives || cfg.defaultLives || 3;
    const initialHints = q.hintCount !== undefined ? q.hintCount : cfg.defaultHintCount || 1;

    setTimeLeft(initialTime);
    setLives(initialLives);
    setHintCount(initialHints);
    setFoundAnswerIds([]);
    setIsSuccess(false);
    setFailReason(null);
    isFinishedRef.current = false;

    // Preload both images
    setIsLoadingImages(true);
    setImageLoadError(false);

    let loaded = 0;
    const urls = [q.normalImageUrl, q.riskImageUrl];
    let failed = false;

    urls.forEach((url) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        loaded += 1;
        if (loaded === urls.length && !failed) {
          setIsLoadingImages(false);
        }
      };
      img.onerror = () => {
        failed = true;
        setImageLoadError(true);
        setIsLoadingImages(false);
      };
    });
  };

  // 2. Timer Loop
  useEffect(() => {
    if (playState !== 'PLAYING') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (!isFinishedRef.current) {
            isFinishedRef.current = true;
            soundManager.playGameOver();
            const totalLimit = currentQuestion?.timeLimit || config.defaultTimeLimit || 60;
            setTimeSpent(totalLimit);
            setIsSuccess(false);
            setFailReason('TIME_OUT');
            setPlayState('RESULT');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playState, currentQuestion, config]);

  // Clear toast timer on unmount
  useEffect(() => {
    return () => {
      if (explanationTimeoutRef.current) {
        clearTimeout(explanationTimeoutRef.current);
      }
    };
  }, []);

  // Correct answer handler
  const handleCorrectAnswer = (answer: SecurityAnswer) => {
    if (isFinishedRef.current || !currentQuestion) return;

    soundManager.playCorrect();

    const newFoundIds = [...foundAnswerIds, answer.id];
    setFoundAnswerIds(newFoundIds);

    // Show explanation toast for 2.5s
    if (explanationTimeoutRef.current) {
      clearTimeout(explanationTimeoutRef.current);
    }
    setActiveExplanation({
      title: answer.title,
      text: answer.explanation,
    });
    explanationTimeoutRef.current = setTimeout(() => {
      setActiveExplanation(null);
    }, 2800);

    // Check Victory
    if (newFoundIds.length === currentQuestion.answers.length) {
      if (timerRef.current) clearInterval(timerRef.current);
      isFinishedRef.current = true;
      soundManager.playVictory();

      const totalLimit = currentQuestion.timeLimit || config.defaultTimeLimit || 60;
      const spent = totalLimit - timeLeft;
      setTimeSpent(spent);
      setIsSuccess(true);
      setFailReason(null);

      setTimeout(() => {
        setPlayState('RESULT');
      }, 1200);
    }
  };

  // Wrong click handler
  const handleWrongClick = () => {
    if (isFinishedRef.current || !currentQuestion) return;

    soundManager.playWrong();

    setLives((prev) => {
      const next = prev - 1;
      if (next <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        if (!isFinishedRef.current) {
          isFinishedRef.current = true;
          soundManager.playGameOver();

          const totalLimit = currentQuestion.timeLimit || config.defaultTimeLimit || 60;
          const spent = totalLimit - timeLeft;
          setTimeSpent(spent);
          setIsSuccess(false);
          setFailReason('NO_LIVES');

          setTimeout(() => {
            setPlayState('RESULT');
          }, 600);
        }
        return 0;
      }
      return next;
    });
  };

  // Hint handler
  const handleUseHint = () => {
    if (hintCount <= 0 || !currentQuestion || isFinishedRef.current) return;

    soundManager.playClick();

    const unfound = currentQuestion.answers.filter(
      (a) => !foundAnswerIds.includes(a.id)
    );
    if (unfound.length === 0) return;

    const randomAnswer = unfound[Math.floor(Math.random() * unfound.length)];
    setCurrentHintText(randomAnswer.hint);
    setHintCount((h) => h - 1);
    setIsHintOpen(true);
  };

  // Sound toggle
  const handleToggleSound = () => {
    const next = soundManager.toggle();
    setIsMuted(!next);
  };

  // Restart handler
  const handleRestart = () => {
    if (activeQuestions.length > 0) {
      const chosen = activeQuestions[Math.floor(Math.random() * activeQuestions.length)];
      setupQuestion(chosen, config);
      setPlayState('PLAYING');
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* 1. LOADING STATE */}
      {playState === 'LOADING' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <h2 className="text-xl font-bold text-white">게임을 준비하고 있습니다.</h2>
          <p className="text-xs text-slate-400">보안 캠페인 데이터를 불러오는 중입니다...</p>
        </div>
      )}

      {/* 2. ERROR STATE */}
      {playState === 'ERROR' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto space-y-4">
          <div className="p-6 rounded-2xl bg-rose-950/70 border border-rose-800 text-rose-300 shadow-xl space-y-3">
            <AlertCircle className="w-10 h-10 mx-auto text-rose-400 mb-1" />
            <h2 className="text-lg font-bold text-white">데이터를 불러오지 못했습니다.</h2>
            <p className="text-xs text-rose-200/90 leading-relaxed">{errorMessage}</p>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-rose-900 text-[11px] text-slate-300 text-left">
              💡 <strong>Apps Script 배포 안내</strong>: Apps Script 웹앱 배포 시 <strong>'액세스 권한: 모든 사용자(Anyone)'</strong>로 배포되어야 401 인증 오류 없이 정상 연동됩니다.
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={loadGameData}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-2 cursor-pointer shadow-md"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>다시 시도</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setupQuestion(DEMO_QUESTION, DEFAULT_CONFIG);
                  setPlayState('START');
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-2 cursor-pointer shadow-md"
              >
                <span>기본 문제로 체험하기</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. EMPTY STATE */}
      {playState === 'EMPTY' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4">
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-slate-300 space-y-4">
            <h2 className="text-xl font-black text-white">현재 등록된 문제가 없습니다.</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              관리자페이지에서 새로운 보안 위험 문제를 등록한 후 활성화해주세요.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={loadGameData}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl"
              >
                새로고침
              </button>
              <button
                type="button"
                onClick={() => {
                  setupQuestion(DEMO_QUESTION, DEFAULT_CONFIG);
                  setPlayState('START');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl"
              >
                기본 문제로 플레이
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. START SCREEN */}
      {playState === 'START' && currentQuestion && (
        <div className="flex-1 flex flex-col justify-center items-center p-4">
          <StartScreen
            gameTitle={config.gameTitle}
            totalRisksCount={currentQuestion.answers.length}
            timeLimit={currentQuestion.timeLimit || config.defaultTimeLimit || 60}
            lives={currentQuestion.lives || config.defaultLives || 3}
            hintCount={currentQuestion.hintCount ?? config.defaultHintCount ?? 1}
            onStart={() => setPlayState('PLAYING')}
            isLoadingImages={isLoadingImages}
            imageLoadError={imageLoadError}
            onRetryImageLoad={() => setupQuestion(currentQuestion, config)}
          />
        </div>
      )}

      {/* 5. PLAYING SCREEN */}
      {playState === 'PLAYING' && currentQuestion && (
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Top HUD */}
          <GameHUD
            gameTitle={config.gameTitle}
            timeLeft={timeLeft}
            lives={lives}
            maxLives={currentQuestion.lives || config.defaultLives || 3}
            foundCount={foundAnswerIds.length}
            totalAnswers={currentQuestion.answers.length}
            hintCount={hintCount}
            onUseHint={handleUseHint}
            isMuted={isMuted}
            onToggleSound={handleToggleSound}
          />

          {/* Clean 2-Image Comparison Arena (No distracting labels) */}
          <ImageComparison
            normalImageUrl={currentQuestion.normalImageUrl}
            riskImageUrl={currentQuestion.riskImageUrl}
            answers={currentQuestion.answers}
            foundAnswerIds={foundAnswerIds}
            onCorrectAnswer={handleCorrectAnswer}
            onWrongClick={handleWrongClick}
            activeExplanation={activeExplanation}
            isGameOver={isFinishedRef.current}
          />

          {/* Hint Modal */}
          <HintModal
            isOpen={isHintOpen}
            onClose={() => setIsHintOpen(false)}
            hintText={currentHintText}
          />
        </div>
      )}

      {/* 6. RESULT SCREEN */}
      {playState === 'RESULT' && currentQuestion && (
        <div className="flex-1 flex flex-col justify-center items-center p-4">
          <ResultScreen
            isSuccess={isSuccess}
            foundAnswers={currentQuestion.answers.filter((a) =>
              foundAnswerIds.includes(a.id)
            )}
            allAnswers={currentQuestion.answers}
            livesLeft={lives}
            maxLives={currentQuestion.lives || config.defaultLives || 3}
            timeSpent={timeSpent}
            failReason={failReason}
            onRestart={handleRestart}
          />
        </div>
      )}
    </div>
  );
};

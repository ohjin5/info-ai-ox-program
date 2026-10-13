import React, { useState, useEffect, useRef } from 'react';
import type { SecurityAnswer } from '../data/securityGameData';
import { GAME_CONFIG } from '../data/securityGameData';
import { GameHeader } from './GameHeader';
import { ComparisonImages } from './ComparisonImages';
import { HintModal } from './HintModal';
import { soundManager } from '../utils/audio';

interface GameScreenProps {
  answers: SecurityAnswer[];
  onGameComplete: (isSuccess: boolean, foundAnswers: SecurityAnswer[], livesLeft: number, timeSpent: number, failReason: 'TIME_OUT' | 'NO_LIVES' | null) => void;
  devMode: boolean;
  onToggleDevMode: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  answers,
  onGameComplete,
  devMode,
  onToggleDevMode,
}) => {
  // Game state
  const [timeLeft, setTimeLeft] = useState<number>(GAME_CONFIG.totalTimeSeconds);
  const [lives, setLives] = useState<number>(GAME_CONFIG.initialLives);
  const [foundAnswerIds, setFoundAnswerIds] = useState<number[]>([]);
  const [hintUsed, setHintUsed] = useState<boolean>(false);
  const [isHintOpen, setIsHintOpen] = useState<boolean>(false);
  const [currentHintText, setCurrentHintText] = useState<string>('');
  const [activeExplanation, setActiveExplanation] = useState<{ title: string; text: string } | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(!soundManager.isEnabled());

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const explanationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFinishedRef = useRef<boolean>(false);

  // Sound toggle handler
  const handleToggleSound = () => {
    const newState = soundManager.toggle();
    setIsMuted(!newState);
  };

  // 60-Second Countdown Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (!isFinishedRef.current) {
            isFinishedRef.current = true;
            soundManager.playGameOver();
            const foundAnswersList = answers.filter((a) => foundAnswerIds.includes(a.id));
            const timeSpent = GAME_CONFIG.totalTimeSeconds;
            onGameComplete(false, foundAnswersList, lives, timeSpent, 'TIME_OUT');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [answers, foundAnswerIds, lives, onGameComplete]);

  // Clean up explanation toast timer on unmount
  useEffect(() => {
    return () => {
      if (explanationTimeoutRef.current) {
        clearTimeout(explanationTimeoutRef.current);
      }
    };
  }, []);

  // Correct answer handler
  const handleCorrectAnswer = (answer: SecurityAnswer) => {
    if (isFinishedRef.current) return;

    soundManager.playCorrect();

    const newFoundIds = [...foundAnswerIds, answer.id];
    setFoundAnswerIds(newFoundIds);

    // Show explanation toast for 2.5 seconds
    if (explanationTimeoutRef.current) {
      clearTimeout(explanationTimeoutRef.current);
    }
    setActiveExplanation({
      title: answer.title,
      text: answer.explanation,
    });
    explanationTimeoutRef.current = setTimeout(() => {
      setActiveExplanation(null);
    }, 3000);

    // Check victory condition: all answers found!
    if (newFoundIds.length === answers.length) {
      if (timerRef.current) clearInterval(timerRef.current);
      isFinishedRef.current = true;
      soundManager.playVictory();
      const timeSpent = GAME_CONFIG.totalTimeSeconds - timeLeft;
      const foundAnswersList = answers.filter((a) => newFoundIds.includes(a.id));
      // Give brief moment so user can see last marker and celebratory chime
      setTimeout(() => {
        onGameComplete(true, foundAnswersList, lives, timeSpent, null);
      }, 1200);
    }
  };

  // Wrong click handler
  const handleWrongClick = () => {
    if (isFinishedRef.current) return;

    soundManager.playWrong();

    setLives((prevLives) => {
      const nextLives = prevLives - 1;
      if (nextLives <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        if (!isFinishedRef.current) {
          isFinishedRef.current = true;
          soundManager.playGameOver();
          const timeSpent = GAME_CONFIG.totalTimeSeconds - timeLeft;
          const foundAnswersList = answers.filter((a) => foundAnswerIds.includes(a.id));
          setTimeout(() => {
            onGameComplete(false, foundAnswersList, 0, timeSpent, 'NO_LIVES');
          }, 600);
        }
        return 0;
      }
      return nextLives;
    });
  };

  // Hint trigger
  const handleUseHint = () => {
    if (hintUsed || foundAnswerIds.length === answers.length || isFinishedRef.current) return;

    soundManager.playClick();

    // Select randomly from UNFOUND answers only
    const unfound = answers.filter((a) => !foundAnswerIds.includes(a.id));
    if (unfound.length === 0) return;

    const randomAnswer = unfound[Math.floor(Math.random() * unfound.length)];
    setCurrentHintText(randomAnswer.hint);
    setHintUsed(true);
    setIsHintOpen(true);
  };

  return (
    <div className="w-full min-h-screen bg-slate-900 flex flex-col">
      {/* Top HUD */}
      <GameHeader
        timeLeft={timeLeft}
        lives={lives}
        maxLives={GAME_CONFIG.initialLives}
        foundCount={foundAnswerIds.length}
        totalAnswers={answers.length}
        hintUsed={hintUsed}
        onUseHint={handleUseHint}
        isMuted={isMuted}
        onToggleSound={handleToggleSound}
        devMode={devMode}
        onToggleDevMode={onToggleDevMode}
      />

      {/* Main Arena */}
      <main className="flex-1 flex flex-col justify-center items-center py-2 sm:py-4">
        <ComparisonImages
          normalImagePath={GAME_CONFIG.normalImagePath}
          riskImagePath={GAME_CONFIG.riskImagePath}
          answers={answers}
          foundAnswerIds={foundAnswerIds}
          onCorrectAnswer={handleCorrectAnswer}
          onWrongClick={handleWrongClick}
          activeExplanation={activeExplanation}
          devMode={devMode}
          isGameOver={isFinishedRef.current}
        />
      </main>

      {/* Hint Modal Dialog */}
      <HintModal
        isOpen={isHintOpen}
        onClose={() => setIsHintOpen(false)}
        hintText={currentHintText}
      />
    </div>
  );
};

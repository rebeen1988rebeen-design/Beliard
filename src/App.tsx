import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  AIDifficulty,
  Ball,
  CameraMode,
  GameMode,
  Language,
  Player,
  ShotSpin,
  TableTheme,
} from './types/billiards';
import {
  createInitialRack,
  stepPhysics,
  calculateAIShot,
  TABLE_DIMENSIONS,
} from './physics/billiardsPhysics';
import { TABLE_THEMES } from './utils/tableThemes';
import { t } from './i18n/translations';
import { soundEngine } from './audio/soundEngine';
import { ThreePoolTable } from './components/ThreePoolTable';
import { TopNavbar } from './components/TopNavbar';
import { BottomHUD } from './components/BottomHUD';
import { SpinController } from './components/SpinController';
import { PowerBar } from './components/PowerBar';
import { RulesModal } from './components/RulesModal';
import { SettingsModal } from './components/SettingsModal';
import { WinnerModal } from './components/WinnerModal';
import { PocketedBallsDisplay } from './components/PocketedBallsDisplay';

const initialPlayers: [Player, Player] = [
  {
    id: 1,
    name: 'ئاراس ئەحمەد (Aras)',
    nameKu: 'ئاراس ئەحمەد',
    type: 'HUMAN',
    assignedGroup: null,
    score: 0,
    avatar: '🟢',
  },
  {
    id: 2,
    name: 'AI Pro (زیرەکی)',
    nameKu: 'زیرەکی دەستکرد',
    type: 'AI',
    assignedGroup: null,
    score: 0,
    avatar: '🤖',
  },
];

export default function App() {
  // --- Game State ---
  const [gameMode, setGameMode] = useState<GameMode>('8BALL_AI');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('HARD');
  const [players, setPlayers] = useState<[Player, Player]>(initialPlayers);
  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(0);

  // Balls array in 3D physics world
  const [balls, setBalls] = useState<Ball[]>(() => createInitialRack());

  // Interaction / aiming states
  const [cueAngle, setCueAngle] = useState<number>(0);
  const [power, setPower] = useState<number>(0.55);
  const [spin, setSpin] = useState<ShotSpin>({ x: 0, y: 0 });
  const [isAiming, setIsAiming] = useState<boolean>(true);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [isBallInHand, setIsBallInHand] = useState<boolean>(false);
  const [ballInHandReason, setBallInHandReason] = useState<string | null>(null);
  const [ballInHandReasonKu, setBallInHandReasonKu] = useState<string | null>(null);

  // Practice undo history
  const [historyStack, setHistoryStack] = useState<Ball[][]>([]);

  // Camera & Visual theme
  const [cameraMode, setCameraMode] = useState<CameraMode>('AIM');
  const [tableTheme, setTableTheme] = useState<TableTheme>('emerald_glass');
  const [language, setLanguage] = useState<Language>('ku');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showGuideline, setShowGuideline] = useState<boolean>(true);

  // Rules & Settings modals
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Winner modal
  const [winner, setWinner] = useState<Player | null>(null);
  const [winReason, setWinReason] = useState<string | null>(null);
  const [winReasonKu, setWinReasonKu] = useState<string | null>(null);

  // Rules state
  const [tableOpen, setTableOpen] = useState<boolean>(true);
  const [breakDone, setBreakDone] = useState<boolean>(false);

  // Physics loop control refs
  const physicsActiveRef = useRef<boolean>(false);
  const lastShotBallsRef = useRef<Ball[]>([]);
  const firstBallHitRef = useRef<number | null>(null);
  const anyCushionHitRef = useRef<boolean>(false);
  const pocketedThisTurnRef = useRef<number[]>([]);

  // Sound sync
  useEffect(() => {
    soundEngine.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // Handle Game Mode Changes
  const handleModeChange = (mode: GameMode) => {
    setGameMode(mode);
    if (mode === '8BALL_AI') {
      setPlayers([
        { ...players[0], name: 'Aras Ahmed', nameKu: 'ئاراس ئەحمەد', type: 'HUMAN', assignedGroup: null, score: 0 },
        { ...players[1], name: 'AI Pro', nameKu: 'زیرەکی دەستکرد', type: 'AI', assignedGroup: null, score: 0, avatar: '🤖' },
      ]);
    } else if (mode === '8BALL_PASS_PLAY') {
      setPlayers([
        { ...players[0], name: 'Player 1', nameKu: 'یاریزان ١', type: 'HUMAN', assignedGroup: null, score: 0 },
        { ...players[1], name: 'Player 2', nameKu: 'یاریزان ٢', type: 'HUMAN', assignedGroup: null, score: 0, avatar: '🔵' },
      ]);
    } else {
      // PRACTICE MODE
      setPlayers([
        { ...players[0], name: 'Practice Player', nameKu: 'ڕاهێنەر', type: 'HUMAN', assignedGroup: null, score: 0 },
        { ...players[1], name: 'Practice AI', nameKu: 'یاریدەدەر', type: 'AI', assignedGroup: null, score: 0 },
      ]);
    }
    handleResetRack();
  };

  // Reset rack to start a clean new game
  const handleResetRack = useCallback(() => {
    physicsActiveRef.current = false;
    const newRack = createInitialRack();
    setBalls(newRack);
    setIsMoving(false);
    setIsAiming(true);
    setIsBallInHand(false);
    setBallInHandReason(null);
    setBallInHandReasonKu(null);
    setWinner(null);
    setWinReason(null);
    setWinReasonKu(null);
    setTableOpen(true);
    setBreakDone(false);
    setHistoryStack([]);
    setActivePlayerIndex(0);
    setCueAngle(0);

    setPlayers((prev) => [
      { ...prev[0], assignedGroup: null, score: 0 },
      { ...prev[1], assignedGroup: null, score: 0 },
    ]);
  }, []);

  // Practice Undo
  const handleUndoShot = () => {
    if (gameMode !== 'PRACTICE' || historyStack.length === 0 || isMoving) return;
    const previous = historyStack[historyStack.length - 1];
    setBalls(previous.map((b) => ({ ...b, position: [...b.position], velocity: [0, 0, 0] })));
    setHistoryStack((prev) => prev.slice(0, -1));
    setIsMoving(false);
    setIsAiming(true);
    setIsBallInHand(false);
  };

  // Fire the shot (push cue ball velocity)
  const executeShot = useCallback((angle: number, shotPower: number, shotSpin: ShotSpin) => {
    if (isMoving || isBallInHand || winner) return;

    // Save history for practice undo
    setHistoryStack((prev) => [...prev, balls.map((b) => ({ ...b, position: [...b.position], velocity: [...b.velocity] }))]);

    // Reset shot tracking rules
    firstBallHitRef.current = null;
    anyCushionHitRef.current = false;
    pocketedThisTurnRef.current = [];
    lastShotBallsRef.current = balls.map((b) => ({ ...b, position: [...b.position] }));

    setIsAiming(false);
    setIsMoving(true);

    const speed = shotPower * 34; // Max initial velocity
    const vx = Math.cos(angle) * speed;
    const vz = Math.sin(angle) * speed;

    // Apply spin English effects
    const sideSpinFx = shotSpin.x * speed * 0.12;
    const topSpinFx = shotSpin.y * speed * 0.15;

    soundEngine.playCueStrike(shotPower);

    setBalls((prevBalls) =>
      prevBalls.map((b) => {
        if (b.id === 0) {
          return {
            ...b,
            velocity: [vx + sideSpinFx, 0, vz + topSpinFx],
            angularVelocity: [vz / b.radius, 0, -vx / b.radius],
          };
        }
        return b;
      })
    );

    physicsActiveRef.current = true;
  }, [balls, isMoving, isBallInHand, winner]);

  // AI turn automation
  useEffect(() => {
    if (!isMoving && !isBallInHand && !winner && gameMode === '8BALL_AI' && activePlayerIndex === 1) {
      const aiPlayer = players[1];
      const timer = setTimeout(() => {
        const { angle, power: aiPower } = calculateAIShot(balls, aiPlayer.assignedGroup, aiDifficulty);
        setCueAngle(angle);
        setPower(aiPower);
        executeShot(angle, aiPower, { x: 0, y: 0 });
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [activePlayerIndex, isMoving, isBallInHand, winner, gameMode, balls, aiDifficulty, players, executeShot]);

  // Ball-In-Hand cue ball placement
  const handlePlaceCueBall = (x: number, z: number) => {
    setBalls((prev) =>
      prev.map((b) => {
        if (b.id === 0) {
          return {
            ...b,
            position: [x, 0, z],
            inPocket: false,
            velocity: [0, 0, 0],
            angularVelocity: [0, 0, 0],
          };
        }
        return b;
      })
    );
    setIsBallInHand(false);
    setBallInHandReason(null);
    setBallInHandReasonKu(null);
    setIsAiming(true);
  };

  // --- Main 60FPS Physics Simulation Loop ---
  useEffect(() => {
    let animId: number;

    const runPhysicsStep = () => {
      if (!physicsActiveRef.current) {
        animId = requestAnimationFrame(runPhysicsStep);
        return;
      }

      setBalls((prevBalls) => {
        const nextBalls = prevBalls.map((b) => ({
          ...b,
          position: [...b.position] as [number, number, number],
          velocity: [...b.velocity] as [number, number, number],
          angularVelocity: [...b.angularVelocity] as [number, number, number],
        }));

        const stillMoving = stepPhysics(
          nextBalls,
          0.016,
          () => {}, // collision callback
          () => {
            anyCushionHitRef.current = true;
          }, // cushion hit
          (pocketedId) => {
            pocketedThisTurnRef.current.push(pocketedId);
          } // pocketed callback
        );

        // Record first ball struck by cue ball
        const cue = nextBalls.find((b) => b.id === 0);
        if (cue && !firstBallHitRef.current) {
          for (const other of nextBalls) {
            if (other.id === 0 || other.inPocket) continue;
            const dx = other.position[0] - cue.position[0];
            const dz = other.position[2] - cue.position[2];
            const distSq = dx * dx + dz * dz;
            const hitRadius = cue.radius + other.radius + 0.08;
            if (distSq <= hitRadius * hitRadius) {
              firstBallHitRef.current = other.id;
              break;
            }
          }
        }

        if (!stillMoving) {
          physicsActiveRef.current = false;
          // All balls came to rest — process 8-Ball rules & turn outcome!
          setTimeout(() => handleTurnCompletion(nextBalls), 10);
        }

        return nextBalls;
      });

      animId = requestAnimationFrame(runPhysicsStep);
    };

    animId = requestAnimationFrame(runPhysicsStep);
    return () => cancelAnimationFrame(animId);
  }, []);

  // --- 8-Ball Game Rules & Turn Evaluation ---
  const handleTurnCompletion = (currentBalls: Ball[]) => {
    setIsMoving(false);
    setIsAiming(true);

    const pocketedIds = pocketedThisTurnRef.current;
    const cueBallPocketed = pocketedIds.includes(0);
    const eightBallPocketed = pocketedIds.includes(8);
    const firstHitId = firstBallHitRef.current;
    const cushionHit = anyCushionHitRef.current;

    const currentPlayer = players[activePlayerIndex];
    const opponentIndex = activePlayerIndex === 0 ? 1 : 0;
    const opponent = players[opponentIndex];

    // Check if 8-Ball was pocketed
    if (eightBallPocketed) {
      // Did current player already clear their group?
      const myGroup = currentPlayer.assignedGroup;
      const myRemaining = currentBalls.filter((b) => {
        if (b.inPocket || b.id === 0 || b.id === 8) return false;
        if (myGroup === 'SOLID') return b.type === 'SOLID';
        if (myGroup === 'STRIPE') return b.type === 'STRIPE';
        return true;
      });

      if (cueBallPocketed || myRemaining.length > 0 || myGroup === null) {
        // FOUL ON 8-BALL: Current player loses!
        setWinner(opponent);
        setWinReason('8-Ball pocketed illegally or with scratch!');
        setWinReasonKu('تۆپی ژمارە ٨ بە هەڵە یان لەگەڵ کەوتنی تۆپی سپی خرایە گیرفانەوە!');
      } else {
        // LEGITIMATE WIN
        setWinner(currentPlayer);
        setWinReason(t('en', 'winReason8Ball'));
        setWinReasonKu(t('ku', 'winReason8Ball'));
      }
      return;
    }

    // Check Foul conditions
    let foulMessage: string | null = null;
    let foulMessageKu: string | null = null;

    if (cueBallPocketed) {
      foulMessage = t('en', 'foulScratch');
      foulMessageKu = t('ku', 'foulScratch');
      soundEngine.playScratchSound();
    } else if (firstHitId === null) {
      foulMessage = t('en', 'foulNoHit');
      foulMessageKu = t('ku', 'foulNoHit');
    } else {
      // Did first ball hit belong to opponent?
      const firstBall = currentBalls.find((b) => b.id === firstHitId);
      if (
        firstBall &&
        currentPlayer.assignedGroup &&
        firstBall.type !== 'EIGHT' &&
        firstBall.type !== currentPlayer.assignedGroup
      ) {
        foulMessage = t('en', 'foulWrongBallFirst');
        foulMessageKu = t('ku', 'foulWrongBallFirst');
      } else if (pocketedIds.length === 0 && !cushionHit && breakDone) {
        foulMessage = t('en', 'foulNoCushion');
        foulMessageKu = t('ku', 'foulNoCushion');
      }
    }

    // Assign groups if table was open and a ball was legally pocketed
    if (!foulMessage && tableOpen && pocketedIds.length > 0) {
      const validPocketed = pocketedIds
        .map((id) => currentBalls.find((b) => b.id === id))
        .filter((b) => b && b.id !== 0 && b.id !== 8);

      if (validPocketed.length > 0) {
        const firstType = validPocketed[0]!.type; // SOLID or STRIPE
        const opponentType = firstType === 'SOLID' ? 'STRIPE' : 'SOLID';

        setTableOpen(false);
        setPlayers((prev) => {
          const next = [...prev] as [Player, Player];
          next[activePlayerIndex] = { ...next[activePlayerIndex], assignedGroup: firstType as any };
          next[opponentIndex] = { ...next[opponentIndex], assignedGroup: opponentType as any };
          return next;
        });
      }
    }

    // Update pocketed scores
    setPlayers((prev) => {
      const next = [...prev] as [Player, Player];
      next[0].score = currentBalls.filter((b) => b.inPocket && b.type === next[0].assignedGroup).length;
      next[1].score = currentBalls.filter((b) => b.inPocket && b.type === next[1].assignedGroup).length;
      return next;
    });

    setBreakDone(true);

    // Apply foul ball-in-hand penalty or switch turn
    if (foulMessage) {
      setIsBallInHand(true);
      setBallInHandReason(foulMessage);
      setBallInHandReasonKu(foulMessageKu);
      setActivePlayerIndex(opponentIndex);
    } else {
      // Check if current player pocketed one of their assigned balls
      const myGroup = currentPlayer.assignedGroup;
      const pocketedMyBall = pocketedIds.some((id) => {
        const b = currentBalls.find((x) => x.id === id);
        if (!b) return false;
        if (myGroup === 'SOLID') return b.type === 'SOLID';
        if (myGroup === 'STRIPE') return b.type === 'STRIPE';
        return b.id !== 0 && b.id !== 8; // When open table
      });

      if (!pocketedMyBall) {
        // No ball pocketed -> switch turns
        setActivePlayerIndex(opponentIndex);
      }
    }
  };

  const currentThemeConfig = TABLE_THEMES[tableTheme] || TABLE_THEMES.emerald_glass;

  return (
    <div className="w-full h-full bg-[#05070a] text-white font-sans overflow-hidden flex flex-col relative select-none">
      {/* Background Ambient Glow (from Sophisticated Dark HTML) */}
      <div className="absolute w-[800px] h-[400px] bg-emerald-900/20 blur-[120px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none -z-10"></div>

      {/* Top HUD Navbar */}
      <TopNavbar
        players={players}
        activePlayerIndex={activePlayerIndex}
        language={language}
        onLanguageChange={setLanguage}
        gameMode={gameMode}
        onModeChange={handleModeChange}
        tableTheme={tableTheme}
        onThemeChange={setTableTheme}
        soundEnabled={soundEnabled}
        onSoundToggle={() => setSoundEnabled((prev) => !prev)}
        onResetRack={handleResetRack}
        onOpenRules={() => setIsRulesOpen(true)}
        tableOpen={tableOpen}
      />

      {/* Main 3D Billiards Gameplay Area */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {/* Pocketed Balls display */}
        <PocketedBallsDisplay balls={balls} language={language} />

        {/* Turn & Foul Status Banner */}
        {isBallInHand && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 px-6 py-2.5 rounded-2xl bg-rose-600/90 backdrop-blur-md text-white font-bold text-sm md:text-base border border-rose-400/50 shadow-2xl animate-pulse flex items-center gap-2">
            <span>⚠️</span>
            <span>
              {language === 'ku'
                ? ballInHandReasonKu || t('ku', 'ballInHand')
                : ballInHandReason || t('en', 'ballInHand')}
            </span>
          </div>
        )}

        {/* Three.js 3D Pool Table */}
        <ThreePoolTable
          balls={balls}
          cueAngle={cueAngle}
          onAngleChange={setCueAngle}
          power={power}
          isAiming={isAiming}
          isMoving={isMoving}
          isBallInHand={isBallInHand}
          onPlaceCueBall={handlePlaceCueBall}
          cameraMode={cameraMode}
          theme={currentThemeConfig}
          showGuideline={showGuideline}
        />

        {/* Floating UI Panels (Liquid Glass - Left side) */}
        <div className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-30">
          <SpinController spin={spin} onChange={setSpin} language={language} />
        </div>

        {/* Floating UI Panels (Liquid Glass - Right side: Power Meter) */}
        <div className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 flex flex-col items-end gap-6 z-30">
          <PowerBar
            power={power}
            onChange={setPower}
            onShoot={() => executeShot(cueAngle, power, spin)}
            disabled={isMoving || isBallInHand || Boolean(winner)}
            language={language}
          />
        </div>
      </div>

      {/* Bottom Controls HUD */}
      <BottomHUD
        cueAngle={cueAngle}
        power={power}
        onShoot={() => executeShot(cueAngle, power, spin)}
        canShoot={!isMoving && !isBallInHand && !winner}
        cameraMode={cameraMode}
        onCameraChange={setCameraMode}
        showGuideline={showGuideline}
        onToggleGuideline={() => setShowGuideline((prev) => !prev)}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        language={language}
        onUndo={handleUndoShot}
        showUndo={gameMode === 'PRACTICE'}
      />

      {/* Rules Modal */}
      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
        language={language}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        language={language}
        onLanguageChange={setLanguage}
        gameMode={gameMode}
        onModeChange={handleModeChange}
        tableTheme={tableTheme}
        onThemeChange={setTableTheme}
        aiDifficulty={aiDifficulty}
        onDifficultyChange={setAiDifficulty}
        showGuideline={showGuideline}
        onToggleGuideline={() => setShowGuideline((prev) => !prev)}
      />

      {/* Winner Celebration Modal */}
      <WinnerModal
        winner={winner}
        winReason={winReason}
        winReasonKu={winReasonKu}
        onPlayAgain={handleResetRack}
        language={language}
      />
    </div>
  );
}

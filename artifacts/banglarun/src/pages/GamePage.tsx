import { useEffect, useRef, useState, useCallback } from "react";
import {
  playJump, playSlide, playCorrect, playWrong, playClick,
  playPowerUp, playLoseLife, playLand, playCelebration, playCertificateReveal,
  startBgMusic, stopBgMusic, toggleMute, resumeAudio,
} from "@/game/audio";
import { downloadCertificate } from "@/game/certificate";
import {
  QUESTIONS, getQuestionByDifficulty, CATEGORY_COLORS, CATEGORY_LABELS,
  type Question,
} from "@/game/questions";

// ─── Constants ────────────────────────────────────────────────────────────────
const CANVAS_W = 900;
const CANVAS_H = 500;
const GROUND_Y = 400;
const PLAYER_X = 180;
const GRAVITY = 0.65;
const JUMP_FORCE = -15;
const INITIAL_SPEED = 5;
const MAX_SPEED = 14;
const SPEED_INCREMENT = 0.0008;
const CELEBRATION_TIME_SEC = 30;
const NPC_TARGET_X = CANVAS_W - 310;
const NPC_WIDTH = 195;
const NPC_HEIGHT = 270;

function loadImage(src: string, onLoad: (img: HTMLImageElement) => void) {
  const img = new Image();
  img.src = src;
  img.onload = () => onLoad(img);
}

// ─── Types ────────────────────────────────────────────────────────────────────
type GameScreen = "menu" | "playing" | "paused" | "quiz" | "gameover" | "handshake" | "celebration";

interface Obstacle {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  type: "jump" | "slide";
  category: Question["category"];
  label: string;
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  alpha: number; color: string; size: number;
}

interface FloatingText {
  x: number; y: number; text: string; color: string;
  alpha: number; vy: number; age: number;
}

// ─── GamePage ─────────────────────────────────────────────────────────────────
export default function GamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<HTMLImageElement | null>(null);
  const charRef = useRef<HTMLImageElement | null>(null);
  const treeRef = useRef<HTMLImageElement | null>(null);
  const npcRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Game state (refs for loop, state for UI)
  const gs = useRef({
    screen: "menu" as GameScreen,
    score: 0,
    highScore: parseInt(localStorage.getItem("banglarun_hs") || "0", 10),
    lives: 3,
    combo: 0,
    distance: 0,
    speed: INITIAL_SPEED,
    tick: 0,
    // Player
    playerY: GROUND_Y,
    playerVY: 0,
    isJumping: false,
    isSliding: false,
    slideTimer: 0,
    invincible: false,
    invincibleTimer: 0,
    // Obstacles
    obstacles: [] as Obstacle[],
    nextObstacleDist: 0,
    obsId: 0,
    // Particles / floating text
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    // BG scroll
    bgOffset: 0,
    bgOffset2: 0,
    bgOffset3: 0,
    // Power-ups
    hintUsed: false,
    skipUsed: false,
    // Quiz
    activeQuestion: null as Question | null,
    usedQuestionIds: new Set<number>(),
    showHint: false,
    answerResult: null as "correct" | "wrong" | null,
    selectedAnswer: -1,
    // Celebration
    runElapsedMs: 0,
    lastFrameTime: 0,
    celebrationShown: false,
    confetti: [] as { x: number; y: number; vx: number; vy: number; color: string; rot: number; size: number }[],
    // Milon MP handshake
    npcX: CANVAS_W + 80,
    npcPhase: "idle" as "idle" | "enter" | "shake" | "done",
    npcTimer: 0,
    handshakeTick: 0,
  });

  const [screen, setScreen] = useState<GameScreen>("menu");
  const [uiScore, setUiScore] = useState(0);
  const [uiLives, setUiLives] = useState(3);
  const [uiCombo, setUiCombo] = useState(0);
  const [uiHighScore, setUiHighScore] = useState(
    parseInt(localStorage.getItem("banglarun_hs") || "0", 10)
  );
  const [mutedState, setMutedState] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [answerResult, setAnswerResult] = useState<null | "correct" | "wrong">(null);
  const [selectedAnswer, setSelectedAnswer] = useState(-1);
  const [hintUsed, setHintUsed] = useState(false);
  const [skipUsed, setSkipUsed] = useState(false);
  const [quizShake, setQuizShake] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ w: CANVAS_W, h: CANVAS_H, scale: 1 });
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem("banglarun_name") || "Milon Runner"
  );
  const [elapsedSec, setElapsedSec] = useState(0);
  const spokenQuestionIdRef = useRef<number | null>(null);

  // ── Canvas scaling ──────────────────────────────────────────────────────────
  useEffect(() => {
    const resize = () => {
      const ww = window.innerWidth;
      const wh = window.innerHeight;
      const scale = Math.min(ww / CANVAS_W, wh / CANVAS_H);
      setCanvasSize({ w: CANVAS_W, h: CANVAS_H, scale });
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // ── HD canvas backing store ─────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
    }
  }, []);

  // ── Load images ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const bg = new Image();
    bg.src = "/background.png";
    bg.onload = () => { bgRef.current = bg; };
    loadImage("/milon-character.png", (img) => { charRef.current = img; });
    loadImage("/milon-mp.png", (img) => { npcRef.current = img; });
    loadImage("/tree.png", (img) => { treeRef.current = img; });
  }, []);

  // ── Quiz speech ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (screen !== "quiz" || !currentQuestion) {
      spokenQuestionIdRef.current = null;
      window.speechSynthesis?.cancel();
      return;
    }

    if (spokenQuestionIdRef.current === currentQuestion.id) return;
    spokenQuestionIdRef.current = currentQuestion.id;

    const synth = window.speechSynthesis;
    if (!synth) return;

    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(
      `প্রশ্ন: ${currentQuestion.question}`
    );
    utterance.lang = "bn-BD";
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;

    const chooseVoice = () => {
      const voices = synth.getVoices();
      return (
        voices.find((voice) => voice.lang.toLowerCase().startsWith("bn")) ??
        voices.find((voice) => voice.lang.toLowerCase().startsWith("bn-bd")) ??
        voices.find((voice) => voice.lang.toLowerCase().startsWith("bn-in")) ??
        voices[0] ??
        null
      );
    };

    const speak = () => {
      const voice = chooseVoice();
      if (voice) utterance.voice = voice;
      synth.speak(utterance);
    };

    if (synth.getVoices().length > 0) {
      speak();
      return;
    }

    const handleVoicesChanged = () => {
      synth.removeEventListener("voiceschanged", handleVoicesChanged);
      speak();
    };

    synth.addEventListener("voiceschanged", handleVoicesChanged);
    return () => {
      synth.removeEventListener("voiceschanged", handleVoicesChanged);
      synth.cancel();
    };
  }, [screen, currentQuestion]);

  // ── Draw functions ──────────────────────────────────────────────────────────
  const drawBackground = useCallback((ctx: CanvasRenderingContext2D, tick: number) => {
    const g = gs.current;
    // Sky gradient (richer HD tones)
    const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    sky.addColorStop(0, "#0d4f8c");
    sky.addColorStop(0.35, "#2a7ec4");
    sky.addColorStop(0.72, "#5cb8d4");
    sky.addColorStop(1, "#7ecf98");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Sun
    const sunX = 760;
    const sunY = 70;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 5, sunX, sunY, 60);
    sunGlow.addColorStop(0, "rgba(255,230,100,0.9)");
    sunGlow.addColorStop(0.4, "rgba(255,200,50,0.4)");
    sunGlow.addColorStop(1, "rgba(255,200,50,0)");
    ctx.fillStyle = sunGlow;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.beginPath();
    ctx.arc(sunX, sunY, 30, 0, Math.PI * 2);
    ctx.fillStyle = "#ffe066";
    ctx.fill();

    // Far hills (slowest parallax)
    const hill1Off = (g.bgOffset * 0.15) % CANVAS_W;
    ctx.fillStyle = "#3a9e5f";
    for (let rep = -1; rep <= 1; rep++) {
      const ox = -hill1Off + rep * CANVAS_W;
      ctx.beginPath();
      ctx.moveTo(ox, CANVAS_H);
      ctx.bezierCurveTo(ox + 100, GROUND_Y - 80, ox + 200, GROUND_Y - 110, ox + 300, GROUND_Y - 60);
      ctx.bezierCurveTo(ox + 400, GROUND_Y - 10, ox + 500, GROUND_Y - 100, ox + 600, GROUND_Y - 80);
      ctx.bezierCurveTo(ox + 700, GROUND_Y - 60, ox + 800, GROUND_Y - 90, ox + CANVAS_W, GROUND_Y - 50);
      ctx.lineTo(ox + CANVAS_W, CANVAS_H);
      ctx.closePath();
      ctx.fill();
    }

    // Background image (Bangladesh scenery)
    if (bgRef.current) {
      const bw = CANVAS_W * 1.4;
      const bh = (CANVAS_H - 80) * 0.85;
      const bx = -(g.bgOffset * 0.2) % bw;
      ctx.globalAlpha = 0.55;
      for (let r = -1; r <= 1; r++) {
        ctx.drawImage(bgRef.current, bx + r * bw, GROUND_Y - bh + 10, bw, bh);
      }
      ctx.globalAlpha = 1;
    }

    // Mid trees (HD PNG sprites, medium parallax)
    const tree2Off = (g.bgOffset * 0.5) % (CANVAS_W * 1.5);
    if (treeRef.current) {
      for (let i = 0; i < 10; i++) {
        const tx = (i * 165 - tree2Off + CANVAS_W * 1.5) % (CANVAS_W * 1.5) - 60;
        const depth = 0.75 + (i % 3) * 0.12;
        const tw = 110 * depth;
        const th = 175 * depth;
        const ty = GROUND_Y - th + 8;
        ctx.save();
        ctx.globalAlpha = 0.92 + (i % 2) * 0.06;
        ctx.shadowColor = "rgba(0,0,0,0.35)";
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 6;
        ctx.drawImage(treeRef.current, tx, ty, tw, th);
        ctx.restore();
      }
    }

    // Ground
    const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_H);
    groundGrad.addColorStop(0, "#5ec463");
    groundGrad.addColorStop(0.06, "#43a047");
    groundGrad.addColorStop(0.25, "#2e7d32");
    groundGrad.addColorStop(1, "#1b5e20");
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);

    // Ground line
    ctx.fillStyle = "#81c784";
    ctx.fillRect(0, GROUND_Y, CANVAS_W, 3);

    // Ground stripes (speed lines)
    const stripeOff = (g.bgOffset * 1.2) % 80;
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    for (let i = -1; i < CANVAS_W / 80 + 1; i++) {
      const sx = i * 80 - stripeOff;
      ctx.fillRect(sx, GROUND_Y + 4, 40, 3);
    }

    // Clouds
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    const cloudOff = (g.bgOffset * 0.08) % CANVAS_W;
    [[100, 60], [350, 40], [600, 75], [820, 55]].forEach(([cx, cy]) => {
      const x = (cx - cloudOff + CANVAS_W * 2) % (CANVAS_W * 2) - 100;
      ctx.beginPath();
      ctx.arc(x, cy, 28, 0, Math.PI * 2);
      ctx.arc(x + 30, cy - 10, 22, 0, Math.PI * 2);
      ctx.arc(x + 55, cy, 25, 0, Math.PI * 2);
      ctx.fill();
    });
  }, []);

  const drawPlayer = useCallback((ctx: CanvasRenderingContext2D) => {
    const g = gs.current;
    const isSlide = g.isSliding;
    const isInvincible = g.invincible && Math.floor(g.tick / 6) % 2 === 0;
    const bob = isSlide ? 0 : Math.sin(g.tick * 0.25) * 3;

    const pw = isSlide ? 120 : 130;
    const ph = isSlide ? 80 : 155;
    const px = PLAYER_X - pw / 2;
    const py = g.playerY - ph + bob;

    // Speed trail streaks behind character
    if (!isSlide) {
      const trailColors = ["rgba(39,174,96,0.18)", "rgba(241,196,15,0.12)", "rgba(39,174,96,0.08)"];
      for (let t = 0; t < 3; t++) {
        const offset = (t + 1) * 18;
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.fillStyle = trailColors[t];
        ctx.beginPath();
        ctx.ellipse(PLAYER_X - offset, g.playerY - ph * 0.5 + bob, pw * 0.35, ph * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      // Horizontal speed lines
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 2;
      const lineCount = 4;
      for (let i = 0; i < lineCount; i++) {
        const lineY = py + ph * 0.3 + i * (ph * 0.14);
        const lineLen = 28 + Math.sin(g.tick * 0.4 + i) * 10;
        ctx.beginPath();
        ctx.moveTo(px - 10, lineY);
        ctx.lineTo(px - 10 - lineLen, lineY);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Glow aura (pulsing)
    const glowPulse = 0.55 + Math.sin(g.tick * 0.18) * 0.2;
    const glowColor = g.invincible
      ? `rgba(241,196,15,${glowPulse * 0.55})`
      : `rgba(39,174,96,${glowPulse * 0.35})`;
    const auraGrad = ctx.createRadialGradient(
      PLAYER_X, g.playerY - ph * 0.5 + bob, 10,
      PLAYER_X, g.playerY - ph * 0.5 + bob, pw * 0.85
    );
    auraGrad.addColorStop(0, glowColor);
    auraGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.save();
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.ellipse(PLAYER_X, g.playerY - ph * 0.5 + bob, pw * 0.85, ph * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (isInvincible) ctx.globalAlpha = 0.5;

    if (charRef.current) {
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      if (g.screen === "handshake" && g.npcPhase === "shake") {
        const lean = Math.sin(g.handshakeTick * 0.35) * 10;
        ctx.translate(lean, Math.sin(g.handshakeTick * 0.5) * 3);
      }
      if (isSlide) {
        ctx.translate(PLAYER_X, g.playerY - 38);
        ctx.rotate(0.35);
        ctx.drawImage(charRef.current, -pw / 2, -36, pw, pw);
      } else {
        ctx.drawImage(charRef.current, px, py, pw, ph);
      }
      ctx.restore();
    } else {
      ctx.fillStyle = isInvincible ? "#81c784" : "#4caf50";
      ctx.fillRect(px, py, pw, ph);
      ctx.fillStyle = "#fff";
      ctx.fillRect(px + 18, py + 18, 14, 14);
      ctx.fillRect(px + 40, py + 18, 14, 14);
    }

    ctx.globalAlpha = 1;

    // Jump shadow
    if (g.isJumping) {
      const shadowH = Math.max(0, 1 - (GROUND_Y - g.playerY) / 250);
      ctx.save();
      ctx.globalAlpha = shadowH * 0.35;
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.ellipse(PLAYER_X, GROUND_Y + 2, 32 * shadowH + 12, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }, []);

  const drawNpc = useCallback((ctx: CanvasRenderingContext2D) => {
    const g = gs.current;
    if (g.screen !== "handshake" || !npcRef.current) return;

    const shake = g.npcPhase === "shake" ? Math.sin(g.handshakeTick * 0.35) * -10 : 0;
    const bob = g.npcPhase === "shake" ? Math.sin(g.handshakeTick * 0.5) * 4 : 0;
    const nx = g.npcX + shake;
    const ny = GROUND_Y - NPC_HEIGHT + bob;

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.shadowColor = "rgba(241,196,15,0.45)";
    ctx.shadowBlur = 22;
    ctx.drawImage(npcRef.current, nx, ny, NPC_WIDTH, NPC_HEIGHT);
    ctx.restore();

    if (g.npcPhase === "shake") {
      const hx = PLAYER_X + NPC_WIDTH * 0.55;
      const hy = GROUND_Y - NPC_HEIGHT * 0.62 + bob;
      ctx.save();
      ctx.font = `bold ${28 + Math.sin(g.handshakeTick * 0.4) * 5}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff";
      ctx.shadowColor = "rgba(241,196,15,0.8)";
      ctx.shadowBlur = 12;
      ctx.fillText("🤝", hx, hy);
      ctx.restore();
    }
  }, []);

  const drawHandshakeBanner = useCallback((ctx: CanvasRenderingContext2D) => {
    const g = gs.current;
    if (g.screen !== "handshake") return;

    const alpha = g.npcPhase === "enter" ? 0.85 : 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath();
    ctx.roundRect(CANVAS_W / 2 - 165, 108, 330, 42, 12);
    ctx.fill();
    ctx.strokeStyle = "rgba(241,196,15,0.6)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#f1c40f";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const label = g.npcPhase === "enter"
      ? "🇧🇩 Milon MP is joining you!"
      : g.npcPhase === "shake"
        ? "🤝 Handshake with Milon MP!"
        : "🎉 Achievement unlocked!";
    ctx.fillText(label, CANVAS_W / 2, 129);
    ctx.restore();
  }, []);

  const drawObstacles = useCallback((ctx: CanvasRenderingContext2D) => {
    const g = gs.current;
    for (const obs of g.obstacles) {
      const catColor = CATEGORY_COLORS[obs.category];
      const darkerColor = catColor + "cc";

      ctx.save();
      // Obstacle body
      const rx = 8;
      ctx.beginPath();
      ctx.moveTo(obs.x + rx, obs.y);
      ctx.lineTo(obs.x + obs.w - rx, obs.y);
      ctx.quadraticCurveTo(obs.x + obs.w, obs.y, obs.x + obs.w, obs.y + rx);
      ctx.lineTo(obs.x + obs.w, obs.y + obs.h - rx);
      ctx.quadraticCurveTo(obs.x + obs.w, obs.y + obs.h, obs.x + obs.w - rx, obs.y + obs.h);
      ctx.lineTo(obs.x + rx, obs.y + obs.h);
      ctx.quadraticCurveTo(obs.x, obs.y + obs.h, obs.x, obs.y + obs.h - rx);
      ctx.lineTo(obs.x, obs.y + rx);
      ctx.quadraticCurveTo(obs.x, obs.y, obs.x + rx, obs.y);
      ctx.closePath();

      const grad = ctx.createLinearGradient(obs.x, obs.y, obs.x, obs.y + obs.h);
      grad.addColorStop(0, catColor);
      grad.addColorStop(1, darkerColor);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Question mark icon
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.font = `bold ${Math.min(obs.w * 0.5, 28)}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("?", obs.x + obs.w / 2, obs.y + obs.h / 2 - 8);

      // Category label
      ctx.font = `bold 10px Arial`;
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      const shortLabel = obs.category === "bangladesh" ? "BD" : obs.category.slice(0, 3).toUpperCase();
      ctx.fillText(shortLabel, obs.x + obs.w / 2, obs.y + obs.h - 10);

      // Ground shadow
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.ellipse(obs.x + obs.w / 2, GROUND_Y + 3, obs.w / 2, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }, []);

  const drawParticles = useCallback((ctx: CanvasRenderingContext2D) => {
    const g = gs.current;
    for (const p of g.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    for (const ft of g.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.font = "bold 22px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }, []);

  const drawHUD = useCallback((ctx: CanvasRenderingContext2D) => {
    const g = gs.current;
    // Score
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath();
    ctx.roundRect(10, 10, 140, 44, 10);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "left";
    ctx.fillText("SCORE", 20, 26);
    ctx.font = "bold 18px Arial";
    ctx.fillStyle = "#f1c40f";
    ctx.fillText(g.score.toString(), 20, 46);
    ctx.restore();

    // Lives hearts
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath();
    ctx.roundRect(CANVAS_W / 2 - 60, 10, 120, 44, 10);
    ctx.fill();
    ctx.font = "22px Arial";
    ctx.textAlign = "center";
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < g.lives ? "#e74c3c" : "rgba(255,255,255,0.2)";
      ctx.fillText("❤", CANVAS_W / 2 - 30 + i * 30, 38);
    }
    ctx.restore();

    // Distance & timer
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath();
    ctx.roundRect(CANVAS_W - 150, 10, 140, 44, 10);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "right";
    ctx.fillText("DISTANCE", CANVAS_W - 20, 26);
    ctx.font = "bold 18px Arial";
    ctx.fillStyle = "#2ecc71";
    ctx.fillText(`${Math.floor(g.distance)}m`, CANVAS_W - 20, 46);
    ctx.restore();

    // Run timer toward 30s goal
    const runSec = Math.floor(g.runElapsedMs / 1000);
    const timerFrac = Math.min(1, runSec / CELEBRATION_TIME_SEC);
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath();
    ctx.roundRect(CANVAS_W / 2 - 70, 62, 140, 28, 8);
    ctx.fill();
    ctx.fillStyle = timerFrac >= 1 ? "#f1c40f" : "rgba(255,255,255,0.7)";
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`⏱ ${runSec}s / ${CELEBRATION_TIME_SEC}s`, CANVAS_W / 2, 80);
    ctx.restore();

    // Combo
    if (g.combo >= 2) {
      ctx.save();
      const comboAlpha = Math.min(1, (g.combo - 1) * 0.2 + 0.5);
      ctx.globalAlpha = comboAlpha;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.beginPath();
      ctx.roundRect(10, 62, 130, 36, 8);
      ctx.fill();
      ctx.font = "bold 16px Arial";
      ctx.fillStyle = "#f39c12";
      ctx.textAlign = "left";
      ctx.fillText(`🔥 ×${g.combo} COMBO!`, 18, 84);
      ctx.restore();
    }

    // Speed indicator
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.roundRect(10, CANVAS_H - 24, 100, 16, 6);
    ctx.fill();
    const speedFrac = (g.speed - INITIAL_SPEED) / (MAX_SPEED - INITIAL_SPEED);
    const speedGrad = ctx.createLinearGradient(10, 0, 110, 0);
    speedGrad.addColorStop(0, "#2ecc71");
    speedGrad.addColorStop(1, "#e74c3c");
    ctx.fillStyle = speedGrad;
    ctx.beginPath();
    ctx.roundRect(10, CANVAS_H - 24, Math.max(10, speedFrac * 100), 16, 6);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 9px Arial";
    ctx.textAlign = "left";
    ctx.fillText("SPEED", 14, CANVAS_H - 12);
    ctx.restore();
  }, []);

  // ── Game logic ──────────────────────────────────────────────────────────────
  const spawnObstacle = useCallback(() => {
    const g = gs.current;
    const categories: Question["category"][] = ["math", "english", "science", "bangladesh"];
    const cat = categories[Math.floor(Math.random() * categories.length)];
    const isSlideType = Math.random() < 0.35 && g.tick > 300;

    if (isSlideType) {
      g.obstacles.push({
        id: g.obsId++,
        x: CANVAS_W + 20,
        y: GROUND_Y - 90,
        w: 90,
        h: 50,
        type: "slide",
        category: cat,
        label: CATEGORY_LABELS[cat],
      });
    } else {
      const h = 60 + Math.random() * 40;
      g.obstacles.push({
        id: g.obsId++,
        x: CANVAS_W + 20,
        y: GROUND_Y - h,
        w: 55,
        h,
        type: "jump",
        category: cat,
        label: CATEGORY_LABELS[cat],
      });
    }
    g.nextObstacleDist = 320 + Math.random() * 250 - Math.min(80, g.distance * 0.05);
  }, []);

  const spawnParticles = useCallback((x: number, y: number, color: string, count = 12) => {
    const g = gs.current;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 2 + Math.random() * 4;
      g.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        alpha: 1, color,
        size: 3 + Math.random() * 4,
      });
    }
  }, []);

  const addFloatingText = useCallback((x: number, y: number, text: string, color: string) => {
    const g = gs.current;
    g.floatingTexts.push({ x, y, text, color, alpha: 1, vy: -2, age: 0 });
  }, []);

  const triggerQuiz = useCallback((obs: Obstacle) => {
    const g = gs.current;
    const difficulty = Math.min(3, Math.floor(g.distance / 500) + 1) as 1 | 2 | 3;
    const q = getQuestionByDifficulty(difficulty, g.usedQuestionIds);
    g.usedQuestionIds.add(q.id);
    g.activeQuestion = q;
    g.screen = "quiz";
    g.showHint = false;
    g.answerResult = null;
    g.selectedAnswer = -1;
    setCurrentQuestion(q);
    setShowHint(false);
    setAnswerResult(null);
    setSelectedAnswer(-1);
    setScreen("quiz");
  }, []);

  const checkCollision = useCallback(() => {
    const g = gs.current;
    if (g.invincible) return;
    const ph = g.isSliding ? 80 : 155;
    const pw = 130;
    const px1 = PLAYER_X - pw / 2 + 20;
    const px2 = PLAYER_X + pw / 2 - 20;
    const py1 = g.playerY - ph + 10;
    const py2 = g.playerY;

    for (let i = 0; i < g.obstacles.length; i++) {
      const obs = g.obstacles[i];
      if (
        px2 > obs.x + 8 && px1 < obs.x + obs.w - 8 &&
        py2 > obs.y + 5 && py1 < obs.y + obs.h - 5
      ) {
        g.obstacles.splice(i, 1);
        spawnParticles(obs.x + obs.w / 2, obs.y + obs.h / 2, CATEGORY_COLORS[obs.category]);
        triggerQuiz(obs);
        return;
      }
    }
  }, [spawnParticles, triggerQuiz]);

  const spawnConfetti = useCallback(() => {
    const g = gs.current;
    const colors = ["#f1c40f", "#e74c3c", "#27ae60", "#3498db", "#9b59b6", "#e67e22"];
    g.confetti = [];
    for (let i = 0; i < 120; i++) {
      g.confetti.push({
        x: Math.random() * CANVAS_W,
        y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 6,
        vy: 2 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * Math.PI * 2,
        size: 4 + Math.random() * 8,
      });
    }
  }, []);

  // ── Main game loop ──────────────────────────────────────────────────────────
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const g = gs.current;

    if (g.screen !== "playing" && g.screen !== "handshake") {
      rafRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    g.tick++;

    if (g.screen === "handshake") {
      g.handshakeTick++;
      g.npcTimer++;
      g.speed = Math.max(0.8, g.speed * 0.94);
      g.bgOffset += g.speed * 0.35;
      g.bgOffset2 += g.speed * 0.2;
      g.bgOffset3 += g.speed * 0.1;

      if (g.npcPhase === "enter") {
        g.npcX += (NPC_TARGET_X - g.npcX) * 0.07;
        if (Math.abs(g.npcX - NPC_TARGET_X) < 3 || g.npcTimer > 85) {
          g.npcPhase = "shake";
          g.npcTimer = 0;
          g.npcX = NPC_TARGET_X;
        }
      } else if (g.npcPhase === "shake" && g.npcTimer > 130) {
        g.npcPhase = "done";
        g.celebrationShown = true;
        g.screen = "celebration";
        setElapsedSec(CELEBRATION_TIME_SEC);
        setScreen("celebration");
        stopBgMusic();
        playCelebration();
        spawnConfetti();
      }

      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      drawBackground(ctx, g.tick);
      drawPlayer(ctx);
      drawNpc(ctx);
      drawHandshakeBanner(ctx);
      drawParticles(ctx);
      drawHUD(ctx);

      rafRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    g.distance += g.speed * 0.05;
    g.speed = Math.min(MAX_SPEED, INITIAL_SPEED + g.distance * SPEED_INCREMENT);
    g.bgOffset += g.speed;
    g.bgOffset2 += g.speed * 0.6;
    g.bgOffset3 += g.speed * 0.3;

    // Player physics
    if (g.isJumping) {
      g.playerVY += GRAVITY;
      g.playerY += g.playerVY;
      if (g.playerY >= GROUND_Y) {
        if (g.isJumping) playLand();
        g.playerY = GROUND_Y;
        g.playerVY = 0;
        g.isJumping = false;
      }
    }
    if (g.isSliding) {
      g.slideTimer--;
      if (g.slideTimer <= 0) g.isSliding = false;
    }
    if (g.invincible) {
      g.invincibleTimer--;
      if (g.invincibleTimer <= 0) g.invincible = false;
    }

    // Spawn obstacles
    g.nextObstacleDist -= g.speed;
    if (g.nextObstacleDist <= 0) spawnObstacle();

    // Move obstacles
    g.obstacles = g.obstacles.filter((o) => {
      o.x -= g.speed;
      return o.x + o.w > -10;
    });

    // Update particles
    g.particles = g.particles.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.alpha -= 0.025;
      return p.alpha > 0;
    });

    // Update floating texts
    g.floatingTexts = g.floatingTexts.filter((ft) => {
      ft.y += ft.vy;
      ft.age++;
      ft.alpha = Math.max(0, 1 - ft.age / 60);
      return ft.alpha > 0;
    });

    // Collision
    checkCollision();

    // Track active running time (playing screen only)
    const now = Date.now();
    if (g.lastFrameTime > 0) {
      g.runElapsedMs += now - g.lastFrameTime;
    }
    g.lastFrameTime = now;
    const elapsed = g.runElapsedMs / 1000;

    // 30-second Milon MP handshake trigger
    if (!g.celebrationShown && elapsed >= CELEBRATION_TIME_SEC) {
      g.screen = "handshake";
      g.npcPhase = "enter";
      g.npcTimer = 0;
      g.handshakeTick = 0;
      g.npcX = CANVAS_W + 80;
      setElapsedSec(CELEBRATION_TIME_SEC);
      setScreen("handshake");
      playPowerUp();
    } else if (Math.floor(elapsed) !== elapsedSec) {
      setElapsedSec(Math.floor(elapsed));
    }

    // Sync UI score
    const newScore = Math.floor(g.score);
    if (newScore !== uiScore) {
      setUiScore(newScore);
      setUiLives(g.lives);
      setUiCombo(g.combo);
    }

    // Draw
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    drawBackground(ctx, g.tick);
    drawObstacles(ctx);
    drawPlayer(ctx);
    drawParticles(ctx);
    drawHUD(ctx);

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [checkCollision, drawBackground, drawObstacles, drawPlayer, drawNpc, drawHandshakeBanner, drawParticles, drawHUD, spawnObstacle, spawnConfetti, uiScore, elapsedSec]);

  const continueAfterCelebration = useCallback(() => {
    playClick();
    const g = gs.current;
    g.screen = "playing";
    g.lastFrameTime = Date.now();
    setScreen("playing");
    startBgMusic();
  }, []);

  const handleDownloadCertificate = useCallback(() => {
    playCertificateReveal();
    const g = gs.current;
    downloadCertificate({
      playerName,
      score: Math.floor(g.score),
      distance: g.distance,
      combo: g.combo,
      date: new Date().toLocaleDateString("en-BD", {
        year: "numeric", month: "long", day: "numeric",
      }),
    });
  }, [playerName]);

  // ── Start / restart ─────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    playClick();
    resumeAudio();
    const g = gs.current;
    g.screen = "playing";
    g.score = 0;
    g.lives = 3;
    g.combo = 0;
    g.distance = 0;
    g.speed = INITIAL_SPEED;
    g.tick = 0;
    g.playerY = GROUND_Y;
    g.playerVY = 0;
    g.isJumping = false;
    g.isSliding = false;
    g.invincible = false;
    g.invincibleTimer = 0;
    g.obstacles = [];
    g.nextObstacleDist = 400;
    g.particles = [];
    g.floatingTexts = [];
    g.bgOffset = 0;
    g.hintUsed = false;
    g.skipUsed = false;
    g.usedQuestionIds = new Set();
    g.runElapsedMs = 0;
    g.lastFrameTime = Date.now();
    g.celebrationShown = false;
    g.confetti = [];
    g.npcX = CANVAS_W + 80;
    g.npcPhase = "idle";
    g.npcTimer = 0;
    g.handshakeTick = 0;
    setElapsedSec(0);
    setScreen("playing");
    setUiScore(0);
    setUiLives(3);
    setUiCombo(0);
    setHintUsed(false);
    setSkipUsed(false);
    startBgMusic();
  }, []);

  const pauseGame = useCallback(() => {
    const g = gs.current;
    if (g.screen === "playing") {
      g.screen = "paused";
      setScreen("paused");
      stopBgMusic();
      playClick();
    }
  }, []);

  const resumeGame = useCallback(() => {
    const g = gs.current;
    if (g.screen === "paused") {
      g.screen = "playing";
      g.lastFrameTime = Date.now();
      setScreen("playing");
      startBgMusic();
      playClick();
    }
  }, []);

  const gameOver = useCallback(() => {
    const g = gs.current;
    g.screen = "gameover";
    setScreen("gameover");
    stopBgMusic();
    if (g.score > g.highScore) {
      g.highScore = g.score;
      localStorage.setItem("banglarun_hs", g.score.toString());
      setUiHighScore(g.score);
    }
    setUiHighScore(g.highScore);
  }, []);

  // ── Controls ─────────────────────────────────────────────────────────────────
  const doJump = useCallback(() => {
    const g = gs.current;
    if (g.screen !== "playing") return;
    if (!g.isJumping) {
      g.isJumping = true;
      g.playerVY = JUMP_FORCE;
      g.isSliding = false;
      playJump();
      spawnParticles(PLAYER_X, GROUND_Y, "#81c784", 6);
    }
  }, [spawnParticles]);

  const doSlide = useCallback(() => {
    const g = gs.current;
    if (g.screen !== "playing") return;
    if (!g.isSliding) {
      g.isSliding = true;
      g.slideTimer = 45;
      playSlide();
    }
  }, []);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        doJump();
      }
      if (e.code === "ArrowDown" || e.code === "KeyS") {
        e.preventDefault();
        doSlide();
      }
      if (e.code === "Escape") {
        const g = gs.current;
        if (g.screen === "playing") pauseGame();
        else if (g.screen === "paused") resumeGame();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doJump, doSlide, pauseGame, resumeGame]);

  // Start RAF
  useEffect(() => {
    rafRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [gameLoop]);

  // ── Answer quiz ─────────────────────────────────────────────────────────────
  const handleAnswer = useCallback((idx: number) => {
    const g = gs.current;
    if (g.answerResult !== null) return;
    const q = g.activeQuestion;
    if (!q) return;
    g.selectedAnswer = idx;
    g.answerResult = idx === q.correctIndex ? "correct" : "wrong";
    setSelectedAnswer(idx);
    setAnswerResult(g.answerResult);

    if (g.answerResult === "correct") {
      playCorrect();
      g.combo++;
      const bonus = 100 + g.combo * 50 + Math.floor(g.distance * 0.2);
      g.score += bonus;
      setUiScore(Math.floor(g.score));
      setUiCombo(g.combo);
      addFloatingText(PLAYER_X, g.playerY - 130, `+${bonus}`, "#f1c40f");
      spawnParticles(PLAYER_X, g.playerY - 60, "#27ae60", 20);
      setTimeout(() => {
        g.screen = "playing";
        g.activeQuestion = null;
        g.invincible = true;
        g.invincibleTimer = 90;
        g.lastFrameTime = Date.now();
        setScreen("playing");
      }, 1200);
    } else {
      playWrong();
      g.combo = 0;
      setUiCombo(0);
      setQuizShake(true);
      setTimeout(() => setQuizShake(false), 500);
      g.lives--;
      setUiLives(g.lives);
      playLoseLife();
      spawnParticles(PLAYER_X, g.playerY - 60, "#e74c3c", 15);
      if (g.lives <= 0) {
        setTimeout(() => {
          g.screen = "gameover";
          setScreen("gameover");
          gameOver();
        }, 1200);
      } else {
        setTimeout(() => {
          g.screen = "playing";
          g.activeQuestion = null;
          g.invincible = true;
          g.invincibleTimer = 120;
          g.lastFrameTime = Date.now();
          setScreen("playing");
        }, 1500);
      }
    }
  }, [addFloatingText, spawnParticles, gameOver]);

  const useHint = useCallback(() => {
    const g = gs.current;
    if (g.hintUsed || !g.activeQuestion) return;
    g.hintUsed = true;
    g.showHint = true;
    setHintUsed(true);
    setShowHint(true);
    playPowerUp();
  }, []);

  const useSkip = useCallback(() => {
    const g = gs.current;
    if (g.skipUsed || !g.activeQuestion) return;
    g.skipUsed = true;
    setSkipUsed(true);
    playPowerUp();
    g.combo = 0;
    g.screen = "playing";
    g.activeQuestion = null;
    g.invincible = true;
    g.invincibleTimer = 60;
    g.lastFrameTime = Date.now();
    setScreen("playing");
    addFloatingText(PLAYER_X, gs.current.playerY - 120, "SKIPPED!", "#9b59b6");
  }, [addFloatingText]);

  const handleMute = useCallback(() => {
    const m = toggleMute();
    setMutedState(m);
    playClick();
  }, []);

  // ── Category color class helper ─────────────────────────────────────────────
  const catClass = (cat?: Question["category"]) => {
    if (!cat) return "";
    return `cat-${cat}`;
  };

  // ── Score total ─────────────────────────────────────────────────────────────
  const scoreDisplay = Math.floor(gs.current.score);

  return (
    <div className="game-wrapper" ref={containerRef}>
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: canvasSize.w * canvasSize.scale,
          height: canvasSize.h * canvasSize.scale,
          cursor: screen === "playing" ? "none" : "default",
        }}
        onClick={() => { if (screen === "playing") doJump(); }}
      />

      {/* Touch Controls */}
      {screen === "playing" && (
        <div
          className="touch-controls"
          style={{ bottom: `${Math.max(8, (window.innerHeight - canvasSize.h * canvasSize.scale) / 2 + 8)}px` }}
        >
          <button className="touch-btn" onTouchStart={(e) => { e.preventDefault(); doSlide(); }} onMouseDown={doSlide} aria-label="Slide">
            ⬇
          </button>
          <button className="touch-btn" onTouchStart={(e) => { e.preventDefault(); doJump(); }} onMouseDown={doJump} aria-label="Jump">
            ⬆
          </button>
        </div>
      )}

      {/* Pause & Mute HUD buttons */}
      {screen === "playing" && (
        <div
          className="hud"
          style={{
            top: `${Math.max(8, (window.innerHeight - canvasSize.h * canvasSize.scale) / 2 + 8)}px`,
            left: `${Math.max(8, (window.innerWidth - canvasSize.w * canvasSize.scale) / 2 + 8)}px`,
            right: `${Math.max(8, (window.innerWidth - canvasSize.w * canvasSize.scale) / 2 + 8)}px`,
          }}
        >
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="hud-box" onClick={handleMute} title="Mute/Unmute">
              {mutedState ? "🔇" : "🔊"}
            </button>
            <button className="hud-box" onClick={pauseGame} title="Pause">
              ⏸
            </button>
          </div>
        </div>
      )}

      {/* ── MENU ────────────────────────────────────────────────────────── */}
      {screen === "menu" && (
        <div className="game-overlay anim-fade-in">
          <div className="game-panel pulse-glow">
            <div style={{ fontSize: "3.5rem", marginBottom: "0.5rem" }}>🏃</div>
            <h1 className="title-gradient" style={{ fontSize: "2.8rem", fontWeight: 900, letterSpacing: "-0.02em", marginBottom: "0.25rem" }}>
              BanglaRun
            </h1>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.95rem", marginBottom: "0.25rem" }}>
              🇧🇩 Run · Learn · Win
            </p>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.8rem", marginBottom: "1rem" }}>
              Jump over obstacles & answer questions to keep running!
            </p>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.8rem", display: "block", marginBottom: "0.35rem" }}>
                Your Name (for certificate)
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value);
                  localStorage.setItem("banglarun_name", e.target.value);
                }}
                maxLength={32}
                placeholder="Milon Runner"
                style={{
                  width: "100%", maxWidth: 280, padding: "0.6rem 1rem",
                  borderRadius: "0.75rem", border: "2px solid rgba(255,255,255,0.2)",
                  background: "rgba(0,0,0,0.3)", color: "#fff", fontSize: "0.95rem",
                  textAlign: "center", outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "1.5rem" }}>
              {(["math", "english", "science", "bangladesh"] as const).map((cat) => (
                <span key={cat} className={`powerup-icon ${catClass(cat)}`} style={{ pointerEvents: "none" }}>
                  {CATEGORY_LABELS[cat]}
                </span>
              ))}
            </div>

            <button className="btn-primary pulse-glow" onClick={startGame} style={{ fontSize: "1.2rem", padding: "1rem 3rem", marginBottom: "1rem" }}>
              🎮 Start Game
            </button>

            {uiHighScore > 0 && (
              <p style={{ color: "#f1c40f", fontSize: "0.9rem", marginTop: "0.75rem" }}>
                🏆 Best: {uiHighScore.toLocaleString()} pts
              </p>
            )}

            <div style={{ marginTop: "1.25rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.8rem", color: "rgba(255,255,255,0.55)" }}>
              <div>⬆ / Space — Jump</div>
              <div>⬇ — Slide</div>
              <div>❓ Hit obstacle → Quiz</div>
              <div>✅ Right answer → Bonus</div>
              <div>🎓 Run 30s → Milon MP handshake + Certificate</div>
            </div>

            <button
              onClick={handleMute}
              style={{ marginTop: "1rem", background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "1.2rem" }}
            >
              {mutedState ? "🔇 Unmute" : "🔊 Mute Sound"}
            </button>
          </div>
        </div>
      )}

      {/* ── PAUSED ──────────────────────────────────────────────────────── */}
      {screen === "paused" && (
        <div className="game-overlay anim-fade-in">
          <div className="game-panel">
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>⏸</div>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#fff", marginBottom: "0.5rem" }}>Paused</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "1.5rem" }}>
              Score: <strong style={{ color: "#f1c40f" }}>{uiScore.toLocaleString()}</strong>
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "center" }}>
              <button className="btn-primary" onClick={resumeGame}>▶ Resume</button>
              <button className="btn-secondary" onClick={() => { gs.current.screen = "menu"; setScreen("menu"); stopBgMusic(); playClick(); }}>
                🏠 Main Menu
              </button>
              <button onClick={handleMute} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>
                {mutedState ? "🔇 Unmute" : "🔊 Mute"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── GAME OVER ───────────────────────────────────────────────────── */}
      {screen === "gameover" && (
        <div className="game-overlay anim-fade-in">
          <div className="game-panel anim-bounce">
            <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>💔</div>
            <h2 style={{ fontSize: "2.2rem", fontWeight: 900, color: "#e74c3c", marginBottom: "0.5rem" }}>
              Game Over!
            </h2>
            <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
              You ran {Math.floor(gs.current.distance)}m
            </p>

            <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: "1rem", padding: "1rem 1.5rem", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "2.5rem", fontWeight: 900, color: "#f1c40f" }}>
                {Math.floor(gs.current.score).toLocaleString()}
              </div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem" }}>Final Score</div>
              {Math.floor(gs.current.score) >= uiHighScore && uiHighScore > 0 && (
                <div style={{ color: "#f1c40f", fontSize: "0.9rem", marginTop: "0.25rem" }}>🏆 New High Score!</div>
              )}
            </div>

            {uiHighScore > 0 && (
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", marginBottom: "1rem" }}>
                Best: {uiHighScore.toLocaleString()} pts
              </p>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "center" }}>
              <button className="btn-primary" onClick={startGame} style={{ fontSize: "1.1rem" }}>
                🔄 Play Again
              </button>
              <button className="btn-secondary" onClick={() => { gs.current.screen = "menu"; setScreen("menu"); playClick(); }}>
                🏠 Main Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CELEBRATION (30s Milon MP) ──────────────────────────────────── */}
      {screen === "celebration" && (
        <div className="game-overlay anim-fade-in celebration-overlay">
          <div className="confetti-container" aria-hidden="true">
            {Array.from({ length: 50 }).map((_, i) => (
              <span
                key={i}
                className="confetti-piece"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  background: ["#f1c40f", "#e74c3c", "#27ae60", "#3498db", "#9b59b6"][i % 5],
                }}
              />
            ))}
          </div>
          <div className="game-panel celebration-panel anim-bounce">
            <div className="celebration-character-wrap">
              <img
                src="/milon-mp.png"
                alt="Milon MP"
                className="celebration-character"
              />
              <span className="mp-badge">MP</span>
            </div>

            <h2 className="title-gradient" style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "0.25rem" }}>
              🎉 Milon MP Unlocked!
            </h2>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.95rem", marginBottom: "0.5rem" }}>
              You ran for {elapsedSec} seconds — amazing work, {playerName}!
            </p>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", marginBottom: "1.25rem" }}>
              Score: <strong style={{ color: "#f1c40f" }}>{uiScore.toLocaleString()}</strong>
              {" · "}
              Distance: <strong style={{ color: "#2ecc71" }}>{Math.floor(gs.current.distance)}m</strong>
            </p>

            <div className="certificate-preview">
              <div className="certificate-preview-inner">
                <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>🏆</div>
                <div style={{ fontWeight: 800, color: "#1b5e20", fontSize: "1rem" }}>Certificate of Excellence</div>
                <div style={{ color: "#2e7d32", fontSize: "0.75rem", marginBottom: "0.5rem" }}>Milon MP — Master Player</div>
                <div style={{ color: "#333", fontSize: "0.85rem" }}>{playerName}</div>
                <div style={{ color: "#666", fontSize: "0.7rem", marginTop: "0.35rem" }}>
                  {Math.floor(gs.current.distance)}m · {uiScore.toLocaleString()} pts
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "center", marginTop: "1.25rem" }}>
              <button className="btn-primary pulse-glow" onClick={handleDownloadCertificate} style={{ fontSize: "1rem" }}>
                📜 Download Certificate
              </button>
              <button className="btn-primary" onClick={continueAfterCelebration}>
                🏃 Keep Running
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  gs.current.screen = "menu";
                  setScreen("menu");
                  playClick();
                }}
              >
                🏠 Main Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── QUIZ ────────────────────────────────────────────────────────── */}
      {screen === "quiz" && currentQuestion && (
        <div className="game-overlay">
          <div className={`quiz-modal anim-slide-up ${quizShake ? "anim-shake" : ""}`}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span
                className={`powerup-icon ${catClass(currentQuestion.category)}`}
                style={{ fontSize: "0.9rem", pointerEvents: "none" }}
              >
                {CATEGORY_LABELS[currentQuestion.category]}
              </span>
              <div style={{ display: "flex", gap: "0.35rem" }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{ fontSize: "1.1rem" }}>{i < uiLives ? "❤️" : "🖤"}</span>
                ))}
              </div>
            </div>

            {/* Stop sign title */}
            <div style={{
              background: "linear-gradient(135deg, #e74c3c, #c0392b)",
              borderRadius: "0.875rem",
              padding: "0.6rem 1rem",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}>
              <span style={{ fontSize: "1.25rem" }}>🚧</span>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>
                Education Problem! Answer to continue!
              </span>
            </div>

            {/* Question */}
            <p style={{ color: "#fff", fontSize: "1.15rem", fontWeight: 700, marginBottom: "1.25rem", lineHeight: 1.4 }}>
              {currentQuestion.question}
            </p>

            {/* Hint */}
            {showHint && (
              <div style={{
                background: "rgba(241,196,15,0.15)",
                border: "1px solid rgba(241,196,15,0.4)",
                borderRadius: "0.625rem",
                padding: "0.5rem 0.875rem",
                marginBottom: "0.875rem",
                color: "#f1c40f",
                fontSize: "0.85rem",
              }}>
                💡 Hint: The answer starts with "{currentQuestion.options[currentQuestion.correctIndex][0]}"
              </div>
            )}

            {/* Answers */}
            <div style={{ marginBottom: "1rem" }}>
              {currentQuestion.options.map((opt, i) => {
                let cls = "btn-answer";
                if (answerResult !== null) {
                  if (i === currentQuestion.correctIndex) cls += " correct";
                  else if (i === selectedAnswer && answerResult === "wrong") cls += " wrong";
                }
                return (
                  <button
                    key={i}
                    className={cls}
                    onClick={() => handleAnswer(i)}
                    disabled={answerResult !== null}
                  >
                    <span style={{
                      width: "28px", height: "28px", borderRadius: "50%",
                      background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.25)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 800, fontSize: "0.85rem", flexShrink: 0
                    }}>
                      {["A", "B", "C", "D"][i]}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Result feedback */}
            {answerResult && (
              <div style={{
                textAlign: "center",
                padding: "0.75rem",
                borderRadius: "0.75rem",
                background: answerResult === "correct" ? "rgba(39,174,96,0.2)" : "rgba(231,76,60,0.2)",
                border: `1.5px solid ${answerResult === "correct" ? "#27ae60" : "#e74c3c"}`,
                color: answerResult === "correct" ? "#2ecc71" : "#e74c3c",
                fontWeight: 700,
                fontSize: "1rem",
                marginBottom: "0.5rem",
              }}>
                {answerResult === "correct" ? "✅ Correct! Running again!" : "❌ Wrong! Lost a life!"}
              </div>
            )}

            {/* Power-ups */}
            {answerResult === null && (
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
                <button
                  className={`powerup-icon ${hintUsed ? "used" : ""}`}
                  onClick={useHint}
                  title="Get a hint"
                >
                  💡 Hint {hintUsed ? "(used)" : ""}
                </button>
                <button
                  className={`powerup-icon ${skipUsed ? "used" : ""}`}
                  onClick={useSkip}
                  title="Skip this question"
                >
                  ⏭ Skip {skipUsed ? "(used)" : ""}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

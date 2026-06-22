import { useCallback, useRef, useState } from 'react';
import { useStore } from '../store';
import { BigButton } from '../ui/BigButton';
import './ParentGate.css';

const QUESTIONS = [
  { a: 7, b: 4 },
  { a: 9, b: 6 },
  { a: 8, b: 5 },
  { a: 12, b: 3 },
];

function randomQuestion() {
  return QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
}

export function ParentGate() {
  const setScreen = useStore((s) => s.setScreen);
  const parentGateTarget = useStore((s) => s.parentGateTarget);
  const setParentGateTarget = useStore((s) => s.setParentGateTarget);
  const [question] = useState(randomQuestion);
  const [answer, setAnswer] = useState('');
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdStartRef = useRef(0);

  const goBack = useCallback(() => {
    setParentGateTarget(null);
    if (parentGateTarget === 'pause') {
      setScreen('lesson');
    } else {
      setScreen('home');
    }
  }, [parentGateTarget, setParentGateTarget, setScreen]);

  const tryPass = useCallback(() => {
    const correct = question.a + question.b;
    if (parseInt(answer, 10) === correct && holdProgress >= 100) {
      setParentGateTarget(null);
      if (parentGateTarget === 'settings') {
        setScreen('settings');
      } else if (parentGateTarget === 'pause') {
        setScreen('home');
      }
    } else {
      goBack();
    }
  }, [answer, holdProgress, question, parentGateTarget, setParentGateTarget, setScreen, goBack]);

  const startHold = () => {
    holdStartRef.current = Date.now();
    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartRef.current;
      const pct = Math.min(100, (elapsed / 3000) * 100);
      setHoldProgress(pct);
      if (pct >= 100 && holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
      }
    }, 50);
  };

  const endHold = () => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (holdProgress >= 100) {
      tryPass();
    } else {
      setHoldProgress(0);
    }
  };

  return (
    <div className="parent-gate parent-only-screen">
      <h1>Parent Gate</h1>
      <p>Hold the button for 3 seconds and answer the question.</p>

      <p className="parent-gate__question">
        What is {question.a} + {question.b}?
      </p>
      <input
        type="number"
        className="parent-gate__input"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        inputMode="numeric"
      />

      <button
        type="button"
        className="parent-gate__hold-btn"
        onPointerDown={startHold}
        onPointerUp={endHold}
        onPointerLeave={endHold}
      >
        <span
          className="parent-gate__hold-fill"
          style={{ width: `${holdProgress}%` }}
        />
        Hold to confirm
      </button>

      <BigButton onPress={goBack} ariaLabel="Go back">
        ←
      </BigButton>
    </div>
  );
}

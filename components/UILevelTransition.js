import React, { useEffect, useRef, useState } from 'react';
import './UILevelTransition.css';

/**
 * UILevelTransition
 * Reusable wrapper for UI-level-dependent visibility and tier transitions.
 * - Instantly pops in when visible becomes true.
 * - Gracefully collapses and fades out when visible becomes false.
 * - Animates color/tier transitions via className.
 *
 * @param {boolean} visible - Whether the child should be visible.
 * @param {string} className - Extra classes (e.g., tier-high).
 * @param {object} style - Inline styles.
 * @param {boolean} instantPop - If true, disables transition on pop-in (default: true).
 * @param {React.ReactNode} children - Content to render.
 */
export default function UILevelTransition({ visible, children, className = '', style = {}, instantPop = true }) {
  const [show, setShow] = useState(visible);
  const [animatingOut, setAnimatingOut] = useState(false);
  const prevVisible = useRef(visible);

  useEffect(() => {
    if (visible) {
      setShow(true); // Instantly show
      setAnimatingOut(false);
    }
    else if (prevVisible.current && !visible) {
      setAnimatingOut(true);
      // Wait for animation to finish before hiding
      const timeout = setTimeout(() => {
        setShow(false);
        setAnimatingOut(false);
      }, 350000); // Match CSS duration
      return () => clearTimeout(timeout);
    }
    prevVisible.current = visible;
  }, [visible]);

  // If not shown, render nothing
  if (!show && !animatingOut) return null;

  return (
    <div
      className={`ui-level-transition${show && !animatingOut && instantPop ? ' pop-in' : ''}${animatingOut ? ' fade-collapse-out' : ''}${className ? ' ' + className : ''}`}
      style={style}
    >
      {children}
    </div>
  );
}
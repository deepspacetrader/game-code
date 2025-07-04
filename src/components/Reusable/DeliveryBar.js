import React, { useRef, useEffect } from 'react';

/**
 * DeliveryBar animates the progress of a delivery using CSS transitions for smooth rendering.
 * Props:
 *   - timeLeft: ms remaining
 *   - totalTime: ms total
 *   - onComplete: optional callback when delivery completes
 */
const DeliveryBar = ({ timeLeft, totalTime, onComplete }) => {
  const barRef = useRef();
  const prevTimeLeft = useRef(timeLeft);

  useEffect(() => {
    if (barRef.current) {
      // Set initial width instantly
      barRef.current.style.transition = 'none';
      barRef.current.style.width = `${(timeLeft / totalTime) * 100}%`;
      // Force reflow
      void barRef.current.offsetWidth;
      // Animate to 0% over remaining time
      barRef.current.style.transition = `width ${timeLeft}ms linear`;
      barRef.current.style.width = '0%';
    }
    prevTimeLeft.current = timeLeft;
    if (timeLeft <= 0 && onComplete) onComplete();
    // Only run on mount or when timeLeft/totalTime changes
    // eslint-disable-next-line
  }, [timeLeft, totalTime]);

  return (
    <div className="cell-delivery-bar-container">
      <div
        ref={barRef}
        className="cell-delivery-bar"
        style={{ width: `${(timeLeft / totalTime) * 100}%` }}
      />
    </div>
  );
};

export default DeliveryBar;

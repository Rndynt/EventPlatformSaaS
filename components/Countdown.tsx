'use client';

import React, { useState, useEffect } from 'react';

interface CountdownProps {
  targetDate: Date;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function Countdown({ targetDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div data-testid="countdown-container">
      <p className="text-sm font-medium text-gray-600 text-center mb-3">
        Event starts in
      </p>
      <div className="grid grid-cols-4 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-primary" data-testid="countdown-days">
            {timeLeft.days.toString().padStart(2, '0')}
          </div>
          <div className="text-xs text-gray-500">DAYS</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-primary" data-testid="countdown-hours">
            {timeLeft.hours.toString().padStart(2, '0')}
          </div>
          <div className="text-xs text-gray-500">HOURS</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-primary" data-testid="countdown-minutes">
            {timeLeft.minutes.toString().padStart(2, '0')}
          </div>
          <div className="text-xs text-gray-500">MINS</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-primary" data-testid="countdown-seconds">
            {timeLeft.seconds.toString().padStart(2, '0')}
          </div>
          <div className="text-xs text-gray-500">SECS</div>
        </div>
      </div>
    </div>
  );
}

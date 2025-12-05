// src/sockets/burners.ts
import { TimerEvents } from './events';

const userTimers = {}; // Keeps track of all timers, structured per burnerId.

function createTimer(burnerId, totalTime, ownershipInfo = null) {
  return {
    burnerId,
    remainingTime: totalTime,
    totalTime,
    burnerIsRunning: false,
    burnerIsPaused: false,
    intervalId: null,
    // ✅ NEW: Add ownership tracking
    ownershipInfo: ownershipInfo || {},
  };
}

export function getBurnerIdSession(burnerId) {
  return `BurnerId${burnerId}`;
}

export function commsToFront(server, burnerId, event, payload) {
  try {
    server.to(getBurnerIdSession(burnerId)).emit(event, payload, burnerId);
  } catch (error) {
    console.error(
      `Failed to emit event '${event}' for burnerId ${burnerId}:`,
      error,
    );
  }
}

// ✅ UPDATED: Start Timer Function with ownership
export function startTimerForBurner(
  server,
  burnerId,
  totalTime,
  mqttCallback = null,
  ownershipInfo = null,
) {
  if (userTimers[burnerId]) {
    const timer = userTimers[burnerId];
    if (timer.burnerIsRunning) {
      console.log(`Timer for burner ${burnerId} is already running.`);
      return;
    }
    clearInterval(timer.intervalId);
    timer.totalTime = totalTime;
    timer.remainingTime = totalTime;
    // ✅ NEW: Update ownership if provided
    if (ownershipInfo) {
      timer.ownershipInfo = ownershipInfo;
    }
  } else {
    userTimers[burnerId] = createTimer(burnerId, totalTime, ownershipInfo);
  }

  const timer = userTimers[burnerId];
  timer.burnerIsRunning = true;
  timer.burnerIsPaused = false;
  timer.mqttCallback = mqttCallback; // Store callback for later use

  console.log(`Timer started for ${burnerId} by:`, timer.ownershipInfo);

  timer.intervalId = setInterval(() => {
    // ✅ CRITICAL: Only decrement if NOT paused
    if (timer.burnerIsPaused) {
      return; // Skip this tick
    }

    if (timer.remainingTime > 0) {
      timer.remainingTime--;

      commsToFront(server, burnerId, TimerEvents.tick.toString(), {
        burnerId,
        remainingTime: timer.remainingTime,
        totalTime: timer.totalTime,
        burnerIsRunning: timer.burnerIsRunning,
        burnerIsPaused: timer.burnerIsPaused,
        // ✅ NEW: Include ownership info
        ownershipInfo: timer.ownershipInfo,
      });
    } else {
      console.log(`Burner ${burnerId} has timed out - sending stop command`);
      stopTimerForBurner(server, burnerId, true); // Pass true to indicate timeout
    }
  }, 1000);
}

// ✅ UPDATED: Stop Timer Function
export function stopTimerForBurner(server, burnerId, isTimeout = false) {
  const timer = userTimers[burnerId];
  if (!timer) {
    console.log(`No active timer for burner ${burnerId} to stop.`);
    return;
  }

  clearInterval(timer.intervalId);

  // ✅ Call MQTT callback if it exists
  if (timer.mqttCallback && typeof timer.mqttCallback === 'function') {
    console.log(`Calling MQTT stop callback for ${burnerId}`);
    timer.mqttCallback(burnerId, 'stop');
  }

  // Notify the frontend
  const message = isTimeout ? 'Timer completed' : 'Timer stopped';
  commsToFront(server, burnerId, TimerEvents.timerStop.toString(), {
    burnerId,
    message: message,
    isTimeout: isTimeout,
    // ✅ NEW: Include ownership info
    ownershipInfo: timer.ownershipInfo,
  });

  console.log(
    `${message} for ${burnerId} (Owner: ${timer.ownershipInfo?.userName || 'Unknown'})`,
  );
  delete userTimers[burnerId];
}

// ✅ UPDATED: Pause Timer Function
export function pauseTimerForBurner(server, burnerId) {
  const timer = userTimers[burnerId];
  if (!timer || !timer.burnerIsRunning) {
    console.log(`Cannot pause. Timer for burner ${burnerId} is not running.`);
    return;
  }

  timer.burnerIsRunning = false;
  timer.burnerIsPaused = true;

  console.log(
    `Timer paused for ${burnerId} by owner: ${timer.ownershipInfo?.userName || 'Unknown'}. Remaining: ${timer.remainingTime}s`,
  );

  commsToFront(server, burnerId, TimerEvents.timerPause.toString(), {
    burnerId,
    remainingTime: timer.remainingTime,
    message: 'Burner paused',
    // ✅ NEW: Include ownership info
    ownershipInfo: timer.ownershipInfo,
  });
}

// ✅ UPDATED: Resume Timer Function
export function resumeTimerForBurner(server, burnerId) {
  const timer = userTimers[burnerId];
  if (!timer || !timer.burnerIsPaused) {
    console.log(`Cannot resume. Timer for burner ${burnerId} is not paused.`);
    return;
  }

  timer.burnerIsRunning = true;
  timer.burnerIsPaused = false;

  console.log(
    `Timer resumed for ${burnerId} by owner: ${timer.ownershipInfo?.userName || 'Unknown'}. Remaining: ${timer.remainingTime}s`,
  );

  // Send immediate tick to update frontend
  commsToFront(server, burnerId, TimerEvents.tick.toString(), {
    burnerId,
    remainingTime: timer.remainingTime,
    totalTime: timer.totalTime,
    burnerIsRunning: timer.burnerIsRunning,
    burnerIsPaused: timer.burnerIsPaused,
    // ✅ NEW: Include ownership info
    ownershipInfo: timer.ownershipInfo,
  });
}

// ✅ UPDATED: Get Timer State with ownership
export function getTimerState(burnerId) {
  const timer = userTimers[burnerId];
  if (!timer) {
    return {
      burnerId,
      remainingTime: 0,
      totalTime: 0,
      burnerIsRunning: false,
      burnerIsPaused: false,
      ownershipInfo: {},
    };
  }

  return {
    burnerId: timer.burnerId,
    remainingTime: timer.remainingTime,
    totalTime: timer.totalTime,
    burnerIsRunning: timer.burnerIsRunning,
    burnerIsPaused: timer.burnerIsPaused,
    // ✅ NEW: Include ownership info
    ownershipInfo: timer.ownershipInfo || {},
  };
}

// ✅ NEW: Check if user owns the timer
export function isTimerOwnedByUser(burnerId, userIdentifier, sessionId = null) {
  const timer = userTimers[burnerId];
  if (!timer || !timer.ownershipInfo) return false;

  const ownership = timer.ownershipInfo;

  // Check by user identifier (phone, email, etc.)
  if (userIdentifier && ownership.userId === userIdentifier) {
    return true;
  }

  // Check by session ID as fallback
  if (sessionId && ownership.sessionId === sessionId) {
    return true;
  }

  return false;
}

// Extract Last Digit from String
export function getLastDigitFromString(input) {
  const digits = input.match(/\d+/g);
  if (digits && digits.length > 0) {
    const lastDigit = digits[digits.length - 1];
    return parseInt(lastDigit.charAt(lastDigit.length - 1), 10);
  }
  return null;
}

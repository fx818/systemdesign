#!/usr/bin/env bash
# Usage: run-oc.sh <agent-id> <model> <prompt> [session-id-to-resume]
# Runs an opencode agent; if its log is idle for IDLE seconds, kills and resumes the same session.
cd "$(dirname "$0")/.."
ID=$1; MODEL=$2; PROMPT=$3; SES=$4; IDLE=${IDLE:-300}; MAX_RESTARTS=${MAX_RESTARTS:-6}
LOG=logs/$ID.log
for attempt in $(seq 0 $MAX_RESTARTS); do
  if [ -n "$SES" ]; then
    opencode run -m "$MODEL" -s "$SES" "Continue your task (agent $ID, tasks/$ID.md) from where you left off. Check the current state of files first." >> "$LOG" 2>&1 &
  else
    opencode run -m "$MODEL" --title "$ID" "$PROMPT" >> "$LOG" 2>&1 &
  fi
  PID=$!
  while kill -0 $PID 2>/dev/null; do
    sleep 30
    age=$(( $(date +%s) - $(stat -c %Y "$LOG") ))
    if [ $age -gt $IDLE ]; then echo "[watchdog] idle ${age}s, restarting" >> "$LOG"; kill $PID; sleep 3; break; fi
  done
  if ! kill -0 $PID 2>/dev/null && ! grep -q "idle .*restarting" <(tail -1 "$LOG"); then
    wait $PID; echo "[watchdog] $ID finished (attempt $attempt)" >> "$LOG"; exit 0
  fi
  [ -z "$SES" ] && SES=$(opencode session list 2>/dev/null | awk -v t="$ID" '$2==t{print $1; exit}')
done
echo "[watchdog] $ID gave up after $MAX_RESTARTS restarts" >> "$LOG"

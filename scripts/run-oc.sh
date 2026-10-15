#!/usr/bin/env bash
# Usage: run-oc.sh <agent-id> <model> <prompt>
# Runs an opencode agent. If its log is idle for IDLE seconds, kills it and starts a FRESH session
# told to continue from the files on disk (resuming hung sessions proved unreliable).
cd "$(dirname "$0")/.."
ID=$1; MODEL=$2; PROMPT=$3; IDLE=${IDLE:-420}; MAX_RESTARTS=${MAX_RESTARTS:-8}
LOG=logs/$ID.log
for attempt in $(seq 0 $MAX_RESTARTS); do
  P="$PROMPT"
  [ $attempt -gt 0 ] && P="$PROMPT

NOTE: this is restart #$attempt. A previous run of you already did part of this task. Inspect the files you own on disk first, keep what is good, and continue from there."
  echo "[watchdog] start attempt $attempt model=$MODEL $(date +%T)" >> "$LOG"
  opencode run -m "$MODEL" --title "$ID-$attempt" "$P" >> "$LOG" 2>&1 &
  PID=$!; restarted=0
  while kill -0 $PID 2>/dev/null; do
    sleep 30
    age=$(( $(date +%s) - $(stat -c %Y "$LOG") ))
    if [ $age -gt $IDLE ]; then echo "[watchdog] idle ${age}s, restarting" >> "$LOG"; kill $PID; sleep 3; restarted=1; break; fi
  done
  if [ $restarted = 0 ]; then wait $PID; echo "[watchdog] $ID finished (attempt $attempt) $(date +%T)" >> "$LOG"; exit 0; fi
done
echo "[watchdog] $ID gave up after $MAX_RESTARTS restarts" >> "$LOG"

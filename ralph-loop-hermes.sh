#!/usr/bin/env bash

# ⚡ RALPH LOOP RUNNER (HERMES) ⚡
# Runs Hermes in an autonomous loop to resolve issues iteratively without permission interrupts.
#
# Loop semantics: each iteration is ONE attempt at the current task.
# - Task success → log it, move to the next task (loop continues)
# - Task failure → next iteration retries the same task
# - Loop only stops on: max iterations exhausted, hard CLI error, ABORT, rate limit,
#   or explicit "NO TASKS" / "NO MORE TASKS" signal (nothing left to do).

set -o pipefail

# ANSI Color Codes for Ralph Loop logs
BOLD='\033[1m'
CYAN='\033[36m'
GREEN='\033[32m'
YELLOW='\033[33m'
RED='\033[31m'
NC='\033[0m' # No Color

# --- CONFIGURABLE PARAMETERS ---
# Delay (seconds) between loop iterations to avoid API rate limiting.
# Adjust based on your API plan. Formula: 60s / desired_RPM = delay.
# Examples: 90s ≈ 0.7 RPM | 75s ≈ 0.8 RPM | 2s ≈ 30 RPM | 1.25s ≈ 48 RPM | 1s ≈ 60 RPM
ITERATION_DELAY=2.5

echo -e "${BOLD}${CYAN}===========================================${NC}"
echo -e "${BOLD}${CYAN}    ⚡ RALPH LOOP RUNNER (HERMES) ⚡   ${NC}"
echo -e "${BOLD}${CYAN}===========================================${NC}"

# Step 0: Iteration argument check
if [ -z "$1" ]; then
  echo -e "${RED}❌ Error: Usage: $0 <max_iterations>${NC}"
  exit 1
fi
MAX_ITERATIONS=$1

# Check for active nested Hermes/Antigravity CLI session (deadlock risk)
if [ -n "$ANTIGRAVITY_AGENT" ] || [ -n "$ANTIGRAVITY_LS_ADDRESS" ]; then
  echo -e "${RED}❌ Error: You are trying to run ralph-loop-hermes.sh inside an active Hermes agent shell session.${NC}"
  echo -e "${YELLOW}Please exit the agent shell first (type 'exit') and run this script from your main host terminal.${NC}"
  exit 1
fi

# Step 1: Upfront check for prompt.md
if [ ! -f "prompt.md" ] || [ ! -s "prompt.md" ]; then
  echo -e "${YELLOW}❓ prompt.md is missing or empty.${NC}"
  echo -n -e "Enter the instructions for the agent loop: "
  read -r user_prompt

  if [ -z "$user_prompt" ]; then
    echo -e "${RED}❌ Error: A prompt is required to start the loop.${NC}"
    exit 1
  fi

  # Create a default structure for prompt.md
  cat <<EOF > prompt.md
---
issueId:
---
$user_prompt
EOF
  echo -e "${GREEN}📝 prompt.md created with your instructions!${NC}"
fi

# Step 2: Upfront check for prod.md, PROD.md, prd.md, PRD.md
PROD_FILE=""
for file in prod.md PROD.md prd.md PRD.md; do
  if [ -f "$file" ]; then
    PROD_FILE="$file"
    break
  fi
done

if [ -z "$PROD_FILE" ]; then
  echo -e "${YELLOW}📝 prod.md/PRD.md is missing. Creating default prod.md...${NC}"
  PROD_FILE="prod.md"
  cat <<EOF > prod.md
# Production Specifications

## Constraints
- Always verify edits with test runs or code audits.
- Maintain existing architecture styles and patterns.
EOF
fi

# Step 3: Verify the new epic/task structure exists
if [ ! -f ".specify/memory/index.md" ]; then
  echo -e "${RED}✖ Missing .specify/memory/index.md — the epic/task structure is not initialized. Run this migration before starting the loop.${NC}"
  exit 1
fi

# Step 4: Ensure progress.txt exists (do not reset, preserve history)
touch progress.txt

# Track the starting line count of progress.txt so each iteration can read only new lines
start_line_count=$(wc -l < progress.txt 2>/dev/null || echo 0)

get_latest_model_label() {
  local latest_log model_line
  latest_log="$HOME/.hermes/logs/agent.log"

  if [ ! -f "$latest_log" ]; then
    echo "unknown"
    return
  fi

  # Hermes logs model per API call: "model=MiniMax-M2.7 provider=minimax-oauth"
  model_line=$(grep -oE 'model=[^ ]+' "$latest_log" 2>/dev/null | tail -n 1)

  if [ -z "$model_line" ]; then
    echo "unknown"
    return
  fi

  echo "$model_line" | sed -E 's/model=//'
}

get_latest_ralph_commit() {
  git log -1 --format="%H|%s" 2>/dev/null
}

is_conventional_commit() {
  local subject=$1
  [[ "$subject" =~ ^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)\([a-z0-9-]+\):[[:space:]].+ ]]
}

print_failure_model() {
  local model_label
  model_label=$(get_latest_model_label)
  echo -e "${YELLOW}Model in use: ${model_label}${NC}"
}

# Step 5: Execution Loop
# Each iteration = one attempt at the current task.
# Loop continues until: max iterations reached, hard error, or explicit "no more tasks".
for ((i=1; i<=MAX_ITERATIONS; i++)); do
  echo -e "\n${BOLD}${CYAN}🔄 Attempt [$i/$MAX_ITERATIONS]${NC}"

  start_time=$(date +%s)
  start_commit=$(git rev-parse HEAD 2>/dev/null || echo "")

  echo -e "ℹ️ The agent loop runs. Watch the command output above or monitor progress.txt in a new terminal:"
  echo -e "   ${CYAN}tail -f progress.txt${NC}\n"

  # Gather recent commits for context
  recent_commits=$(git log -n 10 --format="%H%n%ad%n%B---" --date=short 2>/dev/null || echo "No recent commits found")

  tmpfile=$(mktemp)
  trap "rm -f $tmpfile" EXIT

  if [ $i -eq 1 ]; then
    echo -e "${YELLOW}🚀 Triggering initial run...${NC}"
  else
    echo -e "${YELLOW}⏭️ Starting fresh iteration (clean context) for attempt $i...${NC}"
  fi
  # CRITICAL: every iteration is a fresh Hermes session (no --continue).
  # The previous --continue flag leaked context across iterations and forced
  # mid-run compactions. State lives in .specify/memory/, progress.txt, and
  # git — not in the conversation. The next iteration re-reads RULES.md and
  # .specify/memory/index.md from scratch.
  hermes -s ralph-loop-orchestrator --yolo chat -q "Start the Ralph Loop iteration $i. Read RULES.md FIRST (canonical engineering rules), then .specify/memory/index.md (single source of truth for epics and tasks), then the current epic and task files. Pick the next task, complete ONLY that task, then log your status to progress.txt. Recent commits: $recent_commits" | tee "$tmpfile"

  cmd_status=$?
  end_time=$(date +%s)
  duration=$((end_time - start_time))

  if [ $cmd_status -ne 0 ]; then
    echo -e "\n${RED}❌ Error: hermes CLI exited with status $cmd_status after ${duration}s.${NC}"
    print_failure_model
    rm -f "$tmpfile"
    exit $cmd_status
  fi

  echo -e "${GREEN}⏱️ Attempt $i completed in ${duration}s.${NC}"

  if [ -n "$ITERATION_DELAY" ] && awk "BEGIN{exit !(($ITERATION_DELAY) > 0)}"; then
    actual_rpm=$(awk "BEGIN {printf \"%.1f\", 60/$ITERATION_DELAY}")
    echo -e "${CYAN}💤 Waiting ${ITERATION_DELAY}s before next iteration (~${actual_rpm} req/min target)...${NC}"
    sleep "$ITERATION_DELAY"
  fi

  # Read the progress lines appended during this attempt
  new_progress_lines=""
  current_progress=""
  if [ -f "progress.txt" ]; then
    new_progress_lines=$(tail -n +$((start_line_count + 1)) progress.txt 2>/dev/null)
    current_progress=$(echo "$new_progress_lines" | tail -n 1)
  fi

  # Advance the line-count baseline so the next attempt only sees new lines
  start_line_count=$(wc -l < progress.txt 2>/dev/null || echo "$start_line_count")

  if [ -n "$current_progress" ]; then
    echo -e "${BOLD}Current Status:${NC} ${current_progress}"
  fi

  # --- Termination detection ---

  # 1. Hard abort: explicit ABORT, resource exhaustion, or rate limit → exit immediately
  has_abort=false
  if grep -q -i -E "RESOURCE_EXHAUSTED|quota reached|rate limit|429" "$tmpfile"; then
    has_abort=true
  fi

  if [ "$has_abort" = true ]; then
    echo -e "\n${BOLD}${RED}⚠️ ABORT: Ralph aborted after $i attempts.${NC}"
    print_failure_model
    rm -f "$tmpfile"
    exit 1
  fi

  # 2. Loop complete: agent reports nothing left to do → exit successfully
  if [ -n "$new_progress_lines" ] && echo "$new_progress_lines" | grep -q -i -E "NO MORE TASKS|NO TASKS|Loop Terminated"; then
    end_commit=$(git rev-parse HEAD 2>/dev/null || echo "")
    if [ -n "$end_commit" ] && [ "$start_commit" != "$end_commit" ]; then
      latest_commit=$(get_latest_ralph_commit)
      latest_commit_hash=${latest_commit%%|*}
      latest_commit_message=${latest_commit#*|}
      if is_conventional_commit "$latest_commit_message"; then
        echo -e "${GREEN}✅ Final Conventional Commit: ${latest_commit_hash} ${latest_commit_message}${NC}"
      else
        echo -e "${YELLOW}⚠️ Final commit is not Conventional: ${latest_commit_hash} ${latest_commit_message}${NC}"
      fi
    fi
    echo -e "\n${BOLD}${GREEN}🎉 LOOP COMPLETE: no more tasks after $i attempts.${NC}"
    rm -f "$tmpfile"
    exit 0
  fi

  # 3. Task success (e.g. 100% Complete): log it and continue to next attempt (next task)
  if [ -n "$new_progress_lines" ] && echo "$new_progress_lines" | grep -q -i -E "100% Complete"; then
    end_commit=$(git rev-parse HEAD 2>/dev/null || echo "")
    if [ -n "$end_commit" ] && [ "$start_commit" != "$end_commit" ]; then
      latest_commit=$(get_latest_ralph_commit)
      latest_commit_hash=${latest_commit%%|*}
      latest_commit_message=${latest_commit#*|}
      if is_conventional_commit "$latest_commit_message"; then
        echo -e "${GREEN}✅ Task complete (Conventional Commit): ${latest_commit_hash} ${latest_commit_message}${NC}"
      else
        echo -e "${YELLOW}⚠️ Task marked complete but commit is not Conventional: ${latest_commit_hash} ${latest_commit_message}${NC}"
      fi
    else
      echo -e "${YELLOW}⚠️ Task marked 100% Complete but no new git commit detected.${NC}"
    fi
    echo -e "${CYAN}➡️  Moving to next task on the next attempt...${NC}"
    rm -f "$tmpfile"
    continue
  fi

  # 4. No explicit signal: treat as in-progress / failure → retry on next attempt
  echo -e "${YELLOW}🔁 No completion signal detected. Will retry on next attempt.${NC}"
  rm -f "$tmpfile"
done

echo -e "\n${BOLD}${YELLOW}⚠️ Warning: Reached maximum iterations ($MAX_ITERATIONS) without detecting 'no more tasks'.${NC}"
echo -e "${YELLOW}   The loop stopped because the attempt limit was exhausted.${NC}"
exit 0

#!/usr/bin/env bash

# ⚡ RALPH LOOP RUNNER (HERMES) ⚡
# Runs Hermes in an autonomous loop to resolve issues iteratively without permission interrupts.

set -o pipefail

# ANSI Color Codes for Ralph Loop logs
BOLD='\033[1m'
CYAN='\033[36m'
GREEN='\033[32m'
YELLOW='\033[33m'
RED='\033[31m'
NC='\033[0m' # No Color

echo -e "${BOLD}${CYAN}===========================================${NC}"
echo -e "${BOLD}${CYAN}    ⚡ RALPH LOOP RUNNER (HERMES) ⚡   ${NC}"
echo -e "${BOLD}${CYAN}===========================================${NC}"

# Step 0: Iteration argument check
if [ -z "$1" ]; then
  echo -e "${RED}❌ Error: Usage: $0 <iterations>${NC}"
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

# Step 3: Upfront verification of issue folder
if [ ! -d ".specify/memory/issues" ]; then
  echo -e "${YELLOW}📁 Creating directory .specify/memory/issues/ ...${NC}"
  mkdir -p .specify/memory/issues
fi

# Step 4: Ensure progress.txt exists (do not reset, preserve history)
touch progress.txt

# Track the starting line count of progress.txt so each iteration can read only new lines
start_line_count=$(wc -l < progress.txt 2>/dev/null || echo 0)

get_latest_model_label() {
  local latest_log model_line
  latest_log=$(find "$HOME/.gemini/antigravity-cli/log" -maxdepth 1 -type f -name "cli-$(date +%Y%m%d)_*.log" -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -n 1 | cut -d' ' -f2-)

  if [ -z "$latest_log" ] || [ ! -f "$latest_log" ]; then
    echo "unknown"
    return
  fi

  model_line=$(grep -oE 'Propagating selected model override to backend: label="[^"]+"' "$latest_log" | tail -n 1)
  if [ -z "$model_line" ]; then
    model_line=$(grep -oE 'Print mode: starting \(promptLength=[0-9]+, model="[^"]*"' "$latest_log" | tail -n 1)
  fi

  if [ -z "$model_line" ]; then
    echo "unknown"
    return
  fi

  echo "$model_line" | sed -E 's/.*label="([^"]+)".*/\1/; s/.*model="([^"]*)".*/\1/'
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
for ((i=1; i<=MAX_ITERATIONS; i++)); do
  echo -e "\n${BOLD}${CYAN}🔄 Iteration [$i/$MAX_ITERATIONS]${NC}"
  
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
    # Start the loop by loading the ralph-loop-orchestrator skill and passing the prompt
    hermes -s ralph-loop-orchestrator --yolo chat -q "Start the Ralph Loop. Locate prompt.md, $PROD_FILE, and issues under .specify/memory/issues/. Follow the ralph-loop-orchestrator skill and execute the first iteration, then log your status to progress.txt. Recent commits: $recent_commits" | tee "$tmpfile"
  else
    echo -e "${YELLOW}⏭️ Continuing session...${NC}"
    # Continue the active conversation to keep prompt history and state intact
    hermes -s ralph-loop-orchestrator --yolo chat --continue -q "Continue the Ralph Loop. Execute the next iteration (Iteration $i), apply changes, and log status to progress.txt. Recent commits: $recent_commits" | tee "$tmpfile"
  fi
  
  cmd_status=$?
  end_time=$(date +%s)
  duration=$((end_time - start_time))
  
  if [ $cmd_status -ne 0 ]; then
    echo -e "\n${RED}❌ Error: hermes CLI exited with status $cmd_status after ${duration}s.${NC}"
    print_failure_model
    rm -f "$tmpfile"
    exit $cmd_status
  fi
  
  echo -e "${GREEN}⏱️ Iteration $i completed in ${duration}s.${NC}"
  
  # Check current-iteration output and new progress.txt lines for termination markers
  has_success=false
  has_abort=false
  current_progress=""
  new_progress_lines=""

  # 1. Check CLI output ($tmpfile) for abort only.
  # Success is only trusted when the iteration writes a fresh progress line.
  if grep -q -i -E "<promise>ABORT</promise>|ABORT" "$tmpfile"; then
    has_abort=true
  elif grep -q -i -E "RESOURCE_EXHAUSTED|quota reached|rate limit|429" "$tmpfile"; then
    has_abort=true
  fi

  # 2. Check newly appended lines in progress.txt for success/failure markers.
  if [ "$has_success" = false ] && [ "$has_abort" = false ] && [ -f "progress.txt" ]; then
    new_progress_lines=$(tail -n +$((start_line_count + 1)) progress.txt 2>/dev/null)
    current_progress=$(echo "$new_progress_lines" | tail -n 1)
    if [ -n "$new_progress_lines" ] && echo "$new_progress_lines" | grep -q -i -E "100% Complete|Loop Terminated|NO MORE TASKS|NO TASKS"; then
      has_success=true
    elif echo "$new_progress_lines" | grep -q -i -E "ABORT"; then
      has_abort=true
    elif echo "$new_progress_lines" | grep -q -i -E "RESOURCE_EXHAUSTED|quota reached|rate limit|429"; then
      has_abort=true
    fi
  fi

  if [ -n "$current_progress" ]; then
    echo -e "${BOLD}Current Status:${NC} ${current_progress}"
  fi

  start_line_count=$(wc -l < progress.txt 2>/dev/null || echo "$start_line_count")

  if [ "$has_success" = true ]; then
    end_commit=$(git rev-parse HEAD 2>/dev/null || echo "")
    latest_commit=$(get_latest_ralph_commit)

    if [ -z "$end_commit" ] || [ "$start_commit" = "$end_commit" ]; then
      echo -e "\n${RED}❌ Error: task completed without a new git commit.${NC}"
      echo -e "${YELLOW}Expected a fresh Conventional Commit after the task.${NC}"
      print_failure_model
      rm -f "$tmpfile"
      exit 1
    fi

    latest_commit_hash=${latest_commit%%|*}
    latest_commit_message=${latest_commit#*|}
    if ! is_conventional_commit "$latest_commit_message"; then
      echo -e "\n${RED}❌ Error: latest git commit is not a Conventional Commit.${NC}"
      echo -e "${YELLOW}Latest commit: ${latest_commit_hash} ${latest_commit_message}${NC}"
      print_failure_model
      rm -f "$tmpfile"
      exit 1
    fi

    echo -e "${GREEN}✅ Latest Conventional Commit: ${latest_commit_hash} ${latest_commit_message}${NC}"
    echo -e "\n${BOLD}${GREEN}🎉 SUCCESS: Ralph complete after $i iterations.${NC}"
    rm -f "$tmpfile"
    exit 0
  fi

  if [ "$has_abort" = true ]; then
    echo -e "\n${BOLD}${RED}⚠️ ABORT: Ralph aborted after $i iterations.${NC}"
    print_failure_model
    rm -f "$tmpfile"
    exit 1
  fi

  rm -f "$tmpfile"
done

echo -e "\n${BOLD}${YELLOW}⚠️ Warning: Reached maximum iterations ($MAX_ITERATIONS) without detecting completion.${NC}"
exit 0

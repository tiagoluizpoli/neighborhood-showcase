#!/usr/bin/env bash

# ⚡ RALPH LOOP RUNNER (AGY) ⚡
# Runs the agy CLI in an autonomous loop to resolve issues iteratively without permission interrupts.
# Managed as an agent-specific asset by the Ralph Loop installer.
# Validated for shared vs agent-specific asset routing (iteration 10).
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

echo -e "${BOLD}${CYAN}===========================================${NC}"
echo -e "${BOLD}${CYAN}     ⚡ RALPH LOOP RUNNER (AGY) ⚡      ${NC}"
echo -e "${BOLD}${CYAN}===========================================${NC}"

# Step 0: Iteration argument check
if [ -z "$1" ]; then
  echo -e "${RED}❌ Error: Usage: $0 <iterations>${NC}"
  exit 1
fi
MAX_ITERATIONS=$1

# Check for active nested Antigravity CLI session (deadlock risk)
if [ -n "$ANTIGRAVITY_AGENT" ] || [ -n "$ANTIGRAVITY_LS_ADDRESS" ]; then
  echo -e "${RED}❌ Error: You are trying to run ralph-loop-agy.sh inside an active Antigravity agent shell session.${NC}"
  echo -e "${YELLOW}Please exit the agent shell first (type 'exit') and run this script from your main host terminal.${NC}"
  exit 1
fi

# Step 1: Upfront check for .plan/prompt.md
mkdir -p .plan

if [ ! -f ".plan/prompt.md" ] || [ ! -s ".plan/prompt.md" ]; then
  echo -e "${YELLOW}❓ .plan/prompt.md is missing or empty.${NC}"
  echo -n -e "Enter the instructions for the agent loop: "
  read -r user_prompt
  
  if [ -z "$user_prompt" ]; then
    echo -e "${RED}❌ Error: A prompt is required to start the loop.${NC}"
    exit 1
  fi
  
  # Create a default structure for .plan/prompt.md
  cat <<EOF > .plan/prompt.md
---
issueId:
---
$user_prompt
EOF
  echo -e "${GREEN}📝 .plan/prompt.md created with your instructions!${NC}"
fi

# Step 2: Upfront check for .plan/PRD.md
if [ ! -f ".plan/PRD.md" ]; then
  echo -e "${YELLOW}📝 .plan/PRD.md is missing. Creating default .plan/PRD.md...${NC}"
  cat <<EOF > .plan/PRD.md
# PRD Index

## Constraints
- Always verify edits with test runs or code audits.
- Maintain existing architecture styles and patterns.
EOF
fi

# Step 3: Verify the new epic/task structure exists
if [ ! -f ".plan/index.md" ]; then
  echo -e "${RED}✖ Missing .plan/index.md — the epic/task structure is not initialized. Run this migration before starting the loop.${NC}"
  exit 1
fi

# Step 4: Ensure .plan/progress.txt exists (do not reset, preserve history)
touch .plan/progress.txt

# Track the starting line count of .plan/progress.txt so each iteration can read only new lines
start_line_count=$(wc -l < .plan/progress.txt 2>/dev/null || echo 0)

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

resolve_model_override() {
  local current_model="$1"
  local tier="$2"

  if [ -z "$current_model" ] || [ "$current_model" = "unknown" ]; then
    echo ""
    return
  fi

  if [ "$tier" = "medium" ]; then
    echo "$current_model"
    return
  fi

  # Swapping logic for Gemini models with (Low)/(Medium)/(High)
  if [[ "$current_model" =~ (.*)\((Low|Medium|High)\) ]]; then
    local prefix="${BASH_REMATCH[1]}"
    if [ "$tier" = "high" ]; then
      echo "${prefix}(High)"
    elif [ "$tier" = "low" ]; then
      echo "${prefix}(Low)"
    else
      echo "$current_model"
    fi
    return
  fi

  # Swapping logic for models like gpt-5.4 / gpt-5.4-mini
  if [[ "$current_model" =~ gpt-5\.4 ]]; then
    if [ "$tier" = "high" ]; then
      echo "gpt-5.4"
    elif [ "$tier" = "low" ]; then
      echo "gpt-5.4-mini"
    else
      echo "$current_model"
    fi
    return
  fi

  echo "$current_model"
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

prepare_runtime_attempt() {
  local runner_name="$1"
  local runner_model="$2"
  eval "$(bash .plan/helper-scripts/runtime-state.sh prepare-attempt --runner \"$runner_name\" --runner-model \"$runner_model\" --format shell)"
}

record_runtime_result() {
  local result="$1"
  local reason="$2"
  local commit_changed="$3"
  local runner_model="$4"
  eval "$(bash .plan/helper-scripts/runtime-state.sh record-result --result \"$result\" --reason \"$reason\" --commit-changed \"$commit_changed\" --runner-model \"$runner_model\" --format shell)"
}

# Step 5: Execution Loop
# Each iteration = one attempt at the current task.
# Loop continues until: max iterations reached, hard error, or explicit "no more tasks".
for ((i=1; i<=MAX_ITERATIONS; i++)); do
  echo -e "\n${BOLD}${CYAN}🔄 Attempt [$i/$MAX_ITERATIONS]${NC}"
  
  start_time=$(date +%s)
  start_commit=$(git rev-parse HEAD 2>/dev/null || echo "")
  
  echo -e "ℹ️ The agent loop runs. Watch the command output above or monitor .plan/progress.txt in a new terminal:"
  echo -e "   ${CYAN}tail -f .plan/progress.txt${NC}\n"

  # Gather recent commits for context
  recent_commits=$(git log -n 10 --format="%H%n%ad%n%B---" --date=short 2>/dev/null || echo "No recent commits found")
  current_model_label=$(get_latest_model_label)
  prepare_runtime_attempt "agy" "$current_model_label"

  if [ "${RUNNER_STATE_RESULT:-}" = "no-tasks" ]; then
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] NO MORE TASKS" >> .plan/progress.txt
    echo -e "\n${BOLD}${GREEN}🎉 LOOP COMPLETE: runtime state found no executable subtasks.${NC}"
    exit 0
  fi

  model_args=()
  if [ -n "${CURRENT_REQUIRED_MODEL:-}" ]; then
    resolved_model=$(resolve_model_override "$current_model_label" "$CURRENT_REQUIRED_MODEL")
    if [ -n "$resolved_model" ] && [ "$resolved_model" != "unknown" ]; then
      model_args=("--model" "$resolved_model")
      if [ "$resolved_model" != "$current_model_label" ]; then
        echo -e "${YELLOW}⬆️ Escalating model from '$current_model_label' to '$resolved_model' (tier: $CURRENT_REQUIRED_MODEL)${NC}"
      fi
    fi
  fi

  runtime_contract=$(cat <<EOF
Runtime contract for this attempt:
- Selected task: ${CURRENT_TASK_ID} / ${CURRENT_SUBTASK_ID}
- Task file: ${CURRENT_TASK_PATH}
- Required model tier from task metadata: ${CURRENT_REQUIRED_MODEL}
- Attempt count for this sub-task: ${CURRENT_ATTEMPT_COUNT}
- Retrieval round: ${CURRENT_RETRIEVAL_ROUND}/3
- Escalation active: ${CURRENT_ESCALATED:-false}
- Escalation triggers: ${CURRENT_ESCALATE_IF:-none}
- Files to touch: ${CURRENT_FILES_TO_TOUCH:-none}
EOF
)

  escalation_directive=""
  if [ "${CURRENT_ESCALATED:-false}" = "true" ]; then
    escalation_directive=$(cat <<EOF
Escalation state is ACTIVE for this attempt.
- Treat this as a high-scrutiny retry of the same sub-task.
- Use the strongest reasoning depth and most careful verification available in this runner.
- Prefer deeper diagnosis, tighter validation, and safer changes over speed.
- Do not repeat the previous medium-grade approach.
EOF
)
  fi

  retrieval_bundle=""
  if [ "${CURRENT_SHOULD_RETRIEVE:-false}" = "true" ]; then
    retrieval_bundle=$(bash .plan/helper-scripts/retrieve-history.sh --task-id "$CURRENT_TASK_ID" --epic-id "$CURRENT_EPIC_ID" --prd-id "${CURRENT_PRD_ID:-}" --query "${CURRENT_TASK_TITLE} ${CURRENT_SUBTASK_TITLE}" --limit 5)
  fi

  tmpfile=$(mktemp)
  trap "rm -f $tmpfile" EXIT

  if [ $i -eq 1 ]; then
    echo -e "${YELLOW}🚀 Triggering initial run...${NC}"
  else
    echo -e "${YELLOW}⏭️ Starting fresh iteration (clean context) for attempt $i...${NC}"
  fi

  # CRITICAL: every iteration is a fresh session (no --continue).
  # State lives in .plan/, agents.local.md, and git — not in the conversation.
  agy --dangerously-skip-permissions --print-timeout 15m "${model_args[@]}" --print "Start the Ralph Loop iteration $i. Read .plan/RULES.md FIRST (canonical engineering rules), then agents.local.md if it exists, then .plan/PRD.md, then .plan/index.md (single source of truth for epics and tasks), then the current epic and task files. Pick the next task, complete ONLY that task, then log your status to .plan/progress.txt. Recent commits: $recent_commits

$runtime_contract

If this attempt cannot complete, respect the runtime contract: preserve the selected sub-task, note whether the failure needs escalation, and log BLOCKED only with a concrete blocker reason.

${escalation_directive:+$escalation_directive
}

${retrieval_bundle:+Historical retrieval bundle for this attempt:
$retrieval_bundle
}" | tee "$tmpfile"
  
  cmd_status=$?
  end_time=$(date +%s)
  duration=$((end_time - start_time))
  end_commit=$(git rev-parse HEAD 2>/dev/null || echo "")
  commit_changed=false
  if [ -n "$end_commit" ] && [ "$start_commit" != "$end_commit" ]; then
    commit_changed=true
  fi
  
  if [ $cmd_status -ne 0 ]; then
    echo -e "\n${RED}❌ Error: agy CLI exited with status $cmd_status after ${duration}s.${NC}"
    print_failure_model
    rm -f "$tmpfile"
    exit $cmd_status
  fi
  
  echo -e "${GREEN}⏱️ Attempt $i completed in ${duration}s.${NC}"
  
  # Read the progress lines appended during this attempt
  new_progress_lines=""
  current_progress=""
  if [ -f ".plan/progress.txt" ]; then
    new_progress_lines=$(tail -n +$((start_line_count + 1)) .plan/progress.txt 2>/dev/null)
    current_progress=$(echo "$new_progress_lines" | tail -n 1)
  fi

  start_line_count=$(wc -l < .plan/progress.txt 2>/dev/null || echo "$start_line_count")

  if [ -n "$current_progress" ]; then
    echo -e "${BOLD}Current Status:${NC} ${current_progress}"
  fi

  # --- Termination detection ---
  has_abort=false
  if grep -q -i -E "RESOURCE_EXHAUSTED|quota reached" "$tmpfile"; then
    has_abort=true
  fi

  if [ "$has_abort" = true ]; then
    echo -e "\n${BOLD}${RED}⚠️ ABORT: Ralph aborted after $i attempts.${NC}"
    print_failure_model
    rm -f "$tmpfile"
    exit 1
  fi

  if [ -n "$new_progress_lines" ] && echo "$new_progress_lines" | grep -q -i -E "NO MORE TASKS|NO TASKS|Loop Terminated"; then
    record_runtime_result "no-tasks" "" "$commit_changed" "$(get_latest_model_label)"
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

  if [ -n "$new_progress_lines" ] && echo "$new_progress_lines" | grep -q -E "BLOCKED|CLARIFICATION_NEEDED|HISTORY_INSUFFICIENT"; then
    block_reason=$(echo "$new_progress_lines" | grep -E "BLOCKED|CLARIFICATION_NEEDED|HISTORY_INSUFFICIENT" | tail -n 1 | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '-')
    record_runtime_result "blocked" "${block_reason:-blocked-by-agent}" "$commit_changed" "$(get_latest_model_label)"
    echo -e "${YELLOW}⛔ Task moved to blocked state: ${RECORDED_REASON}${NC}"
    rm -f "$tmpfile"
    continue
  fi

  if [ -n "$new_progress_lines" ] && echo "$new_progress_lines" | grep -q -i -E "100% Complete"; then
    record_runtime_result "success" "" "$commit_changed" "$(get_latest_model_label)"
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

  record_runtime_result "retry" "no-completion-signal" "$commit_changed" "$(get_latest_model_label)"
  if [ "${RECORDED_RESULT:-retry}" = "blocked" ]; then
    echo -e "${YELLOW}⛔ Retrieval rounds exhausted without a code change. Task marked blocked: ${RECORDED_REASON}${NC}"
    rm -f "$tmpfile"
    continue
  fi
  if [ "${RECORDED_ESCALATED:-false}" = "true" ]; then
    echo -e "${YELLOW}⬆️ Escalation persisted for ${CURRENT_TASK_ID}/${CURRENT_SUBTASK_ID} after repeated failures.${NC}"
  fi
  echo -e "${YELLOW}🔁 No completion signal detected. Will retry on next attempt.${NC}"
  rm -f "$tmpfile"
done

echo -e "\n${BOLD}${YELLOW}⚠️ Warning: Reached maximum iterations ($MAX_ITERATIONS) without detecting 'no more tasks'.${NC}"
echo -e "${YELLOW}   The loop stopped because the attempt limit was exhausted.${NC}"
exit 0

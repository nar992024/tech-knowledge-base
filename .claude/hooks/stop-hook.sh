#!/bin/bash
# Claude Code Stop 훅 - 작업 완료 알림
#
# 이 스크립트는 Claude Code가 Stop 이벤트를 발생시킬 때 실행됩니다.
# Claude가 응답을 완료했을 때 Slack 알림을 보냅니다.

# .env 파일에서 Slack 웹훅 URL 로드
if [ -f "$CLAUDE_PROJECT_DIR/.env" ]; then
    source "$CLAUDE_PROJECT_DIR/.env"
else
    echo "오류: .env 파일을 찾을 수 없습니다: $CLAUDE_PROJECT_DIR/.env" >&2
    exit 1
fi

# Slack 웹훅 URL 확인
if [ -z "$SLACK_WEBHOOK_URL" ]; then
    echo "오류: SLACK_WEBHOOK_URL이 설정되지 않았습니다." >&2
    exit 1
fi

# 프로젝트명 추출
PROJECT_NAME=$(basename "$CLAUDE_PROJECT_DIR")

# 현재 시간
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# JSON 입력에서 정보 추출 (표준 입력은 한 번만 읽을 수 있어 먼저 저장한다)
INPUT=$(cat)
REASON=$(printf '%s' "$INPUT" | jq -r '.hook_event_name')

# 마지막 응답을 가져온다. 입력에 없으면 대화 기록 파일에서 찾는다
LAST_MESSAGE=$(printf '%s' "$INPUT" | jq -r '.last_assistant_message // empty')
TRANSCRIPT=$(printf '%s' "$INPUT" | jq -r '.transcript_path // empty')
if [ -z "$LAST_MESSAGE" ] && [ -f "$TRANSCRIPT" ]; then
    LAST_MESSAGE=$(jq -rs '[.[] | select(.type == "assistant") | .message.content[]? | select(.type == "text") | .text] | last // empty' "$TRANSCRIPT")
fi

# 외부 채널로 나가는 값이므로 비밀값 형식을 가리고, 멘션이 동작하지 않게 특수문자를 바꾼 뒤 50자로 줄인다
SUMMARY=$(printf '%s' "$LAST_MESSAGE" | jq -Rrs '
  gsub("(ntn_|secret_|ghp_|gho_|sk-)[A-Za-z0-9_-]{10,}"; "[masked]")
  | gsub("https://hooks\\.slack\\.com/[^\\s]+"; "[masked]")
  | gsub("[*`#|]"; "")
  | gsub("\\s+"; " ")
  | gsub("&"; "&amp;") | gsub("<"; "&lt;") | gsub(">"; "&gt;")
  | ltrimstr(" ") | rtrimstr(" ")
  | if length > 50 then .[:47] + "..." else . end
')
[ -n "$SUMMARY" ] || SUMMARY="(내용 없음)"

# 디버깅을 위한 변수 출력 (stderr로 출력)
echo "DEBUG: REASON = '$REASON'" >&2
echo "DEBUG: PROJECT_NAME = '$PROJECT_NAME'" >&2
echo "DEBUG: TIMESTAMP = '$TIMESTAMP'" >&2

# JSON payload 생성 (응답에 따옴표가 있어도 깨지지 않게 jq로 만든다)
TEXT=$(printf '✅ 작업 완료 알림\n\n프로젝트: %s\n이벤트: %s\n내용: %s\n시간: %s\n\nClaude Code 작업이 완료되었습니다.' "$PROJECT_NAME" "$REASON" "$SUMMARY" "$TIMESTAMP")
PAYLOAD=$(printf '%s' "$TEXT" | jq -Rs '{channel: "#claude-notifications", username: "Claude Code", text: ., icon_emoji: ":white_check_mark:"}')

echo "DEBUG: PAYLOAD = '$PAYLOAD'" >&2

# Slack으로 알림 전송 (Windows에서 명령 인자로 넘기면 한글이 깨지므로 표준 입력으로 보낸다)
printf '%s' "$PAYLOAD" | curl -fsS -m 10 -X POST \
  --data-urlencode "payload@-" \
  "$SLACK_WEBHOOK_URL" > /dev/null 2>&1

# 성공 여부 확인
if [ $? -eq 0 ]; then
    echo "Slack 알림이 성공적으로 전송되었습니다." >&2
else
    echo "Slack 알림 전송에 실패했습니다." >&2
    exit 1
fi
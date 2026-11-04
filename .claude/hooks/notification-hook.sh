#!/bin/bash
# Claude Code Notification 훅 - 권한 요청 및 사용자 입력 대기 알림
#
# 이 스크립트는 Claude Code가 Notification 이벤트를 발생시킬 때 실행됩니다.
# 주로 권한 요청이나 사용자 입력 대기 상황에서 Slack 알림을 보냅니다.

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

# JSON 입력에서 이벤트명과 메시지 추출 (표준 입력은 한 번만 읽을 수 있어 먼저 저장한다)
INPUT=$(cat)
EVENT=$(printf '%s' "$INPUT" | jq -r '.hook_event_name')
# 멘션이 동작하지 않게 Slack 특수문자를 바꾼다
MESSAGE=$(printf '%s' "$INPUT" | jq -r '.message // "(내용 없음)" | gsub("&"; "&amp;") | gsub("<"; "&lt;") | gsub(">"; "&gt;")')

# 프로젝트명 추출
PROJECT_NAME=$(basename "$CLAUDE_PROJECT_DIR")

# 현재 시간
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# 디버깅을 위한 변수 출력 (stderr로 출력)
echo "DEBUG: MESSAGE = '$MESSAGE'" >&2
echo "DEBUG: PROJECT_NAME = '$PROJECT_NAME'" >&2
echo "DEBUG: TIMESTAMP = '$TIMESTAMP'" >&2

# JSON payload 생성 (메시지에 따옴표가 있어도 깨지지 않게 jq로 만든다)
TEXT=$(printf '🔔 권한 요청 알림\n\n프로젝트: %s\n이벤트: %s\n내용: %s\n시간: %s\n\nClaude Code에서 알림이 도착했습니다.' "$PROJECT_NAME" "$EVENT" "$MESSAGE" "$TIMESTAMP")
PAYLOAD=$(printf '%s' "$TEXT" | jq -Rs '{channel: "#claude-notifications", username: "Claude Code", text: ., icon_emoji: ":bell:"}')

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
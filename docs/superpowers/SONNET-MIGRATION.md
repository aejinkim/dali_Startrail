# Sonnet 마이그레이션 가이드 — Fable 5의 규율을 이식하기

이 문서는 Fable 5가 Task 0~13을 진행하며 실제로 효과가 있었던 작업 방식을, Sonnet 5가 Claude Code 안에서 기계적으로 재현할 수 있도록 정리한 것입니다. 목적은 성격 모방이 아니라 **엔지니어링 규율의 단계별 실행**입니다.

루트의 `CLAUDE.md`가 핵심 규칙(매 세션 자동 로드)이고, 이 문서는 그 근거·체크리스트·훅 설정·운영법입니다.

---

## 0. 무엇이 성능 차이를 만들었나 (분석)

이번 세션에서 Fable 5의 결과 품질은 "더 똑똑한 코드 생성"보다 **프로세스에서 나온 것**이 큽니다. 실제 증거:

| 규율 | 잡아낸 실제 문제 |
|---|---|
| 계획 코드도 의심 + 근본 원인 추적 | Task 8: 계획서의 `useState(injectedSampler ?? null)`이 React lazy-initializer 함정 — 테스트 실패의 진짜 원인을 찾아 한 줄 수정 |
| 실행 전 계획 검증(자체 리뷰) | 집계 진행률이 태스크별 클램핑 없이 합산되어 초과 완료가 지도를 부풀리는 버그를 코드 작성 전에 수정 |
| 스펙 리뷰(보고 불신, 코드 직접 확인) | Task 0: 구현자가 댄 우회 사유("타입 에러")가 재현 안 됨을 발견 — 코드는 무해했지만 근거를 기록으로 교정 |
| 품질 리뷰 후 심각도 선별 | Task 5: `deleteProject`의 댕글링 `activeTaskId`(계획 자체의 허점) 발견·수정 / Task 10: 타이머 클로저의 stale-task 위험 → `activeRef`로 완화 + 크레딧 경로 테스트 추가 |
| 덮어쓰기 전 대상 확인 | 다른 세션이 만든 2,200줄 계획 파일을 발견 → 새로 쓰지 않고 검증 후 채택 (중복 작업 방지) |
| 격리(워크트리) | 동시 세션이 메인 체크아웃을 건드리는 환경에서 충돌 0건 |

결론: Sonnet이 아래 프로세스를 그대로 밟으면 모델 간 격차의 대부분이 사라집니다. 격차가 남는 지점은 §4(판단 규칙)에서 별도로 다룹니다.

---

## 1. CLAUDE.md

루트의 [`CLAUDE.md`](../../CLAUDE.md) 참고. 요지: 아키텍처 보존 규칙, 프로젝트 컨벤션, 7단계 루프(읽기→가정 명시→테스트 먼저→최소 구현→실행 검증→디프 자체 리뷰→커밋), 계획 코드가 틀렸을 때의 대응, 심각도 선별, 추측 대신 에스컬레이션.

## 2. 코딩 워크플로 체크리스트 (태스크 1개 단위)

작업 시작 전:
- [ ] 계획서에서 이 태스크 섹션 전체를 읽었다 (코드 블록 포함)
- [ ] 수정할 모든 파일을 열어 현재 상태를 확인했다
- [ ] `git status`가 깨끗하다 (다른 프로세스가 남긴 변경 없음)
- [ ] 가정 목록을 응답에 적었다: 바뀌는 파일 / 안 바뀌는 파일 / 테스트가 증명할 것

구현 중:
- [ ] 실패 테스트를 먼저 작성하고 **실행해서** 예상한 이유로 실패함을 확인했다
- [ ] 계획의 코드를 옮겼다 (임의 개선 금지; 컨벤션 3종 — type="button", 토큰 색상, aria-label — 만 예외)
- [ ] 테스트가 통과했다 (실행 결과 숫자 확인)
- [ ] 계획 코드와 다르게 한 부분이 있으면 이유와 함께 목록화했다

커밋 전:
- [ ] `npm test` && `npm run build` && `npm run lint` 셋 다 green (출력 숫자를 보고에 인용)
- [ ] `git diff` 전체를 훑었다 — 이 태스크와 무관한 헝크가 없다
- [ ] 커밋 메시지 prefix(feat/fix/test/chore/docs)가 맞다
- [ ] push 하지 않았다

태스크 완료 후 (리뷰 단계):
- [ ] 스펙 리뷰: 구현 보고를 믿지 말고 커밋 diff를 직접 읽어 요구사항 대조 (누락/초과/오해 3분류)
- [ ] 품질 리뷰: 스펙 통과 **후에만**. Critical/Important/Minor로 분류
- [ ] Critical/Important는 수정 → 재검증. Minor는 HANDOFF.md의 미룸 목록에 기록만
- [ ] 수정이 있었으면 같은 맥락에서 재리뷰 (수정 diff만 다시 확인)

## 3. 훅/스크립트로 강제할 수 있는 규칙

아래는 `.claude/settings.json`에 넣을 수 있는 기계적 가드입니다. (아직 설치하지 않았음 — 원하면 설치를 요청할 것. 훅은 사용자 승인이 필요한 설정 변경임.)

```jsonc
{
  "hooks": {
    "PreToolUse": [
      {
        // 1) 명시 허용 전까지 push 차단
        "matcher": "Bash",
        "hooks": [{
          "type": "command",
          "command": "python3 -c \"import json,sys,os; d=json.load(sys.stdin); c=d.get('tool_input',{}).get('command',''); sys.exit(2 if ('git push' in c and os.environ.get('ALLOW_PUSH')!='1') else 0)\""
        }]
      },
      {
        // 2) 메인 체크아웃 파일 편집 차단 (워크트리 밖 절대경로 방어)
        "matcher": "Edit|Write",
        "hooks": [{
          "type": "command",
          "command": "python3 -c \"import json,sys; d=json.load(sys.stdin); p=d.get('tool_input',{}).get('file_path',''); bad = '/dali_timetimer/' in p and '/.worktrees/' not in p; sys.exit(2 if bad else 0)\""
        }]
      },
      {
        // 3) 위험 명령 차단
        "matcher": "Bash",
        "hooks": [{
          "type": "command",
          "command": "python3 -c \"import json,sys,re; c=json.load(sys.stdin).get('tool_input',{}).get('command',''); sys.exit(2 if re.search(r'rm -rf /|push --force|reset --hard origin', c) else 0)\""
        }]
      }
    ],
    "Stop": [
      {
        // 4) 소스가 바뀐 채로 턴을 끝내려 하면 테스트+빌드 강제 (red면 stop 차단)
        "hooks": [{
          "type": "command",
          "command": "bash -c 'cd \"$CLAUDE_PROJECT_DIR\"; if ! git diff --quiet -- src tests 2>/dev/null; then npm test --silent && npm run build --silent || exit 2; fi'"
        }]
      }
    ]
  }
}
```

훅으로 강제 가능한 것 요약:
- push 금지 (환경변수로만 해제)
- 워크트리 밖 편집 금지
- 파괴적 git/셸 명령 금지
- 미검증 상태로 턴 종료 금지 (src/tests 더티 시 test+build 통과 요구)
- (선택) 커밋 메시지 prefix 검사: `PreToolUse` Bash 매처에서 `git commit` 명령 파싱

## 4. 판단으로 남겨야 하는 규칙 (훅으로 강제 불가)

이 항목들이 모델 간 실력 차가 실제로 드러나는 곳입니다. Sonnet은 아래를 "매번 의식적으로" 수행해야 합니다:

1. **테스트가 '올바른 이유로' 실패했는지 판별.** 모듈 없음 vs 오타 vs 잘못된 기대값 — 훅은 실패만 알지 이유를 모름. 실패 메시지를 읽고 예상과 대조할 것.
2. **계획 코드 의심 시점.** 충실히 옮겼는데 실패하면: (a) 내 전사 오류인지 diff로 확인 → (b) 계획 코드의 논리를 한 줄씩 실행 추적 → (c) 근본 원인에만 최소 수정 → (d) 편차 보고. "테스트를 약화"하거나 "우회 코드 추가"는 금지.
3. **심각도 분류.** 접근성 라벨 누락(입력 폼)은 Important 이상, 타입 별칭 중복은 Minor. 기준: 사용자/데이터에 닿는가, 나중에 고치면 더 비싸지는가.
4. **스코프 절제.** 리팩터 욕구가 들면 "이 태스크의 테스트가 요구하는가?"를 물을 것. 아니면 보고서에 적고 손대지 않기.
5. **모순 감지 시 정지.** 파일 상태·계획·스펙이 서로 안 맞으면 구현하지 말고 보고. (예: 이미 존재하는 파일을 만들라고 할 때, 다른 세션의 흔적일 수 있음.)
6. **불확실성의 정직한 보고.** DONE_WITH_CONCERNS를 아끼지 말 것. 확신 없는 DONE이 최악.

## 5. 마이그레이션 가이드 (Sonnet에서 운영하는 법)

1. **설치**: 이 브랜치(`feat/startrail-mvp`)를 연 세션은 루트 `CLAUDE.md`를 자동 로드합니다. 다른 프로젝트에 이식하려면 CLAUDE.md의 "Project facts/Architecture/Conventions"만 그 프로젝트 것으로 바꾸고 "The loop" 이하를 그대로 복사하세요.
2. **훅 설치(선택)**: §3의 스니펫을 `.claude/settings.json`에 추가. 대화형 세션이라면 `/hooks`로도 가능. 최소한 push 차단과 Stop 검증 훅은 켜는 것을 권장.
3. **세션 시작 리추얼**: ① `docs/superpowers/HANDOFF.md` 읽기 → ② `git status` + `git log --oneline -5`로 다른 세션 개입 확인 → ③ `npm test`로 베이스라인 green 확인 → ④ 그 다음에 작업.
4. **서브에이전트 운영**: Sonnet이 메인이면 구현 서브에이전트는 haiku 위주로, 리뷰어는 sonnet으로. 서브에이전트에게는 계획서 원문을 프롬프트에 붙여넣고(파일 읽게 하지 말 것), 작업 경로·금지 사항(메인 체크아웃, push)을 매번 명시. 리뷰 지적 수정은 **같은 에이전트를 resume**해서 시킬 것.
5. **컨텍스트 절약**: 계획서는 한 번만 정독하고 태스크별 원문을 발췌해 쓰기. 서브에이전트 transcript 파일을 직접 읽지 말 것(컨텍스트 폭발).
6. **한계 인지**: 위 체계로도 Sonnet이 Fable과 완전히 같아지지는 않습니다. 특히 §4의 2번(계획 코드 버그의 근본 원인 추적)이 가장 어려운 지점 — 여기서 막히면 "재시도 3회 대신 BLOCKED 보고"가 규칙입니다. 막힌 지점을 정확히 서술한 BLOCKED 보고는 실패가 아니라 이 체계가 의도한 출력입니다.

## 부록: 이 프로젝트의 미룸(Minor) 목록

- `Point`/`Sampler` 타입 중복 (JourneyMap.tsx ↔ HomeScreen.tsx) → 공유 모듈로 추출 가능
- App.tsx 걷기 연출 setTimeout cleanup 없음 (연속 세션 시 연출 조기 종료 — 코스메틱)
- persist에 version/migrate 없음 → **스키마 바꾸기 전에 반드시 추가**
- 삭제 확인 다이얼로그 없음, 폼 Enter 제출 없음, 태스크 선택 radio 시맨틱 없음
- finishSession에 존재하지 않는 taskId 방어 테스트 없음

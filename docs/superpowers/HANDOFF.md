# Startrail MVP — 세션 인수인계 가이드

이 문서는 Fable 5로 진행하던 Startrail MVP 구현을 다른 세션(Sonnet 5 등)에서 이어받을 때 참고하는 가이드입니다.

## 지금 상태 (2026-07-07 기준)

- 워크트리: `~/Projects/dali_timetimer/.worktrees/startrail-mvp` (브랜치 `feat/startrail-mvp`)
- **메인 체크아웃(`~/Projects/dali_timetimer` 루트)은 건드리지 않았음** — 원본 앱은 그대로 있고, 새 코드는 전부 이 워크트리 안에 있음
- Task 0~13까지 구현 + 2단계 리뷰(스펙/품질) 전부 완료, 43개 테스트 전체 통과 (`npm test`), 빌드/린트 그린
- Task 13 리뷰 결과: 승인. Minor 2건은 의도적으로 미룸 — (a) `Point`/`Sampler` 타입이 JourneyMap.tsx와 HomeScreen.tsx에 중복 정의됨(공유 모듈로 추출 가능), (b) App.tsx의 2200ms setTimeout에 cleanup 없음(연속 세션 시 걷기 연출이 일찍 끊길 수 있는 코스메틱 이슈만 존재)
- 아직 안 한 것: **Task 14(수동 검증 + README + 첫 push)만 남음**
- 스펙 문서: `docs/superpowers/specs/2026-07-06-north-star-trail-redesign-design.md`
- 구현 계획: `docs/superpowers/plans/2026-07-06-startrail-mvp.md` (Task 0~14, 각 태스크에 TDD 스텝과 정확한 코드가 다 적혀 있음)

## 바로 할 일 (우선순위 순)

1. Task 14 진행이 첫 순서 (아래 항목 2번부터 보면 됨)
2. Task 14 진행: `docs/superpowers/plans/2026-07-06-startrail-mvp.md`의 "Task 14" 섹션 그대로 — `npm run dev`로 수동 검증(온보딩→프로젝트/태스크 추가→집중 세션→완료 후 지도 갱신→새로고침 시 영속) → README 교체 → 커밋 → **이때 처음으로 `git push`**
3. 전체 다 끝나면 `superpowers:finishing-a-development-branch` 스킬로 머지/PR 여부 결정

## 이번 작업에서 확립된 컨벤션 (다음 세션이 반드시 지켜야 할 것)

이건 계획 문서에는 없지만 리뷰 과정에서 반복적으로 나온 규칙들이라, 앞으로 코드를 더 건드릴 때도 따라야 함:

- 모든 `<button>`에는 `type="button"` 명시
- 색상은 항상 `var(--token)` 사용, 하드코딩 hex 금지 (`src/styles/tokens.css` 참고)
- 파괴적 동작(삭제) 버튼에는 `aria-label` 필수
- 플레이스홀더만 있는 input에도 `aria-label` 필요 (스크린리더 대응)
- 도메인 로직(진행률, 세션 전이, 여정 수학)은 항상 `src/domain/`에 순수 함수로 — React 컴포넌트에 로직 새지 않게
- 커밋은 절대 push 금지, 사용자가 명시적으로 요청하기 전까지 로컬에만 (Task 14 마지막 스텝 전까지)

## 리뷰 파이프라인 (subagent-driven-development 방식)

지금까지 각 태스크를 이 순서로 처리했음 — 다음 세션도 남은 태스크(14)에 이 방식을 쓰면 일관성 유지됨:

1. 구현 서브에이전트 투입 (계획서의 정확한 코드 붙여넣기, TDD 순서 지시)
2. 스펙 준수 리뷰어 투입 (구현자 보고 신뢰하지 말고 코드 직접 읽고 검증)
3. 코드 품질 리뷰어 투입 (스펙 통과 후에만)
4. 리뷰에서 지적된 게 있으면 **같은 구현자 에이전트에게 SendMessage로 재작업 지시** (새 에이전트 만들지 말고 resume)
5. 통과하면 다음 태스크로

## Fable 5 → Sonnet 5로 넘어갈 때 다르게 신경 써야 할 점

Fable 5(현재 세션)는 최상위 모델이라 위 파이프라인을 거의 감독 없이 자율적으로 밀어붙였음. Sonnet 5로 이어받으면 몇 가지 조정이 필요함:

1. **서브에이전트 모델 선택을 더 보수적으로.** 지금까지 기계적인 태스크(도메인 로직, 단순 CRUD)는 haiku, 복잡한 것(JourneyMap, 타이머 로직)은 sonnet을 썼음. Sonnet 5가 메인 세션이면, 서브에이전트로 sonnet을 쓰는 것 자체가 "같은 급의 모델에게 위임"이 되어 이점이 줄어듦 — 서브에이전트는 haiku 위주로 쓰고, 정말 복잡한 판단이 필요한 태스크(향후 있다면)만 sonnet으로 격상 검토.

2. **리뷰를 스킵하고 싶은 유혹을 경계할 것.** Fable 5는 스펙 리뷰와 품질 리뷰를 절대 생략하지 않았고, 이 과정에서 실제 버그를 여러 번 잡았음(예: Task 8의 `useState` lazy-initializer 버그, Task 5의 `deleteProject` 댕글링 참조, Task 10의 stale closure 위험). Sonnet도 같은 2단계 리뷰를 반드시 거쳐야 함 — "이 정도면 됐다"는 판단으로 건너뛰지 말 것.

3. **리뷰에서 나온 지적을 전부 고칠 필요는 없음 — 심각도 판단이 핵심.** "Ready to merge? Yes/No/With fixes" 중 "With fixes"가 나오면, Critical/Important는 반드시 고치되 Minor는 상황 따라 후속 과제로 미뤄도 됨(이번 세션에서도 "확인 다이얼로그", "Enter 제출" 같은 건 의도적으로 미룸). 모든 Minor까지 고치려다 진도가 안 나가지 않도록 주의.

4. **한 서브에이전트가 계획서의 코드를 "그대로" 넣었는지 항상 의심할 것.** 계획서 코드 자체에 버그가 있었던 사례가 있었음(Task 8). 구현 서브에이전트에게 "테스트가 이유 없이 실패하면 계획 코드를 의심하고 근본 원인을 고치되, 왜 그런지 보고하라"는 지시를 명시적으로 넣는 게 중요함 — 이미 이번 계획 문서와 프롬프트 템플릿에 그 정신이 녹아있으니 그대로 따라가면 됨.

5. **동시 세션 충돌에 주의.** 이번 세션 도중 사용자가 다른 터미널 탭에서 같은 리포를 동시에 건드려서 스펙 문서가 예기치 않게 바뀐 적이 있었음(§2 결정 테이블에 기술 스택이 두 번 채워짐). 워크트리 안에서 작업하고 있으니 메인 체크아웃과의 충돌 위험은 낮지만, 같은 워크트리를 여러 세션이 동시에 건드리면 여전히 위험함 — 시작할 때 `git status`로 다른 프로세스가 손댄 흔적이 없는지 확인할 것.

6. **AskUserQuestion을 아끼지 말 것.** 브레인스토밍 단계에서 8~9개의 선택형 질문으로 컨셉을 좁혀갔음(비주얼 스타일, 게임 깊이, 진행률 기준, 앱 구조, 기술 스택 등). Sonnet도 새로운 갈림길(예: Records 화면 설계, 배포 방식)이 나오면 텍스트로 길게 설명하지 말고 선택지를 주는 게 사용자와 더 잘 맞음.

## 참고 파일 위치

- 스펙: `docs/superpowers/specs/2026-07-06-north-star-trail-redesign-design.md`
- 계획: `docs/superpowers/plans/2026-07-06-startrail-mvp.md`
- 이 문서: `docs/superpowers/HANDOFF.md`

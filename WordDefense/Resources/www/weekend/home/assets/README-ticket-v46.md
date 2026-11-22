# 주말 보상 UI v46

사용자 지정 티켓 UI를 실제 게임 화면에 합성합니다. 제목판과 댄스 시작판은 이미지 원본의 가로세로 비율을 유지합니다. 새 viewport 배치 로직은 home/weekend-layout-v46.js입니다. UI가 화면 전체에 맞게 축소되며 디스크나 버튼만 따로 납작해지던 동작은 제거했습니다.

받기·수령 완료·잠금은 사용자가 지정한 버튼 이미지로 생성한 개별 투명 스프라이트입니다. 기존 게임의 닳은 버튼판을 사용하지 않습니다. status-sheet-v46.png는 생성 원본, status-*-v46.png 및 WebP는 각 상태의 개별 에셋이며 WebP는 무손실입니다. 추출 좌표는 status-manifest-v46.json에 있습니다.

생성 모드: built-in image_gen. 입력 참고: codex-clipboard-69964703-a494-4640-b104-622a591275a4.png.

프롬프트: Extract EXACTLY the THREE reward status buttons from the reference as separate floating sprites on genuinely transparent background. Preserve typography, palette and black outlines. Three equal buttons in one horizontal row: LEFT mint turquoise, black check mark, white Korean '수령 완료'; CENTER vivid lime, white Korean '받기'; RIGHT slate blue, white padlock, white Korean '잠금'. Smooth rounded glossy bevels, no mechanical/camouflage/chipped texture, no card frame, no background. Preserve all edges and shadows with transparent gaps.

보상 오라와 4.8초 주기의 은은한 빛 스윕은 코드 효과입니다. CSS prefers-reduced-motion 설정에서는 빛 스윕을 멈춥니다. 보상 수량·카드 제목·주말 보상 제목·댄스 시작은 실제 게임 폰트와 상태값으로 표시합니다.

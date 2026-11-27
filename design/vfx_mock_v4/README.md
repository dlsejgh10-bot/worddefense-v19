# 컨펌 액티브 스킬 VFX 목업 (v4)

이 폴더는 게임 빌드(`WordDefense/Resources/www/`)에 포함되지 않습니다.
원본: `/workspace/q1116/passive_mock/v4/` 의 최종본(`_prev` 없는 mp4, `sc4a.js`/`sc4b.js`/`sc4c.js`)과 사용자 제공 시트(바이트 동일).

전투 CAST 이식 시 이 파일의 로직·색·타이밍·크기를 최대한 그대로 옮기고, 새로 디자인하지 마세요. 판정·수치·상점은 바꾸지 마세요.

## 소스

| 파일 | 역할 |
| --- | --- |
| `sc4a.js` | 쇼타임, 심판, 발도, 레이저 바주카 |
| `sc4b.js` | 진심 펀치, 탄도미사일, 메테오 |
| `sc4c.js` | 에너지 구, 축복 |
| `fx4.js` | 공통 프리미티브 (bloom, bolt, starShot 등) |
| `slamvfx.js` | 진심 펀치용 SlamVFX (variant 2) |

## 스킬별 최종 영상 (`video/`)

| 스킬 | 영웅 | 영상 | 소스 |
| --- | --- | --- | --- |
| 쇼타임 | 레인저 | `01_ranger_skill.mp4` | `sc4a.js` |
| 심판 | 사수 | `02_archer_skill.mp4` | `sc4a.js` |
| 레이저 바주카 | 저격수 | `03_sniper_ult.mp4` | `sc4a.js` |
| 레이저 바주카 (물리) | 저격수 | `03_sniper_ult_phys.mp4` | `sc4a.js` |
| 레이저 바주카 (불) | 저격수 | `03_sniper_ult_fire.mp4` | `sc4a.js` |
| 레이저 바주카 (물) | 저격수 | `03_sniper_ult_water.mp4` | `sc4a.js` |
| 레이저 바주카 (얼음) | 저격수 | `03_sniper_ult_ice.mp4` | `sc4a.js` |
| 레이저 바주카 (번개) | 저격수 | `03_sniper_ult_lightning.mp4` | `sc4a.js` |
| 발도 | 전사 | `04_warrior.mp4` | `sc4a.js` |
| 진심 펀치 | 마이너 | `05_miner_skill.mp4` | `sc4b.js` + `slamvfx.js` |
| 탄도미사일 | 포병 | `06_artillery_skill.mp4` | `sc4b.js` |
| 메테오 | 메이지 | `07_mage_meteor.mp4` | `sc4b.js` |
| 에너지 구 | 장판술사 | `08_zone_energy_orb.mp4` | `sc4c.js` |
| 축복 | 버퍼 | `10_buffer.mp4` | `sc4c.js` |

낙인(유령)은 컨펌 VFX가 없습니다. `09_ghost.mp4`는 옛 공포 연출이라 여기 넣지 않았습니다. 상인 액티브도 없습니다.

## 사용자 시트 (`sheets/`)

원본을 바이트 그대로 복사했습니다. 자르거나 다시 보내지 마세요.

| 파일 | 쓰임 |
| --- | --- |
| `bar1.png`–`bar6.png` | 쇼타임 난사 포즈 |
| `meta.json` | 위 시트와 t5/mis 컷 박스 |
| `t5_12.png` | 심판 발사 포즈 |
| `t5_6.png`, `t5_14.png` | 진심 펀치 차지·슬램 포즈 |
| `t5_4.png` | 탄도미사일 발사 포즈 |
| `mis1.png`, `mis2.png` | 탄도미사일 비행·박힘 (missile_sheet 컷) |
| `missile_sheet.png` | 사용자 원본 미사일 시트 (1254×1254) |
| `hanja.png` | 진심 펀치 死 |
| 그 외 `t5_*.png`, `r6i.png` | 같은 모션 세트 (목업 메타에 포함) |

## 사운드 (`sfx/`)

- `custom.js`: 게임 SFX 엔진 프리미티브로 만든 스킬 효과음 레시피 (v4 블록이 최종).
- `sfx.mjs`: 영상용 렌더러 (참고용).
- `*.wav`: 영상별 최종 사운드 트랙. 이름이 영상 파일과 같음.
- 버퍼·유령·늪 장판은 소리 없음.

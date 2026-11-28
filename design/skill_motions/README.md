# 글자 수·속성별 스킬 모션 시트 (사용자 제공 최신본)

- tiers/tier-5/tier-5-NN-속성.png, tiers/tier-6/tier-6-NN-속성.png: 5글자/6글자 × 10속성. 1536x1536, 4x4 칸(384px). 칸 번호와 좌표는 tiers/atlas-map.json.
  - 1~11칸: 직업별 기본 공격 포즈, 12/15/16칸: 새로 추가된 스킬 모션(사수 무릎 발사, 기사 발도 차지/베기 등). 칸 id는 atlas-map.json의 frames[].id를 볼 것.
- barrage/barrage-NN-속성.png: 6글자 레인저 쇼타임 난사 시트, 10속성.
- missile_sheet.png: 탄도미사일 비행/박힘. death_hanja_src.png: 死 한자.
- 속성 순서: 01 physical, 02 fire, 03 water, 04 lightning, 05 poison, 06 ice, 07 light, 08 wind, 09 earth, 10 dark.
- design/vfx_mock_v4/sheets/의 bar*, t5_*, r6i는 이 시트에서 한 속성만 잘라 시안에 쓴 참고 컷이다. 게임에는 이 폴더에서 유닛의 글자 수·속성에 맞는 시트를 쓸 것.
- 파일은 바이트 그대로 쓰고 다시 자르거나 새로 만들지 말 것.

# 단어 디펜스 iOS

`com.wordgame.worddefense`용 최소 네이티브 껍데기입니다. 게임은 번들된 단일 HTML을 `WKWebView`로 전체 화면(세로)에서 오프라인 로드합니다.

이 브랜치(`ios`)만 iOS 프로젝트를 담습니다. GitHub Pages 사이트는 `main` 브랜치를 그대로 씁니다. `main`에 푸시하지 마세요.

## 로컬에서 열기

1. [XcodeGen](https://github.com/yonaskolb/XcodeGen) 설치: `brew install xcodegen`
2. 최신 게임 HTML을 복사합니다. 이 워크스페이스에서는 자동으로 `/workspace/wordgame/main_v2/word_defense_v19.html`을 찾습니다.

       ./scripts/sync_html.sh
       xcodegen generate
       open WordDefense.xcodeproj

3. Xcode에서 팀(Team)만 고르면 실기기/시뮬레이터로 실행할 수 있습니다. `WordDefense.xcodeproj`는 생성물이라 커밋하지 않습니다.

CI와 Xcode 빌드 전 스크립트가 같은 `scripts/sync_html.sh`를 호출하므로, 로컬에서는 항상 워크스페이스의 최신 HTML을 집어넣습니다. GitHub Actions에서는 `main` 브랜치의 `index.html`(Pages에 올라간 게임)을 복사합니다.

## 이미 들어 있는 것

- 세로 전체 화면, 바운스/줌 없음, 안전 영역은 `?sat=&sab=`로 게임에 전달 (Android와 동일)
- 인라인 미디어, 자동 재생 허용, 화면 꺼짐 방지
- Android `ic_launcher`와 같은 원본으로 만든 앱 아이콘, 단색(`#1B1410`) 런치 화면
- `window.WDNative.googleSignIn()` JS 브리지 + `WDNativeRaw` / `__wdNatCb` (Android와 같은 계약)
- Google Sign-In SDK (SPM, 9.2.0) — ID 토큰을 JS의 기존 `signInWithCredential` 흐름에 돌려줌
- `GoogleService-Info.plist`, `REVERSED_CLIENT_ID` URL 스킴
- `PrivacyInfo.xcprivacy`
- 서명 없는 시뮬레이터·기기 빌드를 검증하는 GitHub Actions, 그리고 **수동으로만** 켜는 App Store 업로드 잡

## App Store에 올리려면

`docs/APP_STORE.md`를 보세요. API 키 시크릿과 Team ID가 필요합니다. 업로드 잡은 기본으로 실행되지 않습니다.

## 심사에서 걸릴 수 있는 것

README 아래 «Apple 심사» 절과 에이전트 보고를 참고하세요. 특히 Sign in with Apple, 인앱 결제는 StoreKit만 사용, 계정 삭제(게임에 이미 있음), 개인정보처리방침 갱신이 중요합니다.

## Apple 심사에서 걸릴 수 있는 것

- **Sign in with Apple (가이드라인 4.8)**  
  구글 로그인을 제공하는 앱은 보통 Apple로 로그인도 함께 넣어야 합니다. 지금은 구글만 연결되어 있습니다. App ID에 Sign in with Apple 능력을 켜고, 같은 계정 시스템에 Apple 로그인을 추가하는 것을 권장합니다.

- **인앱 결제 (가이드라인 3.1.1)**  
  보석·VIP·배틀패스 같은 디지털 상품은 **StoreKit(앱스토어 인앱 결제)** 으로만 팔 수 있습니다. 게임 HTML의 `WDPay`(원 단위 외부/웹 결제 창)를 iOS에서 그대로 띄우면 거절될 가능성이 큽니다. iOS에서는 `window.WDIap.purchase`를 StoreKit 2에 연결하고, `WDPay`는 쓰지 않는 쪽을 권장합니다.

- **계정 삭제 (가이드라인 5.1.1(v))**  
  게임 안에 «계정 삭제»가 이미 있습니다. 스토어 메타데이터와 개인정보처리방침에도 같은 경로를 안내하면 됩니다.

- **개인정보처리방침**  
  기존 방침은 «계정 없음»으로 적혀 있습니다. 구글 로그인·Firebase 저장이 들어간 뒤에는 수집 항목(이메일, 사용자 ID, 클라우드 세이브)과 삭제 방법을 갱신해야 합니다.

- **Privacy Manifest**  
  `PrivacyInfo.xcprivacy`를 이미 넣었습니다. UserDefaults(CA92.1)와 로그인·세이브 관련 수집 유형을 선언했습니다. App Store Connect의 앱 개인정보 질문도 이에 맞게 작성하세요.

- **ITSAppUsesNonExemptEncryption**  
  HTTPS만 쓰므로 `false`로 두었습니다. 별도의 암호 기능을 넣으면 수출 규정 질문을 다시 봐야 합니다.

## GitHub Actions 워크플로를 켜려면

`dlsejgh10-bot` GitHub 토큰에 `workflow` 스코프가 없어서 `.github/workflows/ios.yml`을 이 브랜치에 푸시하지 못했습니다. 워크플로 원본은 `docs/github-workflows/ios.yml`에 있습니다.

토큰에 `workflow` 권한을 추가한 뒤:

```bash
mkdir -p .github/workflows
cp docs/github-workflows/ios.yml .github/workflows/ios.yml
git add .github/workflows/ios.yml
git commit -m "Add iOS GitHub Actions workflow"
git push origin ios
```

또는 GitHub 웹에서 `ios` 브랜치에 `.github/workflows/ios.yml`로 같은 파일을 추가해도 됩니다. 파일이 올라가면 unsigned 시뮬레이터·기기 빌드가 자동으로 돕니다. App Store 업로드 잡은 수동 실행에서만 켜집니다.

# App Store 업로드 준비 (아직 실행하지 않음)

서명·업로드 잡(`appstore`)은 푸시만으로는 돌아가지 않습니다.
GitHub Actions에서 이 워크플로를 수동 실행하고 `upload_appstore`를 켰을 때만 동작합니다.

## 필요한 GitHub Secrets

리포지토리 Settings → Secrets and variables → Actions 에 아래를 넣습니다.

| Secret | 내용 |
| --- | --- |
| `ASC_KEY_ID` | App Store Connect API 키 ID (예: `AB12CD34EF`) |
| `ASC_ISSUER_ID` | Issuer ID (UUID) |
| `ASC_KEY_P8` | 다운로드한 `.p8` 파일 **전체 내용** (-----BEGIN PRIVATE KEY----- 포함) |
| `ASC_TEAM_ID` | Apple Developer Team ID (10자, Membership 페이지에 있음). 자동 서명에 필요합니다. |

## Apple Developer / App Store Connect에서 준비할 것

1. **Apple Developer Program 멤버십** (연간 유료, 이미 가입되어 있으면 그대로 사용).
2. **App Store Connect API 키**
   - [App Store Connect](https://appstoreconnect.apple.com/) → 사용자 및 액세스 → 통합 → App Store Connect API
   - 역할은 **관리자(Admin)** 또는 **앱 관리자(App Manager)** 권장 (자동으로 인증서·프로비저닝 프로필을 만들 수 있어야 함).
   - 키를 만들고 `.p8`을 즉시 다운로드합니다. 한 번만 받을 수 있습니다.
   - Key ID와 Issuer ID를 적어 둡니다.
3. **번들 ID** `com.wordgame.worddefense`
   - Certificates, Identifiers & Profiles에서 App ID를 미리 만들거나, 첫 서명 때 Xcode 자동 서명이 생성하게 둘 수 있습니다.
4. **App Store Connect에 앱 생성**
   - 번들 ID를 `com.wordgame.worddefense`로 연결합니다.
   - 이름, 프라이버시 정책 URL, 스크린샷, 등급, 심사 정보 등 스토어 메타데이터를 채웁니다.
5. **Sign in with Apple 능력(capability)** — 구글 로그인을 넣는 이상 심사를 통과하려면 거의 반드시 필요합니다. App ID에 능력을 켜고, 나중에 앱에도 버튼을 추가해야 합니다. (자세한 내용은 README의 심사 주의사항.)
6. **유료 애플리케이션 계약·은행/세금 정보** — 인앱 결제(보석, VIP, 배틀패스)를 팔려면 Agreements, Tax, and Banking을 완료하고, 상품은 **StoreKit / App Store 인앱 결제**로만 팔아야 합니다. 웹·외부 결제(WDPay)는 iOS에서 쓰면 거절됩니다.
7. 수동으로 워크플로를 돌리기 전에 위 시크릿이 들어 있는지 확인합니다. 이 잡이 인증서·프로필을 자동으로 만듭니다 (`xcodebuild -allowProvisioningUpdates`). fastlane match는 쓰지 않습니다.

Team ID는 [developer.apple.com/account](https://developer.apple.com/account) Membership 세부정보에서 확인할 수 있습니다.

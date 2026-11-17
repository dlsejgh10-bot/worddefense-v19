import AVFoundation
import UIKit
import WebKit

final class GameViewController: UIViewController, WKNavigationDelegate, WKUIDelegate {
    private let splash = UIColor(red: 27 / 255, green: 20 / 255, blue: 16 / 255, alpha: 1)
    private var webView: WKWebView!
    private let schemeHandler = BundledSchemeHandler()
    private let bridge = NativeBridge()
    private var loaded = false

    override var prefersStatusBarHidden: Bool { true }
    override var preferredScreenEdgesDeferringSystemGestures: UIRectEdge { .all }
    override var prefersHomeIndicatorAutoHidden: Bool { true }
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask { .portrait }
    override var preferredInterfaceOrientationForPresentation: UIInterfaceOrientation { .portrait }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = splash
        UIApplication.shared.isIdleTimerDisabled = true
        configureAudio()
        installWebView()
    }

    override func viewSafeAreaInsetsDidChange() {
        super.viewSafeAreaInsetsDidChange()
        loadGameIfNeeded()
        pushSafeArea()
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        loadGameIfNeeded()
    }

    /// Notch / home-indicator insets in CSS px (= points). The window's insets are used too because the
    /// view's can still be zero on the very first callback, before it is attached to the window.
    private func currentInsets() -> UIEdgeInsets {
        let v = view.safeAreaInsets
        let w = view.window?.safeAreaInsets ?? .zero
        return UIEdgeInsets(top: max(v.top, w.top), left: max(v.left, w.left), bottom: max(v.bottom, w.bottom), right: max(v.right, w.right))
    }

    /// Re-sends the insets to the page (the game also reads env(safe-area-inset-*) and ?sat=&sab=).
    private func pushSafeArea() {
        guard loaded, let web = webView else { return }
        let i = currentInsets()
        _ = i
        // The web view is already inside the safe area, so the page must not add the insets again.
        let js = "window.__wdSafe&&window.__wdSafe(0,0)"
        web.evaluateJavaScript(js, completionHandler: nil)
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        // Fallback if the insets callback never fires (matches Android's delayed load).
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.7) { [weak self] in
            self?.loadGameIfNeeded(force: true)
        }
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        UIApplication.shared.isIdleTimerDisabled = false
    }

    private func configureAudio() {
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
        try? session.setActive(true)
    }

    private func installWebView() {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.allowsAirPlayForMediaPlayback = true
        config.preferences.javaScriptCanOpenWindowsAutomatically = false
        config.defaultWebpagePreferences.allowsContentJavaScript = true
        config.setURLSchemeHandler(schemeHandler, forURLScheme: BundledSchemeHandler.scheme)

        let user = config.userContentController
        user.add(bridge, name: NativeBridge.handlerName)
        user.addUserScript(WKUserScript(source: NativeBridge.shimJS, injectionTime: .atDocumentStart, forMainFrameOnly: false))

        let web = WKWebView(frame: .zero, configuration: config)
        web.translatesAutoresizingMaskIntoConstraints = false
        web.isOpaque = false
        web.backgroundColor = splash
        web.scrollView.backgroundColor = splash
        web.scrollView.bounces = false
        web.scrollView.alwaysBounceVertical = false
        web.scrollView.alwaysBounceHorizontal = false
        web.scrollView.contentInsetAdjustmentBehavior = .never
        web.scrollView.showsVerticalScrollIndicator = false
        web.scrollView.showsHorizontalScrollIndicator = false
        web.scrollView.minimumZoomScale = 1
        web.scrollView.maximumZoomScale = 1
        web.scrollView.pinchGestureRecognizer?.isEnabled = false
        web.allowsBackForwardNavigationGestures = false
        web.allowsLinkPreview = false
        web.navigationDelegate = self
        web.uiDelegate = self
        #if DEBUG
        if #available(iOS 16.4, *) { web.isInspectable = true }
        #endif
        view.addSubview(web)
        NSLayoutConstraint.activate([
            // 11/17 build 22: the web view itself sits inside the safe area (below the notch, above the home indicator).
            // Nothing in the game can be cut off there, whatever the page's CSS/JS does; the strips outside are the splash colour.
            web.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            web.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor),
            web.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            web.trailingAnchor.constraint(equalTo: view.trailingAnchor)
        ])
        webView = web
        bridge.webView = web
        bridge.viewController = self
    }

    private func loadGameIfNeeded(force: Bool = false) {
        guard !loaded, webView != nil else { return }
        // Wait until the view is on screen so the notch / home-indicator insets are real (not 0).
        let insets = currentInsets()
        if !force && (view.window == nil || (insets.top <= 0 && insets.bottom <= 0)) { return }
        loaded = true
        // CSS pixels ≈ points, same idea as Android passing density-independent px via ?sat=&sab=.
        var components = URLComponents(url: BundledSchemeHandler.startURL, resolvingAgainstBaseURL: false)!
        components.queryItems = [
            // Insets are 0 inside the page: the web view is pinned to the safe area (see installWebView).
            URLQueryItem(name: "sat", value: "0"),
            URLQueryItem(name: "sab", value: "0"),
            // Bundle build number: a new build never reuses anything WebKit kept from an older one.
            URLQueryItem(name: "v", value: Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "0")
        ]
        _ = insets
        guard let url = components.url else { return }
        // Drop any HTTP/memory cache WebKit kept (never localStorage / save data), then load the bundled game fresh.
        let types: Set<String> = [WKWebsiteDataTypeDiskCache, WKWebsiteDataTypeMemoryCache, WKWebsiteDataTypeOfflineWebApplicationCache, WKWebsiteDataTypeFetchCache, WKWebsiteDataTypeServiceWorkerRegistrations]
        WKWebsiteDataStore.default().removeData(ofTypes: types, modifiedSince: .distantPast) { [weak self] in
            self?.webView.load(URLRequest(url: url, cachePolicy: .reloadIgnoringLocalAndRemoteCacheData))
        }
    }

    // MARK: - WKNavigationDelegate

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        pushSafeArea()
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.allow)
            return
        }
        let scheme = url.scheme?.lowercased() ?? ""
        if scheme == BundledSchemeHandler.scheme || scheme == "about" || scheme == "blob" || scheme == "data" {
            decisionHandler(.allow)
            return
        }
        if scheme == "http" || scheme == "https" {
            if navigationAction.targetFrame?.isMainFrame == false {
                decisionHandler(.allow)
                return
            }
            UIApplication.shared.open(url, options: [:], completionHandler: nil)
            decisionHandler(.cancel)
            return
        }
        if UIApplication.shared.canOpenURL(url) {
            UIApplication.shared.open(url, options: [:], completionHandler: nil)
        }
        decisionHandler(.cancel)
    }

    // MARK: - WKUIDelegate

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = navigationAction.request.url {
            UIApplication.shared.open(url, options: [:], completionHandler: nil)
        }
        return nil
    }

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let alert = UIAlertController(title: "단어 디펜스", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "확인", style: .default) { _ in completionHandler() })
        present(alert, animated: true)
    }

    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let alert = UIAlertController(title: "단어 디펜스", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "취소", style: .cancel) { _ in completionHandler(false) })
        alert.addAction(UIAlertAction(title: "확인", style: .default) { _ in completionHandler(true) })
        present(alert, animated: true)
    }
}

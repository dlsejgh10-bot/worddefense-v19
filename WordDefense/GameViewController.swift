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
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        // Fallback if the insets callback never fires (matches Android's delayed load).
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.7) { [weak self] in
            self?.loadGameIfNeeded()
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
            web.topAnchor.constraint(equalTo: view.topAnchor),
            web.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            web.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            web.trailingAnchor.constraint(equalTo: view.trailingAnchor)
        ])
        webView = web
        bridge.webView = web
        bridge.viewController = self
    }

    private func loadGameIfNeeded() {
        guard !loaded, webView != nil else { return }
        loaded = true
        let insets = view.safeAreaInsets
        // CSS pixels ≈ points, same idea as Android passing density-independent px via ?sat=&sab=.
        var components = URLComponents(url: BundledSchemeHandler.startURL, resolvingAgainstBaseURL: false)!
        components.queryItems = [
            URLQueryItem(name: "sat", value: String(Int(insets.top.rounded()))),
            URLQueryItem(name: "sab", value: String(Int(insets.bottom.rounded())))
        ]
        guard let url = components.url else { return }
        webView.load(URLRequest(url: url))
    }

    // MARK: - WKNavigationDelegate

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

import UIKit
import WebKit
import GoogleSignIn

/// Mirrors the Android wrapper:
///  - JS calls `window.WDNative.googleSignIn()` (Promise → `{ idToken }` or a string)
///  - Android also exposes `WDNativeRaw.googleSignIn(id)` and calls back `window.__wdNatCb(id, token, err)`
/// iOS injects a shim that provides both, and talks to this handler over `webkit.messageHandlers.WDNative`.
final class NativeBridge: NSObject, WKScriptMessageHandler {
    weak var viewController: UIViewController?
    weak var webView: WKWebView?

    static let handlerName = "WDNative"

    static let shimJS = """
    (function () {
      if (window.WDNative && typeof window.WDNative.googleSignIn === 'function') return;
      var pending = {};
      window.__wdNatCb = function (id, token, err) {
        var p = pending[id];
        if (!p) return;
        delete pending[id];
        if (token) { p.resolve({ idToken: token }); return; }
        if (err && err !== 'cancel') {
          var e = new Error(String(err));
          e.code = String(err);
          p.reject(e);
          return;
        }
        p.resolve(null);
      };
      function post(method, id) {
        try {
          window.webkit.messageHandlers.WDNative.postMessage({ method: method, id: String(id) });
        } catch (e) {
          window.__wdNatCb(id, null, 'no-bridge');
        }
      }
      var seq = 0;
      window.WDNative = {
        googleSignIn: function () {
          return new Promise(function (resolve, reject) {
            var id = 'g' + (++seq) + '_' + Date.now();
            pending[id] = { resolve: resolve, reject: reject };
            post('googleSignIn', id);
          });
        }
      };
      window.WDNativeRaw = {
        googleSignIn: function (id) { post('googleSignIn', id); }
      };
    })();
    """

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == Self.handlerName else { return }
        guard let body = message.body as? [String: Any],
              let method = body["method"] as? String,
              let id = body["id"] as? String else { return }
        switch method {
        case "googleSignIn":
            googleSignIn(id: id)
        default:
            callback(id: id, token: nil, err: "unknown-method")
        }
    }

    private func googleSignIn(id: String) {
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            guard let presenter = self.topViewController() else {
                self.callback(id: id, token: nil, err: "native/no-presenter")
                return
            }
            GIDSignIn.sharedInstance.signIn(withPresenting: presenter) { result, error in
                if let error = error as NSError? {
                    let cancelled = error.code == GIDSignInError.canceled.rawValue
                    self.callback(id: id, token: nil, err: cancelled ? "cancel" : "native/\(error.code)")
                    return
                }
                guard let token = result?.user.idToken?.tokenString, !token.isEmpty else {
                    self.callback(id: id, token: nil, err: "bad-credential")
                    return
                }
                self.callback(id: id, token: token, err: nil)
            }
        }
    }

    private func topViewController() -> UIViewController? {
        if let vc = viewController { return vc }
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        let window = scenes.flatMap(\.windows).first(where: \\.isKeyWindow) ?? scenes.first?.windows.first
        var top = window?.rootViewController
        while let presented = top?.presentedViewController { top = presented }
        return top
    }

    private func callback(id: String, token: String?, err: String?) {
        let js = "window.__wdNatCb&&window.__wdNatCb(\(Self.json(id)),\(token.map { Self.json($0) } ?? "null"),\(err.map { Self.json($0) } ?? "null"));"
        DispatchQueue.main.async { [weak self] in
            self?.webView?.evaluateJavaScript(js, completionHandler: nil)
        }
    }

    private static func json(_ value: String) -> String {
        let data = try? JSONSerialization.data(withJSONObject: value, options: .fragmentsAllowed)
        return data.flatMap { String(data: $0, encoding: .utf8) } ?? "\"\""
    }
}

import AuthenticationServices
import CryptoKit
import GoogleSignIn
import UIKit
import WebKit

/// Mirrors the Android wrapper:
///  - JS calls `window.WDNative.googleSignIn()` (Promise → `{ idToken }` or a string)
///  - JS can also call `window.WDNative.appleSignIn()` (Promise → `{ idToken, nonce, authorizationCode? }`)
///  - Android also exposes `WDNativeRaw.googleSignIn(id)` and calls back `window.__wdNatCb(id, token, err)`
/// iOS injects a shim that provides both, and talks to this handler over `webkit.messageHandlers.WDNative`.
final class NativeBridge: NSObject, WKScriptMessageHandler, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {
    weak var viewController: UIViewController?
    weak var webView: WKWebView?

    static let handlerName = "WDNative"

    private var appleController: ASAuthorizationController?
    private var appleRequestId: String?
    private var appleRawNonce: String?

    static let shimJS = """
    (function () {
      var pending = window.__wdNatPending || (window.__wdNatPending = {});
      window.__wdNatCb = function (id, result, err) {
        var p = pending[id];
        if (!p) return;
        delete pending[id];
        if (result) {
          p.resolve(typeof result === 'string' ? { idToken: result } : result);
          return;
        }
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
      function wrap(method) {
        return function () {
          return new Promise(function (resolve, reject) {
            var id = method.charAt(0) + (++seq) + '_' + Date.now();
            pending[id] = { resolve: resolve, reject: reject };
            post(method, id);
          });
        };
      }
      var native = window.WDNative || (window.WDNative = {});
      if (typeof native.googleSignIn !== 'function') native.googleSignIn = wrap('googleSignIn');
      if (typeof native.appleSignIn !== 'function') native.appleSignIn = wrap('appleSignIn');
      var raw = window.WDNativeRaw || (window.WDNativeRaw = {});
      if (typeof raw.googleSignIn !== 'function') raw.googleSignIn = function (id) { post('googleSignIn', id); };
      if (typeof raw.appleSignIn !== 'function') raw.appleSignIn = function (id) { post('appleSignIn', id); };
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
        case "appleSignIn":
            appleSignIn(id: id)
        default:
            callback(id: id, result: nil, err: "unknown-method")
        }
    }

    private func googleSignIn(id: String) {
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            guard let presenter = self.topViewController() else {
                self.callback(id: id, result: nil, err: "native/no-presenter")
                return
            }
            GIDSignIn.sharedInstance.signIn(withPresenting: presenter) { result, error in
                if let error = error as NSError? {
                    let cancelled = error.code == GIDSignInError.canceled.rawValue
                    self.callback(id: id, result: nil, err: cancelled ? "cancel" : "native/\(error.code)")
                    return
                }
                guard let token = result?.user.idToken?.tokenString, !token.isEmpty else {
                    self.callback(id: id, result: nil, err: "bad-credential")
                    return
                }
                self.callback(id: id, result: token, err: nil)
            }
        }
    }

    private func appleSignIn(id: String) {
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            let raw = Self.randomNonce()
            self.appleRequestId = id
            self.appleRawNonce = raw
            let request = ASAuthorizationAppleIDProvider().createRequest()
            request.requestedScopes = [.fullName, .email]
            request.nonce = Self.sha256(raw)
            let controller = ASAuthorizationController(authorizationRequests: [request])
            controller.delegate = self
            controller.presentationContextProvider = self
            self.appleController = controller
            controller.performRequests()
        }
    }

    func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        if let window = viewController?.view.window { return window }
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        return scenes.flatMap { $0.windows }.first { $0.isKeyWindow }
            ?? scenes.first?.windows.first
            ?? ASPresentationAnchor()
    }

    func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        let id = appleRequestId
        let rawNonce = appleRawNonce
        appleRequestId = nil
        appleRawNonce = nil
        appleController = nil
        guard let id else { return }
        guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
              let tokenData = credential.identityToken,
              let token = String(data: tokenData, encoding: .utf8), !token.isEmpty else {
            callback(id: id, result: nil, err: "bad-credential")
            return
        }
        var payload: [String: Any] = [
            "idToken": token,
            "nonce": rawNonce ?? ""
        ]
        if let codeData = credential.authorizationCode,
           let code = String(data: codeData, encoding: .utf8), !code.isEmpty {
            payload["authorizationCode"] = code
        }
        if let email = credential.email, !email.isEmpty {
            payload["email"] = email
        }
        if let name = credential.fullName {
            var parts: [String: String] = [:]
            if let given = name.givenName, !given.isEmpty { parts["givenName"] = given }
            if let family = name.familyName, !family.isEmpty { parts["familyName"] = family }
            if !parts.isEmpty { payload["fullName"] = parts }
        }
        if !credential.user.isEmpty {
            payload["user"] = credential.user
        }
        callback(id: id, result: payload, err: nil)
    }

    func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        let id = appleRequestId
        appleRequestId = nil
        appleRawNonce = nil
        appleController = nil
        guard let id else { return }
        let ns = error as NSError
        let cancelled = ns.code == ASAuthorizationError.canceled.rawValue
        callback(id: id, result: nil, err: cancelled ? "cancel" : "native/\(ns.code)")
    }

    private func topViewController() -> UIViewController? {
        if let vc = viewController { return vc }
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        let window = scenes.flatMap { $0.windows }.first { $0.isKeyWindow } ?? scenes.first?.windows.first
        var top = window?.rootViewController
        while let presented = top?.presentedViewController { top = presented }
        return top
    }

    private func callback(id: String, result: Any?, err: String?) {
        let resultJSON: String
        if let result {
            if JSONSerialization.isValidJSONObject(result) || result is String || result is NSNumber || result is NSNull {
                if let data = try? JSONSerialization.data(withJSONObject: result, options: .fragmentsAllowed),
                   let text = String(data: data, encoding: .utf8) {
                    resultJSON = text
                } else {
                    resultJSON = "null"
                }
            } else {
                resultJSON = "null"
            }
        } else {
            resultJSON = "null"
        }
        let js = "window.__wdNatCb&&window.__wdNatCb(\(Self.json(id)),\(resultJSON),\(err.map { Self.json($0) } ?? "null"));"
        DispatchQueue.main.async { [weak self] in
            self?.webView?.evaluateJavaScript(js, completionHandler: nil)
        }
    }

    private static func json(_ value: String) -> String {
        let data = try? JSONSerialization.data(withJSONObject: value, options: .fragmentsAllowed)
        return data.flatMap { String(data: $0, encoding: .utf8) } ?? "\"\""
    }

    private static func randomNonce(length: Int = 32) -> String {
        let charset = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-._")
        var bytes = [UInt8](repeating: 0, count: length)
        let status = SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes)
        precondition(status == errSecSuccess, "SecRandomCopyBytes failed")
        return String(bytes.map { charset[Int($0) % charset.count] })
    }

    private static func sha256(_ input: String) -> String {
        let hash = SHA256.hash(data: Data(input.utf8))
        return hash.map { String(format: "%02x", $0) }.joined()
    }
}

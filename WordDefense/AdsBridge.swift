import GoogleMobileAds
import UIKit
import WebKit

/// b174: AdMob rewarded ads for the game. Nothing loads or shows unless the page asks
/// (the page only asks when the remote switch Firestore config/app ads.enabled is on).
/// JS: WDAdsNative.showRewarded(placement) → webkit WDNative {method:'adsShowRewarded', id, unit}
///     → window.__wdAdCb(id, rewarded, err)
final class AdsBridge: NSObject, FullScreenContentDelegate {
    weak var webView: WKWebView?
    weak var viewController: UIViewController?
    private var started = false
    private var current: RewardedAd?
    private var pendingId: String?
    private var earned = false

    func start() {
        guard !started else { return }
        started = true
        MobileAds.shared.start(completionHandler: nil)
    }

    func showRewarded(id: String, unit: String) {
        guard pendingId == nil else { callback(id: id, rewarded: false, err: "busy"); return }
        guard !unit.isEmpty else { callback(id: id, rewarded: false, err: "no-unit"); return }
        start()
        pendingId = id
        earned = false
        RewardedAd.load(with: unit, request: Request()) { [weak self] ad, error in
            DispatchQueue.main.async {
                guard let self = self else { return }
                guard let ad = ad, error == nil else { self.finish(err: "load-failed"); return }
                guard let vc = self.viewController else { self.finish(err: "no-view"); return }
                self.current = ad
                ad.fullScreenContentDelegate = self
                ad.present(from: vc) { [weak self] in self?.earned = true }
            }
        }
    }

    func adDidDismissFullScreenContent(_ ad: FullScreenPresentingAd) {
        finish(err: earned ? nil : "dismissed")
    }

    func ad(_ ad: FullScreenPresentingAd, didFailToPresentFullScreenContentWithError error: Error) {
        finish(err: "show-failed")
    }

    private func finish(err: String?) {
        guard let id = pendingId else { return }
        pendingId = nil
        current = nil
        callback(id: id, rewarded: err == nil && earned, err: err)
    }

    private func callback(id: String, rewarded: Bool, err: String?) {
        let e = err.map { "'" + $0 + "'" } ?? "null"
        let js = "window.__wdAdCb && window.__wdAdCb('\(id)', \(rewarded ? "true" : "false"), \(e));"
        DispatchQueue.main.async { [weak self] in self?.webView?.evaluateJavaScript(js, completionHandler: nil) }
    }
}

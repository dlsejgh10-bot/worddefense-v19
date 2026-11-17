import Foundation
import StoreKit
import WebKit

/// 11/17 StoreKit 2 in-app purchases, same contract as the Android wrapper:
///  JS → `WDNativeRaw.iapBuy(id, sku)` / `WDNativeRaw.iapFinish(token, sku)` / `WDNativeRaw.iapRestore()`
///  native → `window.__wdIapCb(id, json, err)` (err "cancel" | "pending" | ...) and `window.__wdIapPush(jsonArray)`
/// The game grants the item (to the mailbox) first and then calls iapFinish, so a crash in between re-delivers it.
final class StoreBridge {
    weak var webView: WKWebView?
    private var open: [String: Transaction] = [:]
    private var updates: Task<Void, Never>?

    init() {
        updates = Task { @MainActor [weak self] in
            for await result in Transaction.updates {
                guard let self else { return }
                if case .verified(let t) = result {
                    if t.revocationDate != nil { await t.finish(); continue }
                    self.open[String(t.id)] = t
                    self.push([Self.payload(t)])
                }
            }
        }
    }

    deinit { updates?.cancel() }

    func buy(id: String, sku: String) {
        Task { @MainActor in
            do {
                guard let product = try await Product.products(for: [sku]).first else {
                    self.callback(id: id, result: nil, err: "not-found"); return
                }
                switch try await product.purchase() {
                case .success(let verification):
                    guard case .verified(let t) = verification else {
                        self.callback(id: id, result: nil, err: "unverified"); return
                    }
                    self.open[String(t.id)] = t
                    self.callback(id: id, result: Self.payload(t), err: nil)
                case .userCancelled:
                    self.callback(id: id, result: nil, err: "cancel")
                case .pending:
                    self.callback(id: id, result: nil, err: "pending")
                @unknown default:
                    self.callback(id: id, result: nil, err: "unknown")
                }
            } catch {
                self.callback(id: id, result: nil, err: "native/\((error as NSError).code)")
            }
        }
    }

    /// StoreKit localized prices: { sku: { p: price, d: displayPrice, c: currencyCode } }
    func prices(id: String, skus: [String]) {
        Task { @MainActor in
            var out: [String: Any] = [:]
            if let products = try? await Product.products(for: skus) {
                for p in products {
                    out[p.id] = ["p": NSDecimalNumber(decimal: p.price).doubleValue, "d": p.displayPrice, "c": p.priceFormatStyle.currencyCode]
                }
            }
            self.callback(id: id, result: out, err: nil)
        }
    }

    func finish(token: String) {
        guard !token.isEmpty else { return }
        Task { @MainActor in
            if let t = self.open.removeValue(forKey: token) { await t.finish(); return }
            for await result in Transaction.unfinished {
                if case .verified(let t) = result, String(t.id) == token { await t.finish(); return }
            }
        }
    }

    func restore() {
        Task { @MainActor in
            var list: [[String: Any]] = []
            var seen = Set<String>()
            for await result in Transaction.unfinished {
                if case .verified(let t) = result, t.revocationDate == nil {
                    self.open[String(t.id)] = t
                    if seen.insert(String(t.id)).inserted { list.append(Self.payload(t)) }
                }
            }
            for await result in Transaction.currentEntitlements {   // non-consumable (VIP) restore
                if case .verified(let t) = result, t.productType == .nonConsumable, t.revocationDate == nil {
                    if seen.insert(String(t.id)).inserted { list.append(Self.payload(t)) }
                }
            }
            if !list.isEmpty { self.push(list) }
        }
    }

    private static func payload(_ t: Transaction) -> [String: Any] {
        // VIP (non-consumable) uses the original transaction id so a restore after reinstall maps to the same order
        let order = t.productType == .nonConsumable ? String(t.originalID) : String(t.id)
        return ["orderId": "ios_" + order, "transactionId": String(t.id), "purchaseToken": String(t.id), "sku": t.productID, "store": "appstore"]
    }

    private static func json(_ obj: Any) -> String {
        guard let d = try? JSONSerialization.data(withJSONObject: obj, options: .fragmentsAllowed), let s = String(data: d, encoding: .utf8) else { return "null" }
        return s
    }

    private func callback(id: String, result: [String: Any]?, err: String?) {
        let r = result.map { Self.json(Self.json($0)) } ?? "null"
        let js = "window.__wdIapCb&&window.__wdIapCb(\(Self.json(id)),\(r),\(err.map { Self.json($0) } ?? "null"));"
        webView?.evaluateJavaScript(js, completionHandler: nil)
    }

    private func push(_ list: [[String: Any]]) {
        let js = "window.__wdIapPush&&window.__wdIapPush(\(Self.json(Self.json(list))));"
        webView?.evaluateJavaScript(js, completionHandler: nil)
    }
}

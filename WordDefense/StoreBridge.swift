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
                    if t.revocationDate != nil { await t.finish(); if t.productType == .autoRenewable { self.subStatus() }; continue }
                    if t.productType == .autoRenewable { await t.finish(); self.subStatus(); continue }   // 11/18 b146 VIP subscription renewals
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
                    if t.productType == .autoRenewable {   // entitlement, not a mailbox item: finish now and report the expiry
                        await t.finish()
                        var o = Self.payload(t)
                        o["sub"] = 1
                        o["orig"] = String(t.originalID)
                        o["exp"] = (t.expirationDate?.timeIntervalSince1970 ?? 0) * 1000
                        self.callback(id: id, result: o, err: nil)
                        return
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
                if case .verified(let t) = result, t.productType == .autoRenewable { await t.finish(); continue }
                if case .verified(let t) = result, t.revocationDate == nil {
                    self.open[String(t.id)] = t
                    if seen.insert(String(t.id)).inserted { list.append(Self.payload(t)) }
                }
            }
            // 11/18 b146: no automatic re-delivery of the old non-consumable vip_pass (no VIP re-grant after a game reset).
            // Only unfinished (paid but not yet granted) transactions are delivered.
            if !list.isEmpty { self.push(list) }
        }
    }

    /// 11/18 b146: auto-renewable subscription entitlements (VIP = vip_month).
    /// JS `WDNativeRaw.subStatus()` → `window.__wdSubCb(json)` with {"vip_month":{"exp":ms,"auto":bool,"orig":originalTransactionId}} or {} when lapsed.
    /// The game decides which game account the entitlement belongs to (bound by orig on its server); this only reports.
    func subStatus() {
        Task { @MainActor in
            var out: [String: Any] = [:]
            for await result in Transaction.currentEntitlements {
                guard case .verified(let t) = result, t.productType == .autoRenewable, t.revocationDate == nil else { continue }
                let exp = (t.expirationDate?.timeIntervalSince1970 ?? 0) * 1000
                if let prev = out[t.productID] as? [String: Any], (prev["exp"] as? Double ?? 0) >= exp { continue }
                var auto = true
                if #available(iOS 16.6, *), let st = await t.subscriptionStatus, case .verified(let ri) = st.renewalInfo { auto = ri.willAutoRenew }
                out[t.productID] = ["exp": exp, "auto": auto, "orig": String(t.originalID)]
            }
            let js = "window.__wdSubCb&&window.__wdSubCb(\(Self.json(Self.json(out))));"
            self.webView?.evaluateJavaScript(js, completionHandler: nil)
        }
    }

    /// Manual restore button: re-sync with the App Store (may ask the user to sign in), then report entitlements.
    func syncRestore() {
        Task { @MainActor in
            try? await AppStore.sync()
            self.subStatus()
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

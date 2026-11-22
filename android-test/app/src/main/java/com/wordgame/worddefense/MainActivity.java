package com.wordgame.worddefense;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.view.DisplayCutoutCompat;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.webkit.WebViewAssetLoader;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.GetCredentialCancellationException;
import androidx.credentials.exceptions.GetCredentialException;
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

import org.json.JSONArray;
import org.json.JSONObject;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.ConsumeParams;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import java.util.concurrent.Executor;

public class MainActivity extends AppCompatActivity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + HOST + "/assets/index.html";
    // 11/17 Firebase web client id (Credential Manager serverClientId)
    private static final String SERVER_CLIENT_ID = "719509438132-u5gipt0b2vshrduf29jodvodmptci4pe.apps.googleusercontent.com";

    private WebView web;
    private boolean loaded = false;
    private AlertDialog exitDialog;
    // 11/17 Google Play Billing (one-time products). JS: WDNativeRaw.iapBuy(id, sku) / iapFinish(token, sku) / iapRestore()
    private BillingClient billing;
    private String buyCb, buySku;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .setDomain(HOST)
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#1B1410"));
        web.setLayoutParams(new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);                 // localStorage persistence
        s.setMediaPlaybackRequiresUserGesture(false); // v19: BGM may start on launch (no first-tap gate)
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setTextZoom(100);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setVerticalScrollBarEnabled(false);
        web.setHorizontalScrollBarEnabled(false);
        web.setLongClickable(false);
        web.setOnLongClickListener(v -> true);
        web.setHapticFeedbackEnabled(false);

        // 11/17 JS bridge: WDNativeRaw.googleSignIn(id) -> Credential Manager -> window.__wdNatCb(id, idToken, err)
        web.addJavascriptInterface(new NativeBridge(), "WDNativeRaw");
        initBilling();

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if (HOST.equals(u.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) { }
                return true;
            }
        });

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                // 11/17c: 맨 위 창이 바깥 터치로 닫히는 창(배틀패스 등)이면 뒤로가기 = 그 창 닫기, 아니면 종료 확인
                if (web == null) { askExit(); return; }
                web.evaluateJavascript("(function(){try{return !!(window.__wdBack&&window.__wdBack());}catch(e){return false;}})()",
                        v -> { if (!"true".equals(v)) askExit(); });
            }
        });

        // v19: full-screen immersive before the page measures itself; pass the camera-cutout safe insets (css px) so the
        // game keeps its HUD out of the punch hole while the map fills the whole tall screen
        hideSystemBars();
        ViewCompat.setOnApplyWindowInsetsListener(web, (v, insets) -> {
            if (!loaded) {
                DisplayCutoutCompat cut = insets.getDisplayCutout();
                float d = getResources().getDisplayMetrics().density;
                int top = cut != null ? Math.round(cut.getSafeInsetTop() / d) : 0;
                int bot = cut != null ? Math.round(cut.getSafeInsetBottom() / d) : 0;
                loadGame("?sat=" + top + "&sab=" + bot);
            }
            return insets;
        });
        web.postDelayed(() -> loadGame(""), 700);   // fallback if no insets callback arrives
    }

    private class NativeBridge {
        @JavascriptInterface
        public void googleSignIn(final String id) { runOnUiThread(() -> startGoogleSignIn(id)); }
        @JavascriptInterface
        public void iapBuy(final String id, final String sku) { runOnUiThread(() -> startBuy(id, sku)); }
        @JavascriptInterface
        public void iapFinish(final String token, final String sku) { runOnUiThread(() -> finishPurchase(token, sku)); }
        @JavascriptInterface
        public void iapRestore() { runOnUiThread(() -> restorePurchases()); }
        @JavascriptInterface
        public void subStatus() { runOnUiThread(() -> querySubs()); }
        @JavascriptInterface
        public void iapSync() { runOnUiThread(() -> querySubs()); }
    }

    /* ---------- 11/17 Play Billing ---------- */
    private static boolean isNonConsumable(String sku) { return "vip_pass".equals(sku); }   // 11/18 b147: only the old permanent vip_pass; vip_pass30 (30-day VIP) is a consumable
    // 11/18 b146: VIP is an auto-renewing monthly subscription (Play product vip_month, base plan "monthly")
    private static boolean isSub(String sku) { return false; }   // 11/18 b147: no subscriptions (VIP = consumable vip_pass30); subscription code paths are dead

    private void initBilling() {
        billing = BillingClient.newBuilder(this)
                .setListener(this::onPurchasesUpdated)
                .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
                .enableAutoServiceReconnection()
                .build();
        connectBilling(null, null);
    }

    private void connectBilling(final Runnable ok, final String failCb) {
        if (billing == null) { if (failCb != null) iapCb(failCb, null, "billing/unavailable"); return; }
        if (billing.isReady()) { if (ok != null) ok.run(); return; }
        billing.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult r) {
                runOnUiThread(() -> {
                    if (r.getResponseCode() == BillingClient.BillingResponseCode.OK) { if (ok != null) ok.run(); }
                    else if (failCb != null) iapCb(failCb, null, "billing/" + r.getResponseCode());
                });
            }
            @Override
            public void onBillingServiceDisconnected() { }
        });
    }

    private void startBuy(final String id, final String sku) {
        if (buyCb != null) { iapCb(id, null, "busy"); return; }
        connectBilling(() -> {
            QueryProductDetailsParams q = QueryProductDetailsParams.newBuilder().setProductList(Collections.singletonList(
                    QueryProductDetailsParams.Product.newBuilder().setProductId(sku).setProductType(isSub(sku) ? BillingClient.ProductType.SUBS : BillingClient.ProductType.INAPP).build())).build();
            billing.queryProductDetailsAsync(q, (r, res) -> runOnUiThread(() -> {
                List<ProductDetails> l = res != null ? res.getProductDetailsList() : null;
                if (r.getResponseCode() != BillingClient.BillingResponseCode.OK || l == null || l.isEmpty()) { iapCb(id, null, "not-found"); return; }
                BillingFlowParams.ProductDetailsParams.Builder pb = BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(l.get(0));
                if (isSub(sku)) {
                    List<ProductDetails.SubscriptionOfferDetails> offers = l.get(0).getSubscriptionOfferDetails();
                    if (offers == null || offers.isEmpty()) { iapCb(id, null, "not-found"); return; }
                    String tok = offers.get(0).getOfferToken();
                    for (ProductDetails.SubscriptionOfferDetails od : offers) if ("monthly".equals(od.getBasePlanId()) && od.getOfferId() == null) { tok = od.getOfferToken(); break; }
                    pb.setOfferToken(tok);
                }
                BillingFlowParams fp = BillingFlowParams.newBuilder().setProductDetailsParamsList(Collections.singletonList(pb.build())).build();
                buyCb = id; buySku = sku;
                BillingResult br = billing.launchBillingFlow(this, fp);
                if (br.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                    buyCb = null; buySku = null;
                    if (br.getResponseCode() == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) restorePurchases();
                    iapCb(id, null, br.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED ? "cancel" : "billing/" + br.getResponseCode());
                }
            }));
        }, id);
    }

    private void onPurchasesUpdated(BillingResult r, List<Purchase> purchases) {
        runOnUiThread(() -> {
            final String cb = buyCb, sku = buySku;
            buyCb = null; buySku = null;
            int code = r.getResponseCode();
            if (code == BillingClient.BillingResponseCode.OK && purchases != null) {
                JSONArray other = new JSONArray();
                boolean answered = false;
                for (Purchase p : purchases) {
                    JSONObject o = purchaseJson(p);
                    String psku = p.getProducts().isEmpty() ? "" : p.getProducts().get(0);
                    if (isSub(psku)) {   // subscription: entitlement, not a mailbox item
                        if (p.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                            ackSub(p);
                            try { o.put("sub", 1); o.put("orig", p.getPurchaseToken()); o.put("exp", subExp(p)); } catch (Exception ignored) { }
                            if (cb != null && !answered && psku.equals(sku)) { iapCb(cb, o.toString(), null); answered = true; }
                        } else if (cb != null && !answered && psku.equals(sku)) { iapCb(cb, null, "pending"); answered = true; }
                        continue;
                    }
                    if (p.getPurchaseState() != Purchase.PurchaseState.PURCHASED) {
                        if (cb != null && !answered && p.getProducts().contains(sku)) { iapCb(cb, null, "pending"); answered = true; }
                        continue;
                    }
                    if (cb != null && !answered && p.getProducts().contains(sku)) { iapCb(cb, o.toString(), null); answered = true; }
                    else other.put(o);
                }
                if (cb != null && !answered) iapCb(cb, null, "billing/no-purchase");
                if (other.length() > 0) iapPush(other);
            } else if (cb != null) {
                iapCb(cb, null, code == BillingClient.BillingResponseCode.USER_CANCELED ? "cancel" : "billing/" + code);
                if (code == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) restorePurchases();
            }
        });
    }

    private JSONObject purchaseJson(Purchase p) {
        JSONObject o = new JSONObject();
        try {
            String sku = p.getProducts().isEmpty() ? "" : p.getProducts().get(0);
            String oid = p.getOrderId();
            o.put("orderId", oid != null && !oid.isEmpty() ? oid : p.getPurchaseToken());
            o.put("purchaseToken", p.getPurchaseToken());
            o.put("sku", sku);
            o.put("time", p.getPurchaseTime());
            o.put("store", "play");
        } catch (Exception ignored) { }
        return o;
    }

    private void finishPurchase(final String token, final String sku) {
        if (token == null || token.isEmpty() || isSub(sku)) return;   // subscriptions are acknowledged in ackSub, never consumed
        connectBilling(() -> {
            if (isNonConsumable(sku)) {
                billing.acknowledgePurchase(AcknowledgePurchaseParams.newBuilder().setPurchaseToken(token).build(), br -> { });
            } else {
                billing.consumeAsync(ConsumeParams.newBuilder().setPurchaseToken(token).build(), (br, t) -> { });
            }
        }, null);
    }

    private void restorePurchases() {
        connectBilling(() -> billing.queryPurchasesAsync(
                QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build(),
                (r, list) -> runOnUiThread(() -> {
                    if (r.getResponseCode() != BillingClient.BillingResponseCode.OK || list == null) return;
                    JSONArray a = new JSONArray();
                    for (Purchase p : list) {
                        if (p.getPurchaseState() != Purchase.PurchaseState.PURCHASED) continue;
                        String sku = p.getProducts().isEmpty() ? "" : p.getProducts().get(0);
                        if (isNonConsumable(sku) && p.isAcknowledged()) continue;   // 11/18 b146: old vip_pass already granted = never re-sent (no VIP re-grant after a game reset)
                        a.put(purchaseJson(p));   // not yet consumed / acknowledged = not finished
                    }
                    if (a.length() > 0) iapPush(a);
                })), null);
    }

    private void ackSub(Purchase p) {
        if (p.isAcknowledged()) return;
        billing.acknowledgePurchase(AcknowledgePurchaseParams.newBuilder().setPurchaseToken(p.getPurchaseToken()).build(), br -> { });
    }

    /** The Play client has no expiry field: estimate the current period end by stepping whole months from the
     *  original purchase time. Play only returns subscriptions that are still entitled, and the game re-checks on
     *  every launch and resume, so a lapse turns VIP off at the next check. */
    private static long subExp(Purchase p) {
        java.util.Calendar c = java.util.Calendar.getInstance(java.util.TimeZone.getTimeZone("Asia/Seoul"));
        c.setTimeInMillis(p.getPurchaseTime());
        long now = System.currentTimeMillis();
        for (int i = 0; i < 1200 && c.getTimeInMillis() <= now; i++) c.add(java.util.Calendar.MONTH, 1);
        return c.getTimeInMillis();
    }

    /** JS: WDNativeRaw.subStatus() -> window.__wdSubCb(json) with {"vip_month":{"exp":ms,"auto":bool,"orig":purchaseToken}} or {} */
    private void querySubs() {
        connectBilling(() -> billing.queryPurchasesAsync(
                QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.SUBS).build(),
                (r, list) -> runOnUiThread(() -> {
                    if (r.getResponseCode() != BillingClient.BillingResponseCode.OK || list == null) return;   // unknown: the game keeps its last state
                    JSONObject out = new JSONObject();
                    for (Purchase p : list) {
                        if (p.getPurchaseState() != Purchase.PurchaseState.PURCHASED) continue;
                        String sku = p.getProducts().isEmpty() ? "" : p.getProducts().get(0);
                        if (!isSub(sku)) continue;
                        ackSub(p);
                        try {
                            JSONObject o = new JSONObject();
                            o.put("exp", subExp(p)); o.put("auto", p.isAutoRenewing()); o.put("orig", p.getPurchaseToken());
                            out.put(sku, o);
                        } catch (Exception ignored) { }
                    }
                    if (web == null) return;
                    final String js = "window.__wdSubCb&&window.__wdSubCb(" + JSONObject.quote(out.toString()) + ")";
                    web.post(() -> { if (web != null) web.evaluateJavascript(js, null); });
                })), null);
    }

    private void iapCb(String id, String json, String err) {
        if (web == null || id == null) return;
        final String js = "window.__wdIapCb&&window.__wdIapCb(" + JSONObject.quote(id) + "," + (json == null ? "null" : JSONObject.quote(json)) + "," + (err == null ? "null" : JSONObject.quote(err)) + ")";
        web.post(() -> { if (web != null) web.evaluateJavascript(js, null); hideSystemBars(); });
    }

    private void iapPush(JSONArray a) {
        if (web == null) return;
        final String js = "window.__wdIapPush&&window.__wdIapPush(" + JSONObject.quote(a.toString()) + ")";
        web.post(() -> { if (web != null) web.evaluateJavascript(js, null); });
    }

    private void startGoogleSignIn(final String id) {
        try {
            GetSignInWithGoogleOption opt = new GetSignInWithGoogleOption.Builder(SERVER_CLIENT_ID).build();
            GetCredentialRequest req = new GetCredentialRequest.Builder().addCredentialOption(opt).build();
            Executor ui = this::runOnUiThread;
            CredentialManager.create(this).getCredentialAsync(this, req, null, ui,
                    new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                        @Override
                        public void onResult(GetCredentialResponse r) {
                            Credential c = r.getCredential();
                            if (c instanceof CustomCredential && GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(c.getType())) {
                                try { signInDone(id, GoogleIdTokenCredential.createFrom(c.getData()).getIdToken(), null); }
                                catch (Exception e) { signInDone(id, null, "bad-credential"); }
                            } else signInDone(id, null, "bad-credential");
                        }

                        @Override
                        public void onError(GetCredentialException e) {
                            signInDone(id, null, e instanceof GetCredentialCancellationException ? "cancel" : ("native/" + e.getType()));
                        }
                    });
        } catch (Exception e) {
            signInDone(id, null, "native/" + e.getClass().getSimpleName());
        }
    }

    private void signInDone(String id, String token, String err) {
        if (web == null) return;
        final String js = "window.__wdNatCb&&window.__wdNatCb(" + JSONObject.quote(id) + "," + (token == null ? "null" : JSONObject.quote(token)) + "," + (err == null ? "null" : JSONObject.quote(err)) + ")";
        web.post(() -> { if (web != null) web.evaluateJavascript(js, null); hideSystemBars(); });
    }

    private void loadGame(String q) {
        if (loaded || web == null) return;
        loaded = true;
        web.loadUrl(START_URL + q);
    }

    private void askExit() {
        if (exitDialog != null && exitDialog.isShowing()) return;
        exitDialog = new AlertDialog.Builder(this)
                .setTitle(R.string.exit_title)
                .setMessage(R.string.exit_msg)
                .setNegativeButton(R.string.exit_no, null)
                .setPositiveButton(R.string.exit_yes, (d, w) -> finish())
                .create();
        exitDialog.setOnDismissListener(d -> hideSystemBars());
        exitDialog.show();
    }

    private void hideSystemBars() {
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        c.hide(androidx.core.view.WindowInsetsCompat.Type.systemBars());
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars();
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        // not restoring page state on purpose for big pages; localStorage holds game data
    }

    @Override
    protected void onPause() {
        if (web != null) { web.onPause(); web.pauseTimers(); }
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) { web.onResume(); web.resumeTimers(); }
        hideSystemBars();
    }

    @Override
    protected void onDestroy() {
        if (exitDialog != null && exitDialog.isShowing()) exitDialog.dismiss();
        if (billing != null) { try { billing.endConnection(); } catch (Exception ignored) { } billing = null; }
        if (web != null) {
            ((ViewGroup) web.getParent()).removeView(web);
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }
}

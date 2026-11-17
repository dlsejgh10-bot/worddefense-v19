import Foundation
import UniformTypeIdentifiers
import WebKit

/// Serves the bundled game from `wdgame://app/...` so `?sat=&sab=` query params work
/// and localStorage is tied to a stable origin (more reliable than file://).
final class BundledSchemeHandler: NSObject, WKURLSchemeHandler {
    static let scheme = "wdgame"
    static let host = "app"
    static var startURL: URL {
        URL(string: "\(scheme)://\(host)/index.html")!
    }

    private let root: URL
    private var stopped = Set<ObjectIdentifier>()

    override init() {
        let fm = FileManager.default
        if let www = Bundle.main.url(forResource: "www", withExtension: nil),
           fm.fileExists(atPath: www.appendingPathComponent("index.html").path) {
            self.root = www.standardizedFileURL
        } else if let html = Bundle.main.url(forResource: "index", withExtension: "html") {
            // Xcode may flatten the www folder and copy index.html to the bundle root.
            self.root = html.deletingLastPathComponent().standardizedFileURL
        } else {
            self.root = Bundle.main.bundleURL.standardizedFileURL
        }
        super.init()
    }

    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        let token = ObjectIdentifier(urlSchemeTask)
        guard let url = urlSchemeTask.request.url else {
            urlSchemeTask.didFailWithError(URLError(.badURL))
            return
        }
        var path = url.path
        if path.isEmpty || path == "/" { path = "/index.html" }
        let file = root.appendingPathComponent(String(path.dropFirst()), isDirectory: false).standardizedFileURL
        guard file.path.hasPrefix(root.path) else {
            urlSchemeTask.didFailWithError(URLError(.cannotOpenFile))
            return
        }
        guard FileManager.default.fileExists(atPath: file.path),
              let data = try? Data(contentsOf: file) else {
            let message = "<!doctype html><meta charset=utf-8><body style='background:#1B1410;color:#fff;font-family:sans-serif;padding:24px'>게임을 찾지 못했어요 (\(path)).</body>"
            let fallback = Data(message.utf8)
            let response = URLResponse(url: url, mimeType: "text/html", expectedContentLength: fallback.count, textEncodingName: "utf-8")
            guard !stopped.contains(token) else { return }
            urlSchemeTask.didReceive(response)
            urlSchemeTask.didReceive(fallback)
            urlSchemeTask.didFinish()
            return
        }
        let mime = UTType(filenameExtension: file.pathExtension)?.preferredMIMEType ?? "application/octet-stream"
        let response = URLResponse(url: url, mimeType: mime, expectedContentLength: data.count, textEncodingName: "utf-8")
        guard !stopped.contains(token) else { return }
        urlSchemeTask.didReceive(response)
        urlSchemeTask.didReceive(data)
        urlSchemeTask.didFinish()
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {
        stopped.insert(ObjectIdentifier(urlSchemeTask))
    }
}

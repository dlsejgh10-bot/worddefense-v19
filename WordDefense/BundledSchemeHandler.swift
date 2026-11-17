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
        guard let root = Bundle.main.url(forResource: "www", withExtension: nil) else {
            preconditionFailure("www folder missing from the app bundle — run scripts/sync_html.sh")
        }
        self.root = root.standardizedFileURL
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
            urlSchemeTask.didFailWithError(URLError(.fileDoesNotExist))
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

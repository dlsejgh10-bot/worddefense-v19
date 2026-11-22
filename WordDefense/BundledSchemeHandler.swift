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
    private var activeTasks = [ObjectIdentifier: UUID]()
    private let fileQueue = DispatchQueue(label: "worddefense.bundled-files", qos: .userInitiated)

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
        let requestID = UUID()
        activeTasks[token] = requestID
        guard let url = urlSchemeTask.request.url else {
            activeTasks.removeValue(forKey: token)
            urlSchemeTask.didFailWithError(URLError(.badURL))
            return
        }
        var path = url.path
        if path.isEmpty || path == "/" { path = "/index.html" }
        let file = root.appendingPathComponent(String(path.dropFirst()), isDirectory: false).standardizedFileURL
        guard file.path.hasPrefix(root.path + "/") else {
            activeTasks.removeValue(forKey: token)
            urlSchemeTask.didFailWithError(URLError(.cannotOpenFile))
            return
        }
        // Map bundled files off the UI thread and return callbacks on main.
        fileQueue.async {
            let data = try? Data(contentsOf: file, options: .mappedIfSafe)
            let mime = UTType(filenameExtension: file.pathExtension)?.preferredMIMEType ?? "application/octet-stream"
            DispatchQueue.main.async { [weak self] in
                guard let self = self, self.activeTasks[token] == requestID else { return }
                self.activeTasks.removeValue(forKey: token)
                guard let data = data else {
                    urlSchemeTask.didFailWithError(URLError(.fileDoesNotExist))
                    return
                }
                let response = URLResponse(url: url, mimeType: mime, expectedContentLength: data.count, textEncodingName: nil)
                urlSchemeTask.didReceive(response)
                urlSchemeTask.didReceive(data)
                urlSchemeTask.didFinish()
            }
        }
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {
        activeTasks.removeValue(forKey: ObjectIdentifier(urlSchemeTask))
    }
}

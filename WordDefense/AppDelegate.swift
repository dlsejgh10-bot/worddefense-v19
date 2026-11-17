import UIKit
import GoogleSignIn

@main
final class AppDelegate: UIResponder, UIApplicationDelegate {
    static let serverClientID = "719509438132-u5gipt0b2vshrduf29jodvodmptci4pe.apps.googleusercontent.com"

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        configureGoogleSignIn()
        return true
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        GIDSignIn.sharedInstance.handle(url)
    }

    func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let config = UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
        config.delegateClass = SceneDelegate.self
        return config
    }

    private func configureGoogleSignIn() {
        let clientID: String
        if let path = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist"),
           let dict = NSDictionary(contentsOfFile: path),
           let fromPlist = dict["CLIENT_ID"] as? String, !fromPlist.isEmpty {
            clientID = fromPlist
        } else if let fromInfo = Bundle.main.object(forInfoDictionaryKey: "GIDClientID") as? String, !fromInfo.isEmpty {
            clientID = fromInfo
        } else {
            assertionFailure("Google Sign-In CLIENT_ID missing from GoogleService-Info.plist")
            return
        }
        GIDSignIn.sharedInstance.configuration = GIDConfiguration(clientID: clientID, serverClientID: AppDelegate.serverClientID)
    }
}

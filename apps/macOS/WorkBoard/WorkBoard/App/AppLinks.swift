import Foundation

/// External addresses used by the app.
enum AppLinks {
    static let repository = URL(string: "https://github.com/mariomncbo/workboard")!
    /// The web version, with the landing page at its root.
    static let website = URL(string: "https://getworkboard.netlify.app")!
    /// Where password reset emails send the user back. Registered as a URL scheme in
    /// Info.plist and allowed in Supabase (Authentication → URL Configuration).
    static let passwordReset = URL(string: "workboard://reset-password")!
}

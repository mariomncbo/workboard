import Foundation

/// External addresses used by the app.
enum AppLinks {
    static let repository = URL(string: "https://github.com/mariomncbo/workboard")!
    /// The web version has no address yet; links to it stay hidden until it does.
    static let website: URL? = nil
    /// Where password reset emails send the user back. Registered as a URL scheme in
    /// Info.plist and allowed in Supabase (Authentication → URL Configuration).
    static let passwordReset = URL(string: "workboard://reset-password")!
}

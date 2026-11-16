/// Result of the live nickname availability check on the sign-up form.
enum NicknameStatus {
    /// Empty, invalid or not checked yet.
    case unchecked
    case checking
    case available
    case taken
}

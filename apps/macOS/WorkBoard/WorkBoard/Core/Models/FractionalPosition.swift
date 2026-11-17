/// Positions for ordered items (lists and tasks). An item moved between two others
/// gets the midpoint of their positions, so no other row has to be rewritten.
nonisolated enum FractionalPosition {
    static func between(_ previous: Double?, and next: Double?) -> Double {
        switch (previous, next) {
        case let (previous?, next?): (previous + next) / 2
        case let (previous?, nil): previous + 1
        case let (nil, next?): next - 1
        case (nil, nil): 1
        }
    }

    /// Position for an item added at the end.
    static func after(_ last: Double?) -> Double {
        (last ?? 0) + 1
    }
}

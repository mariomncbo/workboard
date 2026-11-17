import SwiftUI

extension ReorderDifference where CollectionID == ReorderableSingleCollectionIdentifier {
    /// Applies a drag reorder to the source collection. SwiftUI reports the change but does
    /// not move the items itself. Moved items keep the order in which they were selected.
    func apply<Items>(to items: inout Items)
    where Items: RangeReplaceableCollection,
          Items.Element: Identifiable,
          Items.Element.ID == ItemID {
        let relocated = sources.compactMap { sourceID in
            items.first { $0.id == sourceID }
        }
        let sourceIDs = Set(sources)
        items.removeAll { sourceIDs.contains($0.id) }

        switch destination.position {
        case .before(let followingID):
            let insertionPoint = items.firstIndex { $0.id == followingID } ?? items.endIndex
            items.insert(contentsOf: relocated, at: insertionPoint)
        case .end:
            items.append(contentsOf: relocated)
        }
    }
}

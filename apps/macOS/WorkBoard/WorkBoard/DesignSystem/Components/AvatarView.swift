import SwiftUI

/// Round avatar with the user's initials. There are no profile photos yet.
/// Neutral on purpose, so it never competes with the primary action.
struct AvatarView: View {
    enum Size {
        /// 22 pt, in the account rows of the user menu.
        case mini
        /// 28 pt, inside the glass account button of the toolbar and on Login.
        case small
        /// 44 pt, in the user menu header and on Register.
        case large

        fileprivate var diameter: Double {
            switch self {
            case .mini: 22
            case .small: 28
            case .large: 44
            }
        }

        fileprivate var fontSize: Double {
            switch self {
            case .mini: 9
            case .small: 11
            case .large: 15
            }
        }
    }

    let fullName: String
    var size = Size.small

    var body: some View {
        // The avatar is a fixed-size badge, so its text scales with the circle.
        Text(verbatim: Initials.from(fullName))
            .font(.system(size: size.fontSize, weight: .semibold))
            .tracking(0.2)
            .foregroundStyle(Color.textPrimary)
            .frame(width: size.diameter, height: size.diameter)
            .background(Color.bgComponentActive, in: .circle)
            .overlay {
                Circle().strokeBorder(Color.border, lineWidth: 1)
            }
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(Text(verbatim: fullName))
    }
}

#Preview {
    HStack(spacing: Spacing.s3) {
        AvatarView(fullName: "Daniel Ruiz")
        AvatarView(fullName: "Lucía Ortega", size: .large)
        AvatarView(fullName: "Marta", size: .large)
    }
    .padding(Spacing.s5)
    .background(Color.bgPage)
}

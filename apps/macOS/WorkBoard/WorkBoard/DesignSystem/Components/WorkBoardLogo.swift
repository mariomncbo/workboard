import SwiftUI

/// Horizontal WorkBoard logo for dark backgrounds: symbol plus name.
///
/// Proportions match `brand/logo/workboard-horizontal-oscuro.svg`. The name is set in
/// SF Pro like the SVG. The logo is artwork, so its size follows `height` instead of
/// Dynamic Type. Brand rules: minimum height 20 pt; never stretch it or add effects.
struct WorkBoardLogo: View {
    /// Height of the symbol, in points. 24 in toolbars, 50 on Login and Register.
    var height = 24.0

    var body: some View {
        HStack(spacing: height * 0.24) {
            LogoSymbol()
                .frame(width: height, height: height)

            Text(verbatim: "WorkBoard")
                .font(.system(size: height * 0.52, weight: .semibold))
                .tracking(-height * 0.016)
                .foregroundStyle(Color(hex: 0xEEF0F4))
                .fixedSize()
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(Text(verbatim: "WorkBoard"))
    }
}

#Preview {
    VStack(spacing: 32) {
        WorkBoardLogo(height: 50)
        WorkBoardLogo()
    }
    .padding(40)
    .background(Color.bgPage)
}

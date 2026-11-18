#!/bin/zsh
# Builds WorkBoard.dmg: the Release app, signed with the Apple Development certificate,
# next to a shortcut to Aplicaciones so it can be installed by dragging.
#
#   apps/macOS/scripts/make-dmg.sh [output folder]   (default: apps/macOS/build)
#
# The app is not notarized (there is no Apple Developer Program): the first time, macOS asks
# to allow it in System Settings → Privacy & Security.
set -euo pipefail

ROOT=${0:A:h:h}
PROJECT="$ROOT/WorkBoard/WorkBoard.xcodeproj"
OUT=${1:-"$ROOT/build"}
WORK="$OUT/dmg-work"
export DEVELOPER_DIR=${DEVELOPER_DIR:-/Applications/Xcode.app/Contents/Developer}

rm -rf "$WORK" "$OUT/WorkBoard.dmg"
mkdir -p "$WORK/stage"

echo "→ Archivando la versión Release…"
xcodebuild -project "$PROJECT" -scheme WorkBoard -configuration Release \
  -destination 'generic/platform=macOS' archive -archivePath "$WORK/WorkBoard.xcarchive" -quiet

APP="$WORK/WorkBoard.xcarchive/Products/Applications/WorkBoard.app"
codesign --verify --deep --strict "$APP"
ditto "$APP" "$WORK/stage/WorkBoard.app"
ln -s /Applications "$WORK/stage/Aplicaciones"

echo "→ Creando la imagen de disco…"
hdiutil create -quiet -volname WorkBoard -srcfolder "$WORK/stage" -fs HFS+ -format UDRW -ov "$WORK/WorkBoard-rw.dmg"
DEVICE=$(hdiutil attach -readwrite -noverify -noautoopen "$WORK/WorkBoard-rw.dmg" 2>/dev/null | awk '/Apple_HFS/ { print $1 }')

# Finder window: the app on the left, Aplicaciones on the right, large icons.
osascript <<'APPLESCRIPT'
tell application "Finder"
  tell disk "WorkBoard"
    open
    set current view of container window to icon view
    set toolbar visible of container window to false
    set statusbar visible of container window to false
    set the bounds of container window to {200, 120, 760, 460}
    set viewOptions to the icon view options of container window
    set arrangement of viewOptions to not arranged
    set icon size of viewOptions to 128
    set text size of viewOptions to 13
    set position of item "WorkBoard.app" of container window to {150, 160}
    set position of item "Aplicaciones" of container window to {410, 160}
    update without registering applications
    delay 1
    close
  end tell
end tell
APPLESCRIPT

sync
hdiutil detach -quiet "$DEVICE"
hdiutil convert -quiet "$WORK/WorkBoard-rw.dmg" -format ULFO -o "$OUT/WorkBoard.dmg"

IDENTITY=$(security find-identity -v -p codesigning | awk -F'"' '/Apple Development/ { print $2; exit }')
codesign --sign "$IDENTITY" "$OUT/WorkBoard.dmg"
hdiutil verify -quiet "$OUT/WorkBoard.dmg"
codesign --verify "$OUT/WorkBoard.dmg"
rm -rf "$WORK"

echo "✓ $OUT/WorkBoard.dmg ($(du -h "$OUT/WorkBoard.dmg" | cut -f1 | tr -d ' '))"

// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * SF Symbols to Material Icons mappings for VIP Events app.
 */
const MAPPING = {
  // Navigation
  "house.fill": "home",
  "calendar": "event",
  "calendar.fill": "event",
  "qrcode": "qr-code",
  "qrcode.viewfinder": "qr-code-scanner",
  "crown.fill": "star",
  "person.fill": "person",
  "person.circle.fill": "account-circle",
  // Admin
  "chart.bar.fill": "bar-chart",
  "camera.fill": "camera-alt",
  "person.2.fill": "group",
  "bell.fill": "notifications",
  "gear": "settings",
  "gearshape.fill": "settings",
  // Actions
  "paperplane.fill": "send",
  "checkmark.circle.fill": "check-circle",
  "xmark.circle.fill": "cancel",
  "arrow.right.circle.fill": "arrow-circle-right",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "chevron.left.forwardslash.chevron.right": "code",
  // Content
  "ticket.fill": "confirmation-number",
  "location.fill": "location-on",
  "map.fill": "map",
  "bell.badge.fill": "notification-important",
  "creditcard.fill": "credit-card",
  "cart.fill": "shopping-cart",
  "star.fill": "star",
  "lock.fill": "lock",
  "eye.fill": "visibility",
  "eye.slash.fill": "visibility-off",
  "plus.circle.fill": "add-circle",
  "minus.circle.fill": "remove-circle",
  "trash.fill": "delete",
  "pencil": "edit",
  "magnifyingglass": "search",
  "info.circle.fill": "info",
  "exclamationmark.triangle.fill": "warning",
  "checkmark.seal.fill": "verified",
  "clock.fill": "access-time",
  "arrow.clockwise": "refresh",
  "square.and.arrow.up": "share",
  "doc.fill": "description",
  "photo.fill": "photo",
  "wine.bottle": "wine-bar",
  "fork.knife": "restaurant",
  "music.note": "music-note",
  "sparkles": "auto-awesome",
  "bubble.left.and.bubble.right.fill": "chat",
  "message.fill": "chat",
  "chat.bubble.fill": "chat",
} as unknown as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}

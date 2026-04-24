import { TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useColors } from '@/hooks/use-colors';

interface HamburgerButtonProps {
  onPress: () => void;
}

export function HamburgerButton({ onPress }: HamburgerButtonProps) {
  const colors = useColors();

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.icon, { color: colors.primary }]}>☰</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
    fontWeight: '600',
  },
});

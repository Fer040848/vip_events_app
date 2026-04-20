import { View, Pressable, Text } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import { RsvpStatus } from '@/hooks/use-rsvps';

interface RsvpButtonProps {
  status: RsvpStatus;
  onPress: (status: RsvpStatus) => void;
  loading?: boolean;
}

export function RsvpButton({ status, onPress, loading }: RsvpButtonProps) {
  const colors = useColors();

  const options: Array<{ value: RsvpStatus; label: string; icon: string }> = [
    { value: 'going', label: '✓ Voy', icon: '✓' },
    { value: 'maybe', label: '? Tal vez', icon: '?' },
    { value: 'not_going', label: '✕ No puedo', icon: '✕' },
  ];

  return (
    <View className="gap-3">
      <Text className="text-sm font-semibold text-muted mb-2">¿Vas a asistir?</Text>
      <View className="flex-row gap-2 justify-between">
        {options.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => onPress(option.value)}
            disabled={loading}
            style={({ pressed }) => [
              {
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 8,
                borderRadius: 8,
                borderWidth: 2,
                borderColor: status === option.value ? colors.primary : colors.border,
                backgroundColor:
                  status === option.value
                    ? `${colors.primary}20`
                    : 'transparent',
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text
              className={cn(
                'text-center font-semibold text-sm',
                status === option.value ? 'text-primary' : 'text-foreground'
              )}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

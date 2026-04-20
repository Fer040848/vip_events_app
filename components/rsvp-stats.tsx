import { View, Text } from 'react-native';
import { useColors } from '@/hooks/use-colors';

interface RsvpStatsProps {
  going: number;
  maybe: number;
  notGoing: number;
  compact?: boolean;
}

export function RsvpStats({ going, maybe, notGoing, compact = false }: RsvpStatsProps) {
  const colors = useColors();
  const total = going + maybe + notGoing;

  if (compact) {
    return (
      <View className="flex-row gap-3 items-center">
        <View className="flex-row items-center gap-1">
          <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
            ✓
          </Text>
          <Text className="text-xs text-muted">{going}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Text className="text-xs font-semibold" style={{ color: colors.warning }}>
            ?
          </Text>
          <Text className="text-xs text-muted">{maybe}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Text className="text-xs font-semibold" style={{ color: colors.error }}>
            ✕
          </Text>
          <Text className="text-xs text-muted">{notGoing}</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="gap-3">
      <Text className="text-sm font-semibold text-foreground mb-2">
        Respuestas ({total})
      </Text>
      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: colors.primary }}
            />
            <Text className="text-sm text-foreground">Voy</Text>
          </View>
          <Text className="text-sm font-semibold text-primary">{going}</Text>
        </View>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: colors.warning }}
            />
            <Text className="text-sm text-foreground">Tal vez</Text>
          </View>
          <Text className="text-sm font-semibold text-warning">{maybe}</Text>
        </View>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: colors.error }}
            />
            <Text className="text-sm text-foreground">No puedo</Text>
          </View>
          <Text className="text-sm font-semibold text-error">{notGoing}</Text>
        </View>
      </View>
    </View>
  );
}

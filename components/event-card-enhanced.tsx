import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";
import * as Haptics from "expo-haptics";

interface EventCardEnhancedProps {
  id: number;
  name: string;
  date: string;
  location: string;
  attendees: number;
  image?: string;
  onPress: () => void;
  isPaid?: boolean;
}

export function EventCardEnhanced({
  id,
  name,
  date,
  location,
  attendees,
  image,
  onPress,
  isPaid = false,
}: EventCardEnhancedProps) {
  const colors = useColors();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        {
          transform: [{ scale: pressed ? 0.95 : 1 }],
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <LinearGradient
        colors={["#6366F1", "#EC4899"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="rounded-2xl overflow-hidden mb-4"
      >
        <View className="bg-black/20 p-4">
          {image && (
            <Image
              source={{ uri: image }}
              className="w-full h-40 rounded-lg mb-3"
              contentFit="cover"
              style={{ width: "100%", height: 160 }}
            />
          )}

          <View className="gap-2">
            <View className="flex-row items-start justify-between">
              <Text className="text-xl font-bold text-white flex-1 pr-2">{name}</Text>
              {isPaid && (
                <View className="bg-green-500 px-2 py-1 rounded-full">
                  <Text className="text-xs font-semibold text-white">✓ Pagado</Text>
                </View>
              )}
            </View>

            <View className="gap-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-sm text-white/80">📅</Text>
                <Text className="text-sm text-white/90">{date}</Text>
              </View>

              <View className="flex-row items-center gap-2">
                <Text className="text-sm text-white/80">📍</Text>
                <Text className="text-sm text-white/90">{location}</Text>
              </View>

              <View className="flex-row items-center gap-2">
                <Text className="text-sm text-white/80">👥</Text>
                <Text className="text-sm text-white/90">{attendees} invitados</Text>
              </View>
            </View>

            <Pressable
              onPress={handlePress}
              className="bg-white/20 rounded-lg py-2 px-3 mt-2 active:bg-white/30"
            >
              <Text className="text-white font-semibold text-center text-sm">Ver detalles</Text>
            </Pressable>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

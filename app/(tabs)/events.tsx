import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";

const MONTHS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function EventsScreen() {
  const router = useRouter();
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const { data: events, isLoading } = trpc.events.list.useQuery();

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const firstDay = getFirstDayOfMonth(selectedYear, selectedMonth);

  const eventsByDay: Record<number, typeof events> = {};
  events?.forEach((event) => {
    const d = new Date(event.date);
    if (d.getFullYear() === selectedYear && d.getMonth() === selectedMonth) {
      const day = d.getDate();
      if (!eventsByDay[day]) eventsByDay[day] = [];
      eventsByDay[day]!.push(event);
    }
  });

  const filteredEvents = selectedDay
    ? eventsByDay[selectedDay] ?? []
    : events?.filter((e) => {
        const d = new Date(e.date);
        return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
      }) ?? [];

  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
    setSelectedDay(null);
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Calendario VIP</Text>
        </View>

        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
            <Text style={styles.navBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {MONTHS[selectedMonth]} {selectedYear}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
            <Text style={styles.navBtnText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Day Headers */}
        <View style={styles.dayHeaders}>
          {DAYS.map((d) => (
            <Text key={d} style={styles.dayHeader}>{d}</Text>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {Array.from({ length: firstDay }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.dayCell} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const hasEvent = !!eventsByDay[day];
            const isToday =
              day === today.getDate() &&
              selectedMonth === today.getMonth() &&
              selectedYear === today.getFullYear();
            const isSelected = selectedDay === day;
            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayCell,
                  isToday && styles.todayCell,
                  isSelected && styles.selectedCell,
                ]}
                onPress={() => setSelectedDay(isSelected ? null : day)}
              >
                <Text
                  style={[
                    styles.dayText,
                    isToday && styles.todayText,
                    isSelected && styles.selectedText,
                  ]}
                >
                  {day}
                </Text>
                {hasEvent && (
                  <View
                    style={[
                      styles.eventDot,
                      isSelected && { backgroundColor: "#0A0A0A" },
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Events List */}
        <View style={styles.eventsSection}>
          <Text style={styles.eventsSectionTitle}>
            {selectedDay
              ? `Eventos el ${selectedDay} de ${MONTHS[selectedMonth]}`
              : `Eventos en ${MONTHS[selectedMonth]}`}
          </Text>
          {isLoading ? (
            <ActivityIndicator color="#C9A84C" style={{ marginTop: 20 }} />
          ) : filteredEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyText}>No hay eventos este mes</Text>
            </View>
          ) : (
            <FlatList
              data={filteredEvents}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.eventItem}
                  onPress={() => router.push(`/event/${item.id}` as any)}
                  activeOpacity={0.85}
                >
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.eventItemImage} />
                  ) : (
                    <View style={styles.eventItemImagePlaceholder}>
                      <Text style={{ fontSize: 28 }}>🎉</Text>
                    </View>
                  )}
                  <View style={styles.eventItemContent}>
                    <Text style={styles.eventItemTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.eventItemDate}>
                      {new Date(item.date).toLocaleDateString("es-MX", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                    <View style={styles.eventItemFooter}>
                      <Text style={styles.eventItemPrice}>${item.price} MXN</Text>
                      <View style={styles.eventItemBadge}>
                        <Text style={styles.eventItemBadgeText}>BARRA LIBRE</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#F5E6C8",
    letterSpacing: 0.5,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  navBtnText: {
    color: "#C9A84C",
    fontSize: 22,
    fontWeight: "300",
    lineHeight: 26,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F5E6C8",
    letterSpacing: 0.5,
  },
  dayHeaders: {
    flexDirection: "row",
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  dayHeader: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    color: "#8A7A5A",
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  todayCell: {
    borderWidth: 1,
    borderColor: "#C9A84C",
  },
  selectedCell: {
    backgroundColor: "#C9A84C",
  },
  dayText: {
    fontSize: 14,
    color: "#F5E6C8",
    fontWeight: "500",
  },
  todayText: {
    color: "#C9A84C",
    fontWeight: "700",
  },
  selectedText: {
    color: "#0A0A0A",
    fontWeight: "700",
  },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#C9A84C",
    marginTop: 2,
  },
  eventsSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  eventsSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#C9A84C",
    marginBottom: 12,
    textTransform: "capitalize",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 40,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyText: {
    color: "#8A7A5A",
    fontSize: 14,
  },
  eventItem: {
    flexDirection: "row",
    backgroundColor: "#1A1A1A",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  eventItemImage: {
    width: 90,
    height: 90,
  },
  eventItemImagePlaceholder: {
    width: 90,
    height: 90,
    backgroundColor: "#2A2A2A",
    alignItems: "center",
    justifyContent: "center",
  },
  eventItemContent: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  eventItemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F5E6C8",
    lineHeight: 20,
  },
  eventItemDate: {
    fontSize: 11,
    color: "#C9A84C",
    textTransform: "capitalize",
  },
  eventItemFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eventItemPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F5E6C8",
  },
  eventItemBadge: {
    backgroundColor: "#C9A84C22",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#C9A84C44",
  },
  eventItemBadgeText: {
    color: "#C9A84C",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});

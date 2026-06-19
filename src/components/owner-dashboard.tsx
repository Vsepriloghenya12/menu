import { categories, dishes } from "@/data/menu";
import { formatMoney } from "@/utils/money";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

export function OwnerDashboard() {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Страница владельца</Text>
          <Text style={styles.title}>Видео-меню</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{dishes.length}</Text>
          <Text style={styles.statLabel}>блюд</Text>
        </View>
      </View>

      <View style={styles.toolbar}>
        <TextInput
          accessibilityLabel="Поиск по меню"
          placeholder="Поиск по меню"
          placeholderTextColor="#6b7785"
          style={styles.input}
        />
        <View style={styles.categorySummary}>
          {categories.map((category) => (
            <Text key={category.id} style={styles.categoryPill}>{category.title}</Text>
          ))}
        </View>
      </View>

      <View style={styles.table}>
        {dishes.map((dish) => (
          <View key={dish.id} style={styles.row}>
            <View style={styles.mainCell}>
              <Text style={styles.dishTitle}>{dish.title}</Text>
              <Text style={styles.muted}>{dish.shortDescription}</Text>
              <Text style={styles.videoUrl}>{dish.videoUrl}</Text>
            </View>
            <View style={styles.infoCell}>
              <Text style={styles.label}>Цена</Text>
              <Text style={styles.value}>{formatMoney(dish.price)}</Text>
            </View>
            <View style={styles.infoCell}>
              <Text style={styles.label}>КБЖУ</Text>
              <Text style={styles.value}>
                {dish.nutrition.calories} / {dish.nutrition.protein} / {dish.nutrition.fat} / {dish.nutrition.carbs}
              </Text>
            </View>
            <View style={styles.longCell}>
              <Text style={styles.label}>Допы</Text>
              <Text style={styles.muted}>{dish.addOns.map((addOn) => addOn.title).join(", ")}</Text>
            </View>
            <View style={styles.longCell}>
              <Text style={styles.label}>Подойдет</Text>
              <Text style={styles.muted}>{dish.pairings.join(", ")}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f3f5f7" },
  content: { padding: 28, gap: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  eyebrow: { color: "#637083", fontSize: 14, fontWeight: "800", textTransform: "uppercase" },
  title: { color: "#121820", fontSize: 34, fontWeight: "900" },
  statBox: {
    minWidth: 112,
    borderRadius: 8,
    padding: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dde3ea",
  },
  statValue: { color: "#121820", fontSize: 28, fontWeight: "900", textAlign: "center" },
  statLabel: { color: "#637083", fontSize: 14, textAlign: "center" },
  toolbar: {
    borderRadius: 8,
    padding: 16,
    gap: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dde3ea",
  },
  input: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5df",
    paddingHorizontal: 12,
    color: "#121820",
    fontSize: 16,
    backgroundColor: "#ffffff",
  },
  categorySummary: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryPill: {
    overflow: "hidden",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "#e9edf2",
    color: "#273240",
    fontWeight: "800",
  },
  table: { gap: 10 },
  row: {
    borderRadius: 8,
    padding: 16,
    gap: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dde3ea",
  },
  mainCell: { gap: 5 },
  dishTitle: { color: "#121820", fontSize: 20, fontWeight: "900" },
  muted: { color: "#52606f", fontSize: 14, lineHeight: 20 },
  videoUrl: { color: "#2f6f8f", fontSize: 12 },
  infoCell: { flexDirection: "row", gap: 10, alignItems: "center" },
  longCell: { gap: 4 },
  label: { color: "#6b7785", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  value: { color: "#121820", fontSize: 15, fontWeight: "800" },
});

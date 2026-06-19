import { demoOrders } from "@/data/menu";
import { formatMoney } from "@/utils/money";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export function OrdersScreen() {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Заказы</Text>
        <Text style={styles.subtitle}>Мобильная страница для кухни или официанта</Text>
      </View>

      {demoOrders.map((order) => (
        <View key={order.id} style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <View>
              <Text style={styles.orderId}>#{order.id}</Text>
              <Text style={styles.table}>{order.table}</Text>
            </View>
            <Text style={styles.status}>Новый</Text>
          </View>

          {order.lines.map((line) => (
            <View key={line.id} style={styles.line}>
              <Text style={styles.lineTitle}>
                {line.quantity} x {line.dish.title}
              </Text>
              <Text style={styles.lineSub}>
                {line.selectedAddOns.length > 0
                  ? line.selectedAddOns.map((addOn) => addOn.title).join(", ")
                  : "Без допов"}
              </Text>
            </View>
          ))}

          <Text style={styles.total}>{formatMoney(order.total)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0f141a" },
  content: { padding: 16, gap: 14 },
  header: { paddingVertical: 12, gap: 4 },
  title: { color: "#ffffff", fontSize: 30, fontWeight: "900" },
  subtitle: { color: "#9daaba", fontSize: 15 },
  orderCard: {
    borderRadius: 8,
    padding: 16,
    gap: 14,
    backgroundColor: "#18212b",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  orderId: { color: "#ffffff", fontSize: 22, fontWeight: "900" },
  table: { color: "#9daaba", fontSize: 15, fontWeight: "700" },
  status: {
    overflow: "hidden",
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "#f2c14e",
    color: "#121212",
    fontWeight: "900",
  },
  line: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: 12,
    gap: 4,
  },
  lineTitle: { color: "#ffffff", fontSize: 17, fontWeight: "800" },
  lineSub: { color: "#9daaba", fontSize: 14 },
  total: { color: "#ffffff", fontSize: 22, fontWeight: "900", textAlign: "right" },
});

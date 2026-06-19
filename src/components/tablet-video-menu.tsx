import { categories, dishes } from "@/data/menu";
import { cartReducer, getCartTotal, getLineTotal, initialCartState } from "@/state/cart";
import { CartLine, Dish } from "@/types/menu";
import { formatMoney } from "@/utils/money";
import { VideoView, useVideoPlayer } from "expo-video";
import { Info, ShoppingCart, Sparkles } from "lucide-react-native";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewToken,
} from "react-native";

function DishVideo({ dish, active }: { dish: Dish; active: boolean }) {
  const player = useVideoPlayer(dish.videoUrl, (instance) => {
    instance.loop = true;
    instance.muted = true;
  });

  useEffect(() => {
    if (active) {
      player.play();
      return;
    }

    player.pause();
  }, [active, player]);

  return (
    <VideoView
      player={player}
      nativeControls={false}
      contentFit="cover"
      style={StyleSheet.absoluteFill}
    />
  );
}

export function TabletVideoMenu() {
  const { width, height } = useWindowDimensions();
  const [state, dispatch] = useReducer(cartReducer, initialCartState);
  const [categoryId, setCategoryId] = useState(categories[0].id);
  const [activeDishId, setActiveDishId] = useState(dishes[0].id);
  const [detailsDish, setDetailsDish] = useState<Dish | null>(null);
  const [pairingDish, setPairingDish] = useState<Dish | null>(null);
  const [cartVisible, setCartVisible] = useState(false);
  const [lastLineId, setLastLineId] = useState<string | null>(null);
  const listRef = useRef<FlatList<Dish>>(null);

  const visibleDishes = useMemo(
    () => dishes.filter((dish) => dish.categoryId === categoryId),
    [categoryId],
  );
  const lastLine = state.lines.find((line) => line.id === lastLineId);

  useEffect(() => {
    const newest = state.lines[state.lines.length - 1];
    if (newest) {
      setLastLineId(newest.id);
    }
  }, [state.lines]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<Dish>[] }) => {
      const firstVisible = viewableItems[0]?.item;
      if (firstVisible) {
        setActiveDishId(firstVisible.id);
      }
    },
  ).current;

  function chooseCategory(nextCategoryId: string) {
    setCategoryId(nextCategoryId);
    const firstDish = dishes.find((dish) => dish.categoryId === nextCategoryId);
    if (firstDish) {
      setActiveDishId(firstDish.id);
    }
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }

  function addDish(dish: Dish) {
    dispatch({ type: "addDish", dish });
  }

  function chooseDish(dish: Dish) {
    const index = visibleDishes.findIndex((item) => item.id === dish.id);
    if (index < 0) {
      return;
    }

    setActiveDishId(dish.id);
    listRef.current?.scrollToIndex({ index, animated: true });
  }

  return (
    <View style={styles.shell}>
      <FlatList
        ref={listRef}
        data={visibleDishes}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 70 }}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width, height }]}>
            <DishVideo dish={item} active={item.id === activeDishId} />
            <View style={styles.scrim} />

            <View style={styles.categoryRail}>
              {categories.map((category) => (
                <Pressable
                  accessibilityRole="button"
                  key={category.id}
                  onPress={() => chooseCategory(category.id)}
                  style={[
                    styles.categoryButton,
                    category.id === categoryId && styles.categoryButtonActive,
                  ]}
                >
                  <Text style={styles.categoryText}>{category.title}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.dishRail}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dishRailContent}>
                {visibleDishes.map((dish) => {
                  const active = dish.id === activeDishId;
                  return (
                    <Pressable
                      accessibilityRole="button"
                      key={dish.id}
                      onPress={() => chooseDish(dish)}
                      style={[styles.dishButton, active && styles.dishButtonActive]}
                    >
                      <Text style={[styles.dishButtonTitle, active && styles.dishButtonTitleActive]} numberOfLines={1}>
                        {dish.title}
                      </Text>
                      <Text style={[styles.dishButtonPrice, active && styles.dishButtonPriceActive]}>
                        {formatMoney(dish.price)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.dishInfo}>
              <View style={styles.priceBadge}>
                <Text style={styles.priceText}>{formatMoney(item.price)}</Text>
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.shortDescription}</Text>
            </View>

            <View style={styles.actionDock}>
              <Pressable accessibilityRole="button" onPress={() => addDish(item)} style={styles.primaryButton}>
                <View style={[styles.iconBadge, styles.primaryIconBadge]}>
                  <ShoppingCart color="#ffffff" size={18} strokeWidth={2.6} />
                </View>
                <Text style={styles.primaryButtonText}>В корзину</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => setDetailsDish(item)} style={styles.secondaryButton}>
                <View style={styles.iconBadge}>
                  <Info color="#ffffff" size={18} strokeWidth={2.5} />
                </View>
                <Text style={styles.secondaryButtonText}>Изучить</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => setPairingDish(item)} style={styles.secondaryButton}>
                <View style={styles.iconBadge}>
                  <Sparkles color="#ffffff" size={18} strokeWidth={2.4} />
                </View>
                <Text style={styles.secondaryButtonText}>Подойдет</Text>
              </Pressable>
            </View>

            <Pressable accessibilityRole="button" onPress={() => setCartVisible(true)} style={styles.cartButton}>
              <View style={styles.cartIconBadge}>
                <ShoppingCart color="#ffffff" size={18} strokeWidth={2.5} />
              </View>
              <Text style={styles.cartButtonText}>Корзина</Text>
              <Text style={styles.cartCount}>{state.lines.length}</Text>
            </Pressable>
          </View>
        )}
      />

      {lastLine ? (
        <View style={styles.addOnsBar}>
          <View style={styles.addOnsHeader}>
            <View>
              <Text style={styles.addOnsLabel}>Дополнить блюдо</Text>
              <Text style={styles.addOnsTitle}>{lastLine.dish.title}</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={() => setLastLineId(null)} style={styles.addOnsClose}>
              <Text style={styles.addOnsCloseText}>Закрыть</Text>
            </Pressable>
          </View>
          <View style={styles.addOnsBody}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.addOnsList}>
              {lastLine.dish.addOns.map((addOn) => {
                const selected = lastLine.selectedAddOns.some((item) => item.id === addOn.id);
                return (
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    key={addOn.id}
                    onPress={() => dispatch({ type: "toggleAddOn", lineId: lastLine.id, addOn })}
                    style={[styles.addOnChip, selected && styles.addOnChipActive]}
                  >
                    <Text style={styles.addOnChipText}>{addOn.title}</Text>
                    <Text style={styles.addOnChipPrice}>{formatMoney(addOn.price)}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      ) : null}

      <DishDetails dish={detailsDish} onClose={() => setDetailsDish(null)} />
      <PairingsModal dish={pairingDish} onClose={() => setPairingDish(null)} />
      <CartModal
        visible={cartVisible}
        lines={state.lines}
        onClose={() => setCartVisible(false)}
        onQuantity={(lineId, delta) => dispatch({ type: "changeQuantity", lineId, delta })}
        onSubmit={() => {
          dispatch({ type: "submitOrder", table: "Стол планшета" });
          setCartVisible(false);
          setLastLineId(null);
        }}
      />
    </View>
  );
}

function DishDetails({ dish, onClose }: { dish: Dish | null; onClose: () => void }) {
  return (
    <Modal animationType="fade" transparent visible={Boolean(dish)} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalPanel}>
          {dish ? (
            <>
              <Text style={styles.modalTitle}>{dish.title}</Text>
              <Text style={styles.modalPrice}>{formatMoney(dish.price)}</Text>
              <Text style={styles.modalText}>Состав: {dish.composition.join(", ")}</Text>
              <Text style={styles.modalText}>
                КБЖУ: {dish.nutrition.calories} ккал · Б {dish.nutrition.protein} · Ж {dish.nutrition.fat} · У{" "}
                {dish.nutrition.carbs}
              </Text>
              <Text style={styles.modalText}>{dish.story}</Text>
            </>
          ) : null}
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Закрыть</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function PairingsModal({ dish, onClose }: { dish: Dish | null; onClose: () => void }) {
  return (
    <Modal animationType="fade" transparent visible={Boolean(dish)} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalPanel}>
          <Text style={styles.modalTitle}>К этому подойдет</Text>
          {dish?.pairings.map((pairing) => (
            <Text key={pairing} style={styles.modalText}>• {pairing}</Text>
          ))}
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Закрыть</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function CartModal({
  visible,
  lines,
  onClose,
  onQuantity,
  onSubmit,
}: {
  visible: boolean;
  lines: CartLine[];
  onClose: () => void;
  onQuantity: (lineId: string, delta: number) => void;
  onSubmit: () => void;
}) {
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.cartBackdrop}>
        <View style={styles.cartPanel}>
          <Text style={styles.modalTitle}>Корзина</Text>
          <ScrollView contentContainerStyle={styles.cartList}>
            {lines.length === 0 ? (
              <Text style={styles.modalText}>Пока пусто</Text>
            ) : (
              lines.map((line) => (
                <View key={line.id} style={styles.cartLine}>
                  <View style={styles.cartLineMain}>
                    <Text style={styles.cartLineTitle}>{line.dish.title}</Text>
                    <Text style={styles.cartLineSub}>
                      {line.selectedAddOns.length > 0
                        ? line.selectedAddOns.map((addOn) => addOn.title).join(", ")
                        : "Без допов"}
                    </Text>
                    <Text style={styles.cartLinePrice}>{formatMoney(getLineTotal(line))}</Text>
                  </View>
                  <View style={styles.qtyControls}>
                    <Pressable accessibilityRole="button" onPress={() => onQuantity(line.id, -1)} style={styles.qtyButton}>
                      <Text style={styles.qtyText}>-</Text>
                    </Pressable>
                    <Text style={styles.qtyValue}>{line.quantity}</Text>
                    <Pressable accessibilityRole="button" onPress={() => onQuantity(line.id, 1)} style={styles.qtyButton}>
                      <Text style={styles.qtyText}>+</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
          <Text style={styles.total}>Итого: {formatMoney(getCartTotal(lines))}</Text>
          <View style={styles.cartActions}>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Назад</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={lines.length === 0} onPress={onSubmit} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Отправить заказ</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: "#05080d" },
  slide: { backgroundColor: "#05080d" },
  scrim: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  categoryRail: {
    position: "absolute",
    top: 26,
    left: 30,
    right: 180,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryButton: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
    paddingHorizontal: 18,
    justifyContent: "center",
    backgroundColor: "rgba(8,13,20,0.58)",
  },
  categoryButtonActive: { backgroundColor: "#f2c14e", borderColor: "#f2c14e" },
  categoryText: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
  dishRail: {
    position: "absolute",
    top: 82,
    left: 30,
    right: 210,
  },
  dishRailContent: { gap: 10, paddingRight: 12 },
  dishButton: {
    minWidth: 178,
    maxWidth: 230,
    minHeight: 58,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    justifyContent: "center",
    gap: 3,
    backgroundColor: "rgba(8,13,20,0.58)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  dishButtonActive: {
    backgroundColor: "rgba(242,193,78,0.94)",
    borderColor: "#f2c14e",
  },
  dishButtonTitle: { color: "#ffffff", fontSize: 14, fontWeight: "900" },
  dishButtonTitleActive: { color: "#141414" },
  dishButtonPrice: { color: "#cfd9e2", fontSize: 12, fontWeight: "900", fontVariant: ["tabular-nums"] },
  dishButtonPriceActive: { color: "#3a2b04" },
  dishInfo: {
    position: "absolute",
    left: 34,
    bottom: 72,
    width: "56%",
    gap: 14,
  },
  priceBadge: {
    alignSelf: "flex-start",
    borderRadius: 8,
    backgroundColor: "#f2c14e",
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  priceText: { color: "#141414", fontSize: 22, fontWeight: "900", fontVariant: ["tabular-nums"] },
  title: { color: "#ffffff", fontSize: 46, fontWeight: "900" },
  description: { color: "#e8edf3", fontSize: 20, lineHeight: 28 },
  actionDock: {
    position: "absolute",
    right: 30,
    bottom: 72,
    width: 238,
    gap: 12,
    borderRadius: 8,
    padding: 12,
    backgroundColor: "rgba(8,13,20,0.66)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 8,
    paddingHorizontal: 18,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2f8f5b",
  },
  primaryButtonText: { color: "#ffffff", fontSize: 18, fontWeight: "900" },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  secondaryButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
  iconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  primaryIconBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  cartButton: {
    position: "absolute",
    top: 26,
    right: 30,
    minHeight: 54,
    minWidth: 156,
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10,15,24,0.76)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
  },
  cartIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  cartButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
  cartCount: {
    color: "#111111",
    backgroundColor: "#f2c14e",
    minWidth: 28,
    borderRadius: 14,
    overflow: "hidden",
    textAlign: "center",
    fontWeight: "900",
  },
  addOnsBar: {
    position: "absolute",
    left: 30,
    right: 30,
    bottom: 18,
    borderRadius: 8,
    padding: 14,
    gap: 12,
    backgroundColor: "rgba(12,18,27,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  addOnsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 },
  addOnsBody: { minHeight: 58, justifyContent: "center" },
  addOnsLabel: { color: "#9fb0c0", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  addOnsTitle: { color: "#ffffff", fontSize: 17, fontWeight: "900" },
  addOnsClose: {
    minHeight: 42,
    borderRadius: 8,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  addOnsCloseText: { color: "#ffffff", fontSize: 14, fontWeight: "900" },
  addOnsList: { gap: 10 },
  addOnChip: {
    borderRadius: 8,
    minWidth: 180,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  addOnChipActive: { backgroundColor: "#2f8f5b", borderColor: "#42b574" },
  addOnChipText: { color: "#ffffff", fontSize: 15, fontWeight: "800" },
  addOnChipPrice: { color: "#d6e0ea", fontSize: 13, fontWeight: "800" },
  modalBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.62)",
    padding: 24,
  },
  modalPanel: {
    width: "92%",
    maxWidth: 720,
    borderRadius: 8,
    padding: 24,
    gap: 14,
    backgroundColor: "#111820",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  modalTitle: { color: "#ffffff", fontSize: 28, fontWeight: "900" },
  modalPrice: { color: "#f2c14e", fontSize: 22, fontWeight: "900" },
  modalText: { color: "#dce3ea", fontSize: 17, lineHeight: 25 },
  closeButton: {
    alignSelf: "flex-start",
    borderRadius: 8,
    backgroundColor: "#f2c14e",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  closeButtonText: { color: "#151515", fontSize: 16, fontWeight: "900" },
  cartBackdrop: {
    flex: 1,
    alignItems: "flex-end",
    backgroundColor: "rgba(0,0,0,0.48)",
  },
  cartPanel: {
    width: "94%",
    maxWidth: 520,
    height: "100%",
    padding: 22,
    gap: 16,
    backgroundColor: "#111820",
  },
  cartList: { gap: 12 },
  cartLine: {
    borderRadius: 8,
    padding: 14,
    gap: 12,
    backgroundColor: "#18222d",
    flexDirection: "row",
    alignItems: "center",
  },
  cartLineMain: { flex: 1, gap: 4 },
  cartLineTitle: { color: "#ffffff", fontSize: 17, fontWeight: "800" },
  cartLineSub: { color: "#9fb0c0", fontSize: 13 },
  cartLinePrice: { color: "#f2c14e", fontSize: 16, fontWeight: "900" },
  qtyControls: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  qtyText: { color: "#ffffff", fontSize: 24, fontWeight: "900" },
  qtyValue: { color: "#ffffff", minWidth: 24, textAlign: "center", fontSize: 18, fontWeight: "900" },
  total: { color: "#ffffff", fontSize: 22, fontWeight: "900" },
  cartActions: { flexDirection: "row", gap: 12 },
});

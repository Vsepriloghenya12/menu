import DishModelViewer from "@/components/dish-model-viewer";
import { useMenu } from "@/hooks/use-menu";
import { Dish } from "@/types/menu";
import { formatMoney } from "@/utils/money";
import { VideoView, useVideoPlayer } from "expo-video";
import { Box, Info, Sparkles, X } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const { categories, dishes } = useMenu();
  const { width, height } = useWindowDimensions();
  const isPortrait = height > width;
  const isPhone = Math.min(width, height) < 600;
  const isCompactLandscape = !isPortrait && height < 600;
  const isWideLandscape = !isPortrait && width >= 1000 && height >= 600;
  const edge = isPhone ? 14 : 24;
  const categoryTop = isPhone ? 12 : 22;
  const dishTop = categoryTop + (isPhone ? 48 : 58);
  const actionBottom = isPhone ? 12 : 22;
  const portraitActionHeight = isPhone ? 190 : 216;
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [activeDishId, setActiveDishId] = useState(dishes[0]?.id ?? "");
  const [detailsDish, setDetailsDish] = useState<Dish | null>(null);
  const [pairingDish, setPairingDish] = useState<Dish | null>(null);
  const [modelDish, setModelDish] = useState<Dish | null>(null);
  const listRef = useRef<FlatList<Dish>>(null);

  const visibleDishes = useMemo(
    () => dishes.filter((dish) => dish.categoryId === categoryId),
    [categoryId, dishes],
  );
  useEffect(() => {
    if (!categories.some((category) => category.id === categoryId)) {
      setCategoryId(categories[0]?.id ?? "");
    }
  }, [categories, categoryId]);

  useEffect(() => {
    if (!dishes.some((dish) => dish.id === activeDishId)) {
      const firstDish = dishes.find((dish) => dish.categoryId === categoryId) ?? dishes[0];
      setActiveDishId(firstDish?.id ?? "");
    }
  }, [activeDishId, categoryId, dishes]);

  useEffect(() => {
    const activeIndex = visibleDishes.findIndex((dish) => dish.id === activeDishId);
    if (activeIndex >= 0) {
      setTimeout(() => {
        listRef.current?.scrollToIndex({ index: activeIndex, animated: false });
      }, 0);
    }
  }, [activeDishId, visibleDishes, width]);

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

  if (dishes.length === 0) {
    return (
      <View style={styles.emptyMenu}>
        <Text style={styles.emptyMenuTitle}>Меню пока пусто</Text>
        <Text style={styles.emptyMenuText}>Добавьте блюда на странице владельца.</Text>
      </View>
    );
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

            <View style={[styles.categoryRail, { top: categoryTop, left: edge, right: edge }]}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryRailContent}
              >
                {categories.map((category) => (
                  <Pressable
                    accessibilityRole="button"
                    key={category.id}
                    onPress={() => chooseCategory(category.id)}
                    style={[
                      styles.categoryButton,
                      isPhone && styles.categoryButtonPhone,
                      category.id === categoryId && styles.categoryButtonActive,
                    ]}
                  >
                    <Text style={[styles.categoryText, isPhone && styles.categoryTextPhone]}>{category.title}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={[styles.dishRail, { top: dishTop, left: edge, right: edge }]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dishRailContent}>
                {visibleDishes.map((dish) => {
                  const active = dish.id === activeDishId;
                  return (
                    <Pressable
                      accessibilityRole="button"
                      key={dish.id}
                      onPress={() => chooseDish(dish)}
                      style={[
                        styles.dishButton,
                        isPhone && styles.dishButtonPhone,
                        active && styles.dishButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dishButtonTitle,
                          isPhone && styles.dishButtonTitlePhone,
                          active && styles.dishButtonTitleActive,
                        ]}
                        numberOfLines={1}
                      >
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

            <View
              style={[
                styles.dishInfo,
                isWideLandscape
                  ? styles.dishInfoWide
                  : isPortrait
                    ? {
                        left: edge,
                        right: edge,
                        bottom: portraitActionHeight + actionBottom + 18,
                      }
                    : {
                        left: edge,
                        width: "55%",
                        bottom: isCompactLandscape ? 92 : 54,
                      },
              ]}
            >
              <View style={[styles.priceBadge, isPhone && styles.priceBadgePhone]}>
                <Text style={[styles.priceText, isPhone && styles.priceTextPhone]}>{formatMoney(item.price)}</Text>
              </View>
              <Text
                style={[
                  styles.title,
                  isPhone ? styles.titlePhone : isPortrait || isCompactLandscape ? styles.titleCompact : null,
                ]}
                numberOfLines={2}
              >
                {item.title}
              </Text>
              <Text
                style={[styles.description, isPhone && styles.descriptionPhone]}
                numberOfLines={isPhone ? 2 : 3}
              >
                {item.shortDescription}
              </Text>
            </View>

            <View
              style={[
                styles.actionDock,
                isWideLandscape
                  ? styles.actionDockWide
                  : isPortrait
                    ? {
                        left: edge,
                        right: edge,
                        bottom: actionBottom,
                        padding: isPhone ? 8 : 10,
                      }
                    : {
                        left: edge,
                        right: edge,
                        bottom: actionBottom,
                        flexDirection: "row",
                        padding: 8,
                      },
              ]}
            >
              <Pressable
                accessibilityRole="button"
                onPress={() => setDetailsDish(item)}
                style={[styles.secondaryButton, !isWideLandscape && styles.responsiveActionButton, isPhone && styles.actionButtonPhone]}
              >
                <View style={styles.iconBadge}>
                  <Info color="#ffffff" size={18} strokeWidth={2.5} />
                </View>
                <Text style={styles.secondaryButtonText}>Изучить</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setPairingDish(item)}
                style={[styles.secondaryButton, !isWideLandscape && styles.responsiveActionButton, isPhone && styles.actionButtonPhone]}
              >
                <View style={styles.iconBadge}>
                  <Sparkles color="#ffffff" size={18} strokeWidth={2.4} />
                </View>
                <Text style={styles.secondaryButtonText}>Подойдет</Text>
              </Pressable>
              {item.id === "bruschetta" ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setModelDish(item)}
                  style={[styles.modelButton, !isWideLandscape && styles.responsiveActionButton, isPhone && styles.actionButtonPhone]}
                >
                  <View style={styles.iconBadge}>
                    <Box color="#151515" size={18} strokeWidth={2.4} />
                  </View>
                  <Text style={styles.modelButtonText}>Смотреть в 3D</Text>
                </Pressable>
              ) : null}
            </View>

          </View>
        )}
      />

      <DishDetails dish={detailsDish} onClose={() => setDetailsDish(null)} />
      <PairingsModal dish={pairingDish} onClose={() => setPairingDish(null)} />
      <ModelViewerModal dish={modelDish} onClose={() => setModelDish(null)} />
    </View>
  );
}

function DishDetails({ dish, onClose }: { dish: Dish | null; onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const compact = Math.min(width, height) < 600;
  return (
    <Modal animationType="fade" transparent visible={Boolean(dish)} onRequestClose={onClose}>
      <View style={[styles.modalBackdrop, compact && styles.modalBackdropCompact]}>
        <View style={[styles.modalPanel, compact && styles.modalPanelCompact]}>
          {dish ? (
            <>
              <Text style={[styles.modalTitle, compact && styles.modalTitleCompact]}>{dish.title}</Text>
              <Text style={[styles.modalPrice, compact && styles.modalPriceCompact]}>{formatMoney(dish.price)}</Text>
              <Text style={[styles.modalText, compact && styles.modalTextCompact]}>Состав: {dish.composition.join(", ")}</Text>
              <Text style={[styles.modalText, compact && styles.modalTextCompact]}>
                КБЖУ: {dish.nutrition.calories} ккал · Б {dish.nutrition.protein} · Ж {dish.nutrition.fat} · У{" "}
                {dish.nutrition.carbs}
              </Text>
              <Text style={[styles.modalText, compact && styles.modalTextCompact]}>{dish.story}</Text>
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
  const { width, height } = useWindowDimensions();
  const compact = Math.min(width, height) < 600;
  return (
    <Modal animationType="fade" transparent visible={Boolean(dish)} onRequestClose={onClose}>
      <View style={[styles.modalBackdrop, compact && styles.modalBackdropCompact]}>
        <View style={[styles.modalPanel, compact && styles.modalPanelCompact]}>
          <Text style={[styles.modalTitle, compact && styles.modalTitleCompact]}>К этому подойдет</Text>
          {dish && dish.pairings.length > 0 ? (
            dish.pairings.map((pairing) => (
              <Text key={pairing} style={[styles.modalText, compact && styles.modalTextCompact]}>• {pairing}</Text>
            ))
          ) : (
            <Text style={[styles.modalText, compact && styles.modalTextCompact]}>Гастрономические пары не указаны</Text>
          )}
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Закрыть</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ModelViewerModal({ dish, onClose }: { dish: Dish | null; onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const portrait = height > width;
  const phone = Math.min(width, height) < 600;
  return (
    <Modal animationType="fade" visible={Boolean(dish)} onRequestClose={onClose}>
      <View style={styles.modelViewerShell}>
        <DishModelViewer
          dom={{
            contentInsetAdjustmentBehavior: "never",
            scrollEnabled: false,
            style: { width: "100%", height: "100%" },
          }}
        />
        <View
          style={[
            styles.modelViewerHeader,
            {
              top: phone ? 12 : 22,
              left: phone ? 14 : 24,
              right: phone ? 14 : 24,
            },
            portrait && styles.modelViewerHeaderPortrait,
          ]}
        >
          <View>
            <Text style={styles.modelViewerEyebrow}>Демонстрация 3D</Text>
            <Text style={[styles.modelViewerTitle, phone && styles.modelViewerTitlePhone]} numberOfLines={1}>
              {dish?.title}
            </Text>
          </View>
          <Pressable accessibilityLabel="Закрыть 3D-просмотр" accessibilityRole="button" onPress={onClose} style={styles.modelCloseButton}>
            <X color="#ffffff" size={22} strokeWidth={2.5} />
            <Text style={styles.modelCloseText}>Закрыть</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: "#05080d" },
  emptyMenu: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#05080d",
  },
  emptyMenuTitle: { color: "#ffffff", fontSize: 28, fontWeight: "900" },
  emptyMenuText: { color: "#9fb0c0", fontSize: 16 },
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
  },
  categoryRailContent: {
    flexDirection: "row",
    gap: 10,
    paddingRight: 12,
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
  categoryButtonPhone: { minHeight: 38, paddingHorizontal: 13 },
  categoryButtonActive: { backgroundColor: "#f2c14e", borderColor: "#f2c14e" },
  categoryText: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
  categoryTextPhone: { fontSize: 14 },
  dishRail: {
    position: "absolute",
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
  dishButtonPhone: {
    minWidth: 142,
    maxWidth: 184,
    minHeight: 50,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  dishButtonActive: {
    backgroundColor: "rgba(242,193,78,0.94)",
    borderColor: "#f2c14e",
  },
  dishButtonTitle: { color: "#ffffff", fontSize: 14, fontWeight: "900" },
  dishButtonTitlePhone: { fontSize: 13 },
  dishButtonTitleActive: { color: "#141414" },
  dishButtonPrice: { color: "#cfd9e2", fontSize: 12, fontWeight: "900", fontVariant: ["tabular-nums"] },
  dishButtonPriceActive: { color: "#3a2b04" },
  dishInfo: {
    position: "absolute",
    gap: 14,
  },
  dishInfoWide: { left: 34, bottom: 72, width: "56%" },
  priceBadge: {
    alignSelf: "flex-start",
    borderRadius: 8,
    backgroundColor: "#f2c14e",
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  priceBadgePhone: { paddingHorizontal: 12, paddingVertical: 7 },
  priceText: { color: "#141414", fontSize: 22, fontWeight: "900", fontVariant: ["tabular-nums"] },
  priceTextPhone: { fontSize: 17 },
  title: { color: "#ffffff", fontSize: 46, fontWeight: "900" },
  titleCompact: { fontSize: 34, lineHeight: 39 },
  titlePhone: { fontSize: 28, lineHeight: 32 },
  description: { color: "#e8edf3", fontSize: 20, lineHeight: 28 },
  descriptionPhone: { fontSize: 15, lineHeight: 20 },
  actionDock: {
    position: "absolute",
    gap: 12,
    borderRadius: 8,
    padding: 12,
    backgroundColor: "rgba(8,13,20,0.66)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  actionDockWide: { right: 30, bottom: 72, width: 238 },
  responsiveActionButton: { flex: 1 },
  actionButtonPhone: { minHeight: 44, paddingHorizontal: 10 },
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
  modelButton: {
    minHeight: 52,
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f2c14e",
  },
  modelButtonText: { color: "#151515", fontSize: 16, fontWeight: "900" },
  iconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  modalBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.62)",
    padding: 24,
  },
  modalBackdropCompact: { padding: 12 },
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
  modalPanelCompact: { width: "100%", padding: 16, gap: 10 },
  modalTitle: { color: "#ffffff", fontSize: 28, fontWeight: "900" },
  modalTitleCompact: { fontSize: 22 },
  modalPrice: { color: "#f2c14e", fontSize: 22, fontWeight: "900" },
  modalPriceCompact: { fontSize: 18 },
  modalText: { color: "#dce3ea", fontSize: 17, lineHeight: 25 },
  modalTextCompact: { fontSize: 14, lineHeight: 20 },
  closeButton: {
    alignSelf: "flex-start",
    borderRadius: 8,
    backgroundColor: "#f2c14e",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  closeButtonText: { color: "#151515", fontSize: 16, fontWeight: "900" },
  modelViewerShell: { flex: 1, backgroundColor: "#05080d" },
  modelViewerHeader: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    pointerEvents: "box-none",
  },
  modelViewerHeaderPortrait: { alignItems: "stretch", flexDirection: "column" },
  modelViewerEyebrow: { color: "#b7c3cf", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  modelViewerTitle: { color: "#ffffff", fontSize: 26, fontWeight: "900" },
  modelViewerTitlePhone: { fontSize: 20 },
  modelCloseButton: {
    minHeight: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(5,8,13,0.82)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  modelCloseText: { color: "#ffffff", fontSize: 15, fontWeight: "900" },
});

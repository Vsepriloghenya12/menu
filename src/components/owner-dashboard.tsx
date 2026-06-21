import {
  createAddOn,
  createCategory,
  deleteAddOn,
  deleteCategory,
  deleteDish,
  getAdminMenu,
  updateAddOn,
  updateCategory,
  updateDish,
  uploadDishVideo,
} from "@/services/menu-api";
import { AddOn, Dish, MenuCategory } from "@/types/menu";
import { formatMoney } from "@/utils/money";
import { Pencil, Plus, Trash2, X } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

interface DishForm {
  categoryId: string;
  title: string;
  price: string;
  videoUrl: string;
  shortDescription: string;
  composition: string;
  calories: string;
  protein: string;
  fat: string;
  carbs: string;
  story: string;
  addOns: string[];
  pairings: string[];
}

function createForm(dish: Dish): DishForm {
  return {
    categoryId: dish.categoryId,
    title: dish.title,
    price: String(dish.price),
    videoUrl: dish.videoUrl,
    shortDescription: dish.shortDescription,
    composition: dish.composition.join(", "),
    calories: String(dish.nutrition.calories),
    protein: String(dish.nutrition.protein),
    fat: String(dish.nutrition.fat),
    carbs: String(dish.nutrition.carbs),
    story: dish.story,
    addOns: dish.addOns.map((item) => item.id),
    pairings: dish.pairings,
  };
}

function parseList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function createDish(dish: Dish, form: DishForm, addOnCatalog: AddOn[]): Dish {
  return {
    ...dish,
    categoryId: form.categoryId,
    title: form.title,
    price: Number(form.price),
    videoUrl: form.videoUrl,
    shortDescription: form.shortDescription,
    composition: parseList(form.composition),
    nutrition: {
      calories: Number(form.calories),
      protein: Number(form.protein),
      fat: Number(form.fat),
      carbs: Number(form.carbs),
    },
    story: form.story,
    addOns: addOnCatalog.filter((item) => form.addOns.includes(item.id)),
    pairings: form.pairings,
  };
}

export function OwnerDashboard() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [addOnCatalog, setAddOnCatalog] = useState<AddOn[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [form, setForm] = useState<DishForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Dish | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoUploadMessage, setVideoUploadMessage] = useState("");
  const [categoryEditorVisible, setCategoryEditorVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [categoryTitle, setCategoryTitle] = useState("");
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryDeleteTarget, setCategoryDeleteTarget] = useState<MenuCategory | null>(null);
  const [categoryDeleteStep, setCategoryDeleteStep] = useState<1 | 2>(1);
  const [categoryDeleting, setCategoryDeleting] = useState(false);
  const [addOnEditorVisible, setAddOnEditorVisible] = useState(false);
  const [editingAddOn, setEditingAddOn] = useState<AddOn | null>(null);
  const [addOnTitle, setAddOnTitle] = useState("");
  const [addOnPrice, setAddOnPrice] = useState("");
  const [addOnSaving, setAddOnSaving] = useState(false);
  const [addOnDeleteTarget, setAddOnDeleteTarget] = useState<AddOn | null>(null);
  const [addOnDeleting, setAddOnDeleting] = useState(false);

  useEffect(() => {
    getAdminMenu()
      .then((menu) => {
        setCategories(menu.categories);
        setDishes(menu.dishes);
        setAddOnCatalog(menu.addOnCatalog ?? []);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const visibleDishes = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ru");
    if (!normalizedQuery) return dishes;
    return dishes.filter((dish) =>
      `${dish.title} ${dish.shortDescription}`.toLocaleLowerCase("ru").includes(normalizedQuery),
    );
  }, [dishes, query]);

  function startEditing(dish: Dish) {
    setError("");
    setVideoUploadMessage("");
    setEditingDish(dish);
    setForm(createForm(dish));
  }

  function startDeleting(dish: Dish) {
    setError("");
    setDeleteTarget(dish);
  }

  function changeForm(field: keyof DishForm, value: string) {
    setForm((current) => (current ? { ...current, [field]: value } : current));
  }

  function togglePairing(title: string) {
    setForm((current) => {
      if (!current) return current;
      const selected = current.pairings.includes(title);
      return {
        ...current,
        pairings: selected
          ? current.pairings.filter((pairing) => pairing !== title)
          : [...current.pairings, title],
      };
    });
  }

  function toggleAddOn(id: string) {
    setForm((current) => {
      if (!current) return current;
      return {
        ...current,
        addOns: current.addOns.includes(id)
          ? current.addOns.filter((addOnId) => addOnId !== id)
          : [...current.addOns, id],
      };
    });
  }

  async function saveDish() {
    if (!editingDish || !form || saving) return;
    setSaving(true);
    setError("");
    try {
      const savedDish = await updateDish(createDish(editingDish, form, addOnCatalog));
      setDishes((current) => current.map((dish) => (dish.id === savedDish.id ? savedDish : dish)));
      setEditingDish(null);
      setForm(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось сохранить блюдо");
    } finally {
      setSaving(false);
    }
  }

  function chooseVideoFile() {
    if (!editingDish || videoUploading || typeof document === "undefined") return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setVideoUploading(true);
      setVideoUploadMessage("");
      setError("");
      try {
        const savedDish = await uploadDishVideo(editingDish.id, file);
        setEditingDish(savedDish);
        setForm(createForm(savedDish));
        setDishes((current) => current.map((dish) => (dish.id === savedDish.id ? savedDish : dish)));
        setVideoUploadMessage(`Загружено: ${file.name}`);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Не удалось загрузить видео");
      } finally {
        setVideoUploading(false);
      }
    };
    input.click();
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setError("");
    try {
      await deleteDish(deleteTarget.id);
      setDishes((current) => current.filter((dish) => dish.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось удалить блюдо");
    } finally {
      setDeleting(false);
    }
  }

  function startCategoryEditor(category?: MenuCategory) {
    setError("");
    setEditingCategory(category ?? null);
    setCategoryTitle(category?.title ?? "");
    setCategoryEditorVisible(true);
  }

  async function saveCategory() {
    if (categorySaving) return;
    setCategorySaving(true);
    setError("");
    try {
      if (editingCategory) {
        const savedCategory = await updateCategory(editingCategory.id, categoryTitle);
        setCategories((current) =>
          current.map((category) => (category.id === savedCategory.id ? savedCategory : category)),
        );
      } else {
        const savedCategory = await createCategory(categoryTitle);
        setCategories((current) => [...current, savedCategory]);
      }
      setCategoryEditorVisible(false);
      setEditingCategory(null);
      setCategoryTitle("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось сохранить группу");
    } finally {
      setCategorySaving(false);
    }
  }

  function startCategoryDelete(category: MenuCategory) {
    setError("");
    setCategoryDeleteTarget(category);
    setCategoryDeleteStep(1);
  }

  async function confirmCategoryDelete() {
    if (!categoryDeleteTarget || categoryDeleting) return;
    const dishCount = dishes.filter((dish) => dish.categoryId === categoryDeleteTarget.id).length;
    if (dishCount > 0 && categoryDeleteStep === 1) {
      setCategoryDeleteStep(2);
      return;
    }

    setCategoryDeleting(true);
    setError("");
    try {
      await deleteCategory(categoryDeleteTarget.id);
      setCategories((current) => current.filter((category) => category.id !== categoryDeleteTarget.id));
      setDishes((current) => current.filter((dish) => dish.categoryId !== categoryDeleteTarget.id));
      setCategoryDeleteTarget(null);
      setCategoryDeleteStep(1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось удалить группу");
    } finally {
      setCategoryDeleting(false);
    }
  }

  function startAddOnEditor(addOn?: AddOn) {
    setError("");
    setEditingAddOn(addOn ?? null);
    setAddOnTitle(addOn?.title ?? "");
    setAddOnPrice(addOn ? String(addOn.price) : "");
    setAddOnEditorVisible(true);
  }

  async function saveAddOn() {
    if (addOnSaving) return;
    setAddOnSaving(true);
    setError("");
    try {
      const savedAddOn = editingAddOn
        ? await updateAddOn(editingAddOn.id, addOnTitle, Number(addOnPrice))
        : await createAddOn(addOnTitle, Number(addOnPrice));
      setAddOnCatalog((current) =>
        editingAddOn
          ? current.map((item) => (item.id === savedAddOn.id ? savedAddOn : item))
          : [...current, savedAddOn],
      );
      if (editingAddOn) {
        setDishes((current) =>
          current.map((dish) => ({
            ...dish,
            addOns: dish.addOns.map((item) => (item.id === savedAddOn.id ? savedAddOn : item)),
          })),
        );
      }
      setAddOnEditorVisible(false);
      setEditingAddOn(null);
      setAddOnTitle("");
      setAddOnPrice("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось сохранить доп");
    } finally {
      setAddOnSaving(false);
    }
  }

  async function confirmAddOnDelete() {
    if (!addOnDeleteTarget || addOnDeleting) return;
    setAddOnDeleting(true);
    setError("");
    try {
      await deleteAddOn(addOnDeleteTarget.id);
      setAddOnCatalog((current) => current.filter((item) => item.id !== addOnDeleteTarget.id));
      setDishes((current) =>
        current.map((dish) => ({
          ...dish,
          addOns: dish.addOns.filter((item) => item.id !== addOnDeleteTarget.id),
        })),
      );
      setAddOnDeleteTarget(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось удалить доп");
    } finally {
      setAddOnDeleting(false);
    }
  }

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
          onChangeText={setQuery}
          placeholder="Поиск по меню"
          placeholderTextColor="#6b7785"
          style={styles.input}
          value={query}
        />
        <View style={styles.groupsHeader}>
          <View>
            <Text style={styles.groupsTitle}>Группы меню</Text>
            <Text style={styles.groupsSubtitle}>Создание, название и удаление категорий</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={() => startCategoryEditor()} style={styles.addGroupButton}>
            <Plus color="#ffffff" size={17} strokeWidth={2.5} />
            <Text style={styles.actionText}>Добавить группу</Text>
          </Pressable>
        </View>
        <View style={styles.groupList}>
          {categories.map((category) => {
            const dishCount = dishes.filter((dish) => dish.categoryId === category.id).length;
            return (
              <View key={category.id} style={styles.groupItem}>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{category.title}</Text>
                  <Text style={styles.groupCount}>{dishCount} блюд</Text>
                </View>
                <View style={styles.groupActions}>
                  <Pressable
                    accessibilityLabel={`Редактировать группу ${category.title}`}
                    accessibilityRole="button"
                    onPress={() => startCategoryEditor(category)}
                    style={styles.smallIconButton}
                  >
                    <Pencil color="#2f6f8f" size={16} strokeWidth={2.4} />
                  </Pressable>
                  <Pressable
                    accessibilityLabel={`Удалить группу ${category.title}`}
                    accessibilityRole="button"
                    onPress={() => startCategoryDelete(category)}
                    style={styles.smallDeleteButton}
                  >
                    <Trash2 color="#a93838" size={16} strokeWidth={2.4} />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
        <View style={styles.addOnSection}>
          <View style={styles.groupsHeader}>
            <View>
              <View style={styles.systemGroupTitleRow}>
                <Text style={styles.groupsTitle}>Допы</Text>
                <Text style={styles.hiddenBadge}>Скрыто из меню</Text>
              </View>
              <Text style={styles.groupsSubtitle}>Упрощённые позиции: название и цена</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={() => startAddOnEditor()} style={styles.addGroupButton}>
              <Plus color="#ffffff" size={17} strokeWidth={2.5} />
              <Text style={styles.actionText}>Добавить доп</Text>
            </Pressable>
          </View>
          <View style={styles.addOnCatalogList}>
            {addOnCatalog.map((addOn) => (
              <View key={addOn.id} style={styles.addOnCatalogItem}>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{addOn.title}</Text>
                  <Text style={styles.groupCount}>{formatMoney(addOn.price)}</Text>
                </View>
                <View style={styles.groupActions}>
                  <Pressable
                    accessibilityLabel={`Редактировать доп ${addOn.title}`}
                    accessibilityRole="button"
                    onPress={() => startAddOnEditor(addOn)}
                    style={styles.smallIconButton}
                  >
                    <Pencil color="#2f6f8f" size={16} strokeWidth={2.4} />
                  </Pressable>
                  <Pressable
                    accessibilityLabel={`Удалить доп ${addOn.title}`}
                    accessibilityRole="button"
                    onPress={() => setAddOnDeleteTarget(addOn)}
                    style={styles.smallDeleteButton}
                  >
                    <Trash2 color="#a93838" size={16} strokeWidth={2.4} />
                  </Pressable>
                </View>
              </View>
            ))}
            {addOnCatalog.length === 0 ? <Text style={styles.groupsSubtitle}>Допы пока не добавлены</Text> : null}
          </View>
        </View>
      </View>

      {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#2f6f8f" />
          <Text style={styles.muted}>Загружаем меню…</Text>
        </View>
      ) : (
        <View style={styles.table}>
          {visibleDishes.map((dish) => (
            <View key={dish.id} style={styles.row}>
              <View style={styles.mainCell}>
                <Text style={styles.dishTitle}>{dish.title}</Text>
                <Text style={styles.muted}>{dish.shortDescription}</Text>
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
                <Text style={styles.muted}>{dish.addOns.map((addOn) => addOn.title).join(", ") || "Нет"}</Text>
              </View>
              <View style={styles.longCell}>
                <Text style={styles.label}>Подойдет</Text>
                <Text style={styles.muted}>{dish.pairings.join(", ") || "Нет"}</Text>
              </View>
              <View style={styles.rowActions}>
                <Pressable accessibilityRole="button" onPress={() => startEditing(dish)} style={styles.editButton}>
                  <Pencil color="#ffffff" size={16} strokeWidth={2.4} />
                  <Text style={styles.actionText}>Редактировать</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => startDeleting(dish)} style={styles.deleteButton}>
                  <Trash2 color="#a93838" size={16} strokeWidth={2.4} />
                  <Text style={styles.deleteText}>Удалить</Text>
                </Pressable>
              </View>
            </View>
          ))}
          {visibleDishes.length === 0 ? <Text style={styles.emptyText}>Блюда не найдены</Text> : null}
        </View>
      )}

      <EditDishModal
        addOnCatalog={addOnCatalog}
        categories={categories}
        dishes={dishes}
        editingDishId={editingDish?.id ?? ""}
        error={error}
        form={form}
        saving={saving}
        videoUploading={videoUploading}
        videoUploadMessage={videoUploadMessage}
        visible={Boolean(editingDish && form)}
        onChange={changeForm}
        onClose={() => {
          if (!saving) {
            setEditingDish(null);
            setForm(null);
          }
        }}
        onSave={saveDish}
        onToggleAddOn={toggleAddOn}
        onTogglePairing={togglePairing}
        onUploadVideo={chooseVideoFile}
      />

      <DeleteDishModal
        dish={deleteTarget}
        deleting={deleting}
        error={error}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        onDelete={confirmDelete}
      />

      <CategoryEditorModal
        error={error}
        saving={categorySaving}
        title={categoryTitle}
        visible={categoryEditorVisible}
        isEditing={Boolean(editingCategory)}
        onChangeTitle={setCategoryTitle}
        onClose={() => {
          if (!categorySaving) {
            setCategoryEditorVisible(false);
            setEditingCategory(null);
            setCategoryTitle("");
          }
        }}
        onSave={saveCategory}
      />

      <DeleteCategoryModal
        category={categoryDeleteTarget}
        deleting={categoryDeleting}
        dishCount={
          categoryDeleteTarget
            ? dishes.filter((dish) => dish.categoryId === categoryDeleteTarget.id).length
            : 0
        }
        error={error}
        step={categoryDeleteStep}
        onClose={() => {
          if (!categoryDeleting) {
            setCategoryDeleteTarget(null);
            setCategoryDeleteStep(1);
          }
        }}
        onDelete={confirmCategoryDelete}
      />

      <AddOnEditorModal
        error={error}
        isEditing={Boolean(editingAddOn)}
        price={addOnPrice}
        saving={addOnSaving}
        title={addOnTitle}
        visible={addOnEditorVisible}
        onChangePrice={setAddOnPrice}
        onChangeTitle={setAddOnTitle}
        onClose={() => {
          if (!addOnSaving) {
            setAddOnEditorVisible(false);
            setEditingAddOn(null);
          }
        }}
        onSave={saveAddOn}
      />

      <DeleteAddOnModal
        addOn={addOnDeleteTarget}
        deleting={addOnDeleting}
        error={error}
        onClose={() => {
          if (!addOnDeleting) setAddOnDeleteTarget(null);
        }}
        onDelete={confirmAddOnDelete}
      />
    </ScrollView>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  multiline = false,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        style={[styles.formInput, multiline && styles.multilineInput]}
        value={value}
      />
    </View>
  );
}

function EditDishModal({
  addOnCatalog,
  categories,
  dishes,
  editingDishId,
  error,
  form,
  saving,
  videoUploading,
  videoUploadMessage,
  visible,
  onChange,
  onClose,
  onSave,
  onToggleAddOn,
  onTogglePairing,
  onUploadVideo,
}: {
  addOnCatalog: AddOn[];
  categories: MenuCategory[];
  dishes: Dish[];
  editingDishId: string;
  error: string;
  form: DishForm | null;
  saving: boolean;
  videoUploading: boolean;
  videoUploadMessage: string;
  visible: boolean;
  onChange: (field: keyof DishForm, value: string) => void;
  onClose: () => void;
  onSave: () => void;
  onToggleAddOn: (id: string) => void;
  onTogglePairing: (title: string) => void;
  onUploadVideo: () => void;
}) {
  const availableCategories = categories.filter((category) =>
    dishes.some((dish) => dish.categoryId === category.id && dish.id !== editingDishId),
  );
  const [pairingCategoryId, setPairingCategoryId] = useState("");

  useEffect(() => {
    if (!visible) return;
    const selectedCategory = availableCategories.find((category) =>
      dishes.some(
        (dish) =>
          dish.categoryId === category.id &&
          dish.id !== editingDishId &&
          form?.pairings.includes(dish.title),
      ),
    );
    setPairingCategoryId((current) =>
      availableCategories.some((category) => category.id === current)
        ? current
        : selectedCategory?.id ?? availableCategories[0]?.id ?? "",
    );
  }, [dishes, editingDishId, form?.pairings, visible]);

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.editorPanel}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalEyebrow}>Редактирование</Text>
              <Text style={styles.modalTitle}>{form?.title}</Text>
            </View>
            <Pressable accessibilityLabel="Закрыть редактор" accessibilityRole="button" onPress={onClose} style={styles.iconButton}>
              <X color="#273240" size={20} />
            </Pressable>
          </View>

          {form ? (
            <ScrollView contentContainerStyle={styles.formContent}>
              {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Категория</Text>
                <View style={styles.categorySummary}>
                  {categories.map((category) => (
                    <Pressable
                      accessibilityRole="button"
                      key={category.id}
                      onPress={() => onChange("categoryId", category.id)}
                      style={[styles.formCategory, form.categoryId === category.id && styles.formCategoryActive]}
                    >
                      <Text style={[styles.formCategoryText, form.categoryId === category.id && styles.formCategoryTextActive]}>
                        {category.title}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={styles.twoColumns}>
                <FormField label="Название" value={form.title} onChangeText={(value) => onChange("title", value)} />
                <FormField label="Цена" value={form.price} keyboardType="numeric" onChangeText={(value) => onChange("price", value)} />
              </View>
              <View style={styles.videoUploadBox}>
                <View style={styles.videoUploadInfo}>
                  <Text style={styles.fieldLabel}>Видео в хранилище приложения</Text>
                  <Text style={styles.videoUploadHint}>
                    MP4, WebM и другие видеофайлы до 500 МБ. Новое видео заменит текущее.
                  </Text>
                  {videoUploadMessage ? <Text style={styles.videoUploadSuccess}>{videoUploadMessage}</Text> : null}
                </View>
                <Pressable
                  accessibilityRole="button"
                  disabled={videoUploading}
                  onPress={onUploadVideo}
                  style={[styles.uploadButton, videoUploading && styles.disabledButton]}
                >
                  {videoUploading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.actionText}>Выбрать видео</Text>
                  )}
                </Pressable>
              </View>
              <FormField label="Краткое описание" value={form.shortDescription} multiline onChangeText={(value) => onChange("shortDescription", value)} />
              <FormField label="Состав через запятую" value={form.composition} multiline onChangeText={(value) => onChange("composition", value)} />
              <View style={styles.nutritionGrid}>
                <FormField label="Калории" value={form.calories} keyboardType="numeric" onChangeText={(value) => onChange("calories", value)} />
                <FormField label="Белки" value={form.protein} keyboardType="numeric" onChangeText={(value) => onChange("protein", value)} />
                <FormField label="Жиры" value={form.fat} keyboardType="numeric" onChangeText={(value) => onChange("fat", value)} />
                <FormField label="Углеводы" value={form.carbs} keyboardType="numeric" onChangeText={(value) => onChange("carbs", value)} />
              </View>
              <FormField label="Описание блюда" value={form.story} multiline onChangeText={(value) => onChange("story", value)} />
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Допы</Text>
                <Text style={styles.pairingHint}>Выберите позиции из служебной категории «Допы».</Text>
                <View style={styles.pairingGrid}>
                  {addOnCatalog.map((addOn) => {
                    const selected = form.addOns.includes(addOn.id);
                    return (
                      <Pressable
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: selected }}
                        key={addOn.id}
                        onPress={() => onToggleAddOn(addOn.id)}
                        style={[styles.pairingOption, selected && styles.pairingOptionSelected]}
                      >
                        <Text style={[styles.pairingOptionText, selected && styles.pairingOptionTextSelected]}>
                          {addOn.title}
                        </Text>
                        <Text style={[styles.pairingCategory, selected && styles.pairingOptionTextSelected]}>
                          {formatMoney(addOn.price)}
                        </Text>
                      </Pressable>
                    );
                  })}
                  {addOnCatalog.length === 0 ? (
                    <Text style={styles.groupsSubtitle}>Сначала добавьте позиции в категорию «Допы».</Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Гастрономические пары</Text>
                <Text style={styles.pairingHint}>Откройте категорию и выберите подходящие позиции.</Text>
                <View style={styles.pairingCategoryList}>
                  {availableCategories.map((category) => {
                    const selectedCount = dishes.filter(
                      (dish) =>
                        dish.categoryId === category.id &&
                        form.pairings.includes(dish.title),
                    ).length;
                    const active = pairingCategoryId === category.id;
                    return (
                      <Pressable
                        accessibilityRole="button"
                        key={category.id}
                        onPress={() => setPairingCategoryId(category.id)}
                        style={[styles.pairingCategoryButton, active && styles.pairingCategoryButtonActive]}
                      >
                        <Text style={[styles.pairingCategoryTitle, active && styles.pairingCategoryTitleActive]}>
                          {category.title}
                        </Text>
                        {selectedCount > 0 ? (
                          <Text style={[styles.pairingSelectedCount, active && styles.pairingSelectedCountActive]}>
                            {selectedCount}
                          </Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
                <View style={styles.pairingGrid}>
                  {dishes
                    .filter(
                      (dish) =>
                        dish.id !== editingDishId &&
                        dish.categoryId === pairingCategoryId,
                    )
                    .map((dish) => {
                      const selected = form.pairings.includes(dish.title);
                      return (
                        <Pressable
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: selected }}
                          key={dish.id}
                          onPress={() => onTogglePairing(dish.title)}
                          style={[styles.pairingOption, selected && styles.pairingOptionSelected]}
                        >
                          <Text style={[styles.pairingOptionText, selected && styles.pairingOptionTextSelected]}>
                            {dish.title}
                          </Text>
                        </Pressable>
                      );
                    })}
                </View>
              </View>
            </ScrollView>
          ) : null}

          <View style={styles.modalActions}>
            <Pressable accessibilityRole="button" disabled={saving} onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Отмена</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={saving} onPress={onSave} style={[styles.saveButton, saving && styles.disabledButton]}>
              {saving ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.actionText}>Сохранить</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DeleteDishModal({
  dish,
  deleting,
  error,
  onClose,
  onDelete,
}: {
  dish: Dish | null;
  deleting: boolean;
  error: string;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <Modal animationType="fade" transparent visible={Boolean(dish)} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.confirmPanel}>
          <Text style={styles.modalEyebrow}>Подтверждение</Text>
          <Text style={styles.confirmTitle}>Удалить «{dish?.title}»?</Text>
          <Text style={styles.muted}>Блюдо сразу исчезнет из пользовательского меню.</Text>
          {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
          <View style={styles.modalActions}>
            <Pressable accessibilityRole="button" disabled={deleting} onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Отмена</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={deleting} onPress={onDelete} style={[styles.dangerButton, deleting && styles.disabledButton]}>
              {deleting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.actionText}>Удалить блюдо</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function CategoryEditorModal({
  error,
  saving,
  title,
  visible,
  isEditing,
  onChangeTitle,
  onClose,
  onSave,
}: {
  error: string;
  saving: boolean;
  title: string;
  visible: boolean;
  isEditing: boolean;
  onChangeTitle: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.confirmPanel}>
          <Text style={styles.modalEyebrow}>{isEditing ? "Редактирование группы" : "Новая группа"}</Text>
          <Text style={styles.confirmTitle}>{isEditing ? "Изменить название" : "Добавить группу меню"}</Text>
          <FormField label="Название группы" value={title} onChangeText={onChangeTitle} />
          {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
          <View style={styles.modalActionsCompact}>
            <Pressable accessibilityRole="button" disabled={saving} onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Отмена</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={saving} onPress={onSave} style={[styles.saveButton, saving && styles.disabledButton]}>
              {saving ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.actionText}>Сохранить</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DeleteCategoryModal({
  category,
  deleting,
  dishCount,
  error,
  step,
  onClose,
  onDelete,
}: {
  category: MenuCategory | null;
  deleting: boolean;
  dishCount: number;
  error: string;
  step: 1 | 2;
  onClose: () => void;
  onDelete: () => void;
}) {
  const hasDishes = dishCount > 0;
  const finalStep = !hasDishes || step === 2;

  return (
    <Modal animationType="fade" transparent visible={Boolean(category)} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.confirmPanel}>
          <Text style={styles.modalEyebrow}>{finalStep ? "Финальное подтверждение" : "Предупреждение"}</Text>
          <Text style={styles.confirmTitle}>Удалить группу «{category?.title}»?</Text>
          {hasDishes ? (
            <Text style={styles.dangerNotice}>
              В группе {dishCount} блюд. Они будут удалены вместе с группой и сразу исчезнут из меню.
            </Text>
          ) : (
            <Text style={styles.muted}>Группа пустая и будет сразу удалена из меню.</Text>
          )}
          {hasDishes && step === 2 ? (
            <Text style={styles.finalWarning}>Это действие нельзя отменить. Подтвердите удаление ещё раз.</Text>
          ) : null}
          {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
          <View style={styles.modalActionsCompact}>
            <Pressable accessibilityRole="button" disabled={deleting} onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Отмена</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={deleting} onPress={onDelete} style={[styles.dangerButton, deleting && styles.disabledButton]}>
              {deleting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.actionText}>
                  {hasDishes && step === 1 ? "Продолжить" : hasDishes ? `Удалить группу и ${dishCount} блюд` : "Удалить группу"}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function AddOnEditorModal({
  error,
  isEditing,
  price,
  saving,
  title,
  visible,
  onChangePrice,
  onChangeTitle,
  onClose,
  onSave,
}: {
  error: string;
  isEditing: boolean;
  price: string;
  saving: boolean;
  title: string;
  visible: boolean;
  onChangePrice: (value: string) => void;
  onChangeTitle: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.confirmPanel}>
          <Text style={styles.modalEyebrow}>{isEditing ? "Редактирование допа" : "Новый доп"}</Text>
          <Text style={styles.confirmTitle}>{isEditing ? "Изменить позицию" : "Добавить позицию в «Допы»"}</Text>
          <FormField label="Название" value={title} onChangeText={onChangeTitle} />
          <FormField label="Цена" value={price} keyboardType="numeric" onChangeText={onChangePrice} />
          {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
          <View style={styles.modalActionsCompact}>
            <Pressable accessibilityRole="button" disabled={saving} onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Отмена</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={saving} onPress={onSave} style={[styles.saveButton, saving && styles.disabledButton]}>
              {saving ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.actionText}>Сохранить</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DeleteAddOnModal({
  addOn,
  deleting,
  error,
  onClose,
  onDelete,
}: {
  addOn: AddOn | null;
  deleting: boolean;
  error: string;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <Modal animationType="fade" transparent visible={Boolean(addOn)} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.confirmPanel}>
          <Text style={styles.modalEyebrow}>Подтверждение</Text>
          <Text style={styles.confirmTitle}>Удалить доп «{addOn?.title}»?</Text>
          <Text style={styles.muted}>Он также исчезнет из всех блюд, где был выбран.</Text>
          {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
          <View style={styles.modalActionsCompact}>
            <Pressable accessibilityRole="button" disabled={deleting} onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Отмена</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={deleting} onPress={onDelete} style={[styles.dangerButton, deleting && styles.disabledButton]}>
              {deleting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.actionText}>Удалить доп</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
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
  groupsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  groupsTitle: { color: "#121820", fontSize: 17, fontWeight: "900" },
  groupsSubtitle: { color: "#637083", fontSize: 13, marginTop: 2 },
  addGroupButton: {
    minHeight: 42,
    borderRadius: 8,
    paddingHorizontal: 14,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2f8f5b",
  },
  groupList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  groupItem: {
    minWidth: 190,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "#e9edf2",
    borderWidth: 1,
    borderColor: "#d8dfe6",
  },
  groupInfo: { flex: 1 },
  groupName: { color: "#273240", fontSize: 14, fontWeight: "900" },
  groupCount: { color: "#6b7785", fontSize: 12, marginTop: 2 },
  groupActions: { flexDirection: "row", gap: 6 },
  smallIconButton: {
    width: 34,
    height: 34,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  smallDeleteButton: {
    width: 34,
    height: 34,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff4f4",
    borderWidth: 1,
    borderColor: "#e8bcbc",
  },
  addOnSection: {
    borderTopWidth: 1,
    borderTopColor: "#dde3ea",
    paddingTop: 14,
    gap: 12,
  },
  systemGroupTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  hiddenBadge: {
    overflow: "hidden",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: "#6b7785",
    backgroundColor: "#e9edf2",
    fontSize: 11,
    fontWeight: "900",
  },
  addOnCatalogList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  addOnCatalogItem: {
    minWidth: 190,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "#fff8e7",
    borderWidth: 1,
    borderColor: "#ead9a9",
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
  infoCell: { flexDirection: "row", gap: 10, alignItems: "center" },
  longCell: { gap: 4 },
  label: { color: "#6b7785", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  value: { color: "#121820", fontSize: 15, fontWeight: "800" },
  rowActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
  editButton: {
    minHeight: 42,
    borderRadius: 8,
    paddingHorizontal: 14,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2f6f8f",
  },
  deleteButton: {
    minHeight: 42,
    borderRadius: 8,
    paddingHorizontal: 14,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff4f4",
    borderWidth: 1,
    borderColor: "#e8bcbc",
  },
  actionText: { color: "#ffffff", fontSize: 14, fontWeight: "900" },
  deleteText: { color: "#a93838", fontSize: 14, fontWeight: "900" },
  loading: { minHeight: 120, alignItems: "center", justifyContent: "center", gap: 10 },
  errorBanner: {
    color: "#8d2424",
    backgroundColor: "#fff0f0",
    borderWidth: 1,
    borderColor: "#efc3c3",
    borderRadius: 8,
    padding: 12,
    fontWeight: "800",
  },
  emptyText: { color: "#637083", textAlign: "center", padding: 24 },
  modalBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(17,24,32,0.62)",
  },
  editorPanel: {
    width: "100%",
    maxWidth: 900,
    maxHeight: "94%",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d7dee6",
    overflow: "hidden",
  },
  confirmPanel: {
    width: "100%",
    maxWidth: 480,
    borderRadius: 10,
    padding: 22,
    gap: 14,
    backgroundColor: "#ffffff",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e6eb",
  },
  modalEyebrow: { color: "#637083", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  modalTitle: { color: "#121820", fontSize: 24, fontWeight: "900" },
  confirmTitle: { color: "#121820", fontSize: 23, fontWeight: "900" },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eef1f4",
  },
  formContent: { padding: 20, gap: 16 },
  field: { flex: 1, gap: 7 },
  fieldLabel: { color: "#536170", fontSize: 13, fontWeight: "900" },
  formInput: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5df",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#121820",
    fontSize: 15,
    backgroundColor: "#ffffff",
  },
  multilineInput: { minHeight: 86, textAlignVertical: "top" },
  videoUploadBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5df",
    padding: 14,
    backgroundColor: "#f7f9fb",
  },
  videoUploadInfo: { flex: 1, gap: 4 },
  videoUploadHint: { color: "#637083", fontSize: 13, lineHeight: 18 },
  videoUploadSuccess: { color: "#277a4e", fontSize: 13, fontWeight: "900" },
  uploadButton: {
    minWidth: 150,
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: "#2f6f8f",
  },
  pairingHint: { color: "#637083", fontSize: 13, lineHeight: 18 },
  pairingCategoryList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pairingCategoryButton: {
    minHeight: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5df",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#eef1f4",
  },
  pairingCategoryButtonActive: { backgroundColor: "#273240", borderColor: "#273240" },
  pairingCategoryTitle: { color: "#273240", fontSize: 14, fontWeight: "900" },
  pairingCategoryTitleActive: { color: "#ffffff" },
  pairingSelectedCount: {
    minWidth: 24,
    borderRadius: 12,
    overflow: "hidden",
    paddingHorizontal: 6,
    color: "#ffffff",
    backgroundColor: "#2f8f5b",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "900",
  },
  pairingSelectedCountActive: { color: "#273240", backgroundColor: "#f2c14e" },
  pairingGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pairingOption: {
    minWidth: 180,
    maxWidth: 260,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5df",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 3,
    backgroundColor: "#ffffff",
  },
  pairingOptionSelected: { backgroundColor: "#2f6f8f", borderColor: "#2f6f8f" },
  pairingOptionText: { color: "#273240", fontSize: 14, fontWeight: "900" },
  pairingOptionTextSelected: { color: "#ffffff" },
  pairingCategory: { color: "#6b7785", fontSize: 12 },
  twoColumns: { flexDirection: "row", gap: 14 },
  nutritionGrid: { flexDirection: "row", gap: 12 },
  formCategory: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5df",
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "#ffffff",
  },
  formCategoryActive: { backgroundColor: "#2f6f8f", borderColor: "#2f6f8f" },
  formCategoryText: { color: "#273240", fontWeight: "800" },
  formCategoryTextActive: { color: "#ffffff" },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    padding: 18,
    borderTopWidth: 1,
    borderTopColor: "#e1e6eb",
  },
  modalActionsCompact: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 4,
  },
  dangerNotice: {
    color: "#8d2424",
    backgroundColor: "#fff0f0",
    borderWidth: 1,
    borderColor: "#efc3c3",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
  },
  finalWarning: { color: "#8d2424", fontSize: 14, lineHeight: 20, fontWeight: "900" },
  cancelButton: {
    minWidth: 110,
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: "#eef1f4",
  },
  cancelText: { color: "#273240", fontWeight: "900" },
  saveButton: {
    minWidth: 130,
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    backgroundColor: "#2f8f5b",
  },
  dangerButton: {
    minWidth: 160,
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    backgroundColor: "#b63d3d",
  },
  disabledButton: { opacity: 0.62 },
});

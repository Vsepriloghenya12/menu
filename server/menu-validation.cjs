function validateDish(value, expectedId) {
  const fields = {};

  if (!value || typeof value !== "object") {
    return { fields: { dish: "Передайте данные блюда" } };
  }

  if (value.id !== expectedId) fields.id = "Идентификатор блюда нельзя изменить";
  if (!value.title?.trim()) fields.title = "Укажите название";
  if (!value.categoryId?.trim()) fields.categoryId = "Выберите категорию";
  if (!Number.isFinite(value.price) || value.price < 0) fields.price = "Укажите корректную цену";
  if (!value.videoUrl?.trim()) fields.videoUrl = "Укажите ссылку на видео";
  if (!value.shortDescription?.trim()) fields.shortDescription = "Добавьте краткое описание";
  if (!Array.isArray(value.composition)) fields.composition = "Укажите состав";
  if (!value.nutrition || ["calories", "protein", "fat", "carbs"].some((key) => !Number.isFinite(value.nutrition[key]) || value.nutrition[key] < 0)) {
    fields.nutrition = "Укажите корректные КБЖУ";
  }
  if (typeof value.story !== "string") fields.story = "Добавьте описание блюда";
  if (
    !Array.isArray(value.addOns) ||
    value.addOns.some(
      (item) =>
        !item ||
        typeof item.id !== "string" ||
        !String(item.title).trim() ||
        !Number.isFinite(item.price) ||
        item.price < 0,
    )
  ) {
    fields.addOns = "Проверьте дополнительные опции";
  }
  if (!Array.isArray(value.pairings)) fields.pairings = "Проверьте сочетания";

  if (Object.keys(fields).length > 0) {
    return { fields };
  }

  return {
    dish: {
      ...value,
      title: value.title.trim(),
      categoryId: value.categoryId.trim(),
      videoUrl: value.videoUrl.trim(),
      shortDescription: value.shortDescription.trim(),
      story: value.story.trim(),
      composition: value.composition.map((item) => String(item).trim()).filter(Boolean),
      pairings: value.pairings.map((item) => String(item).trim()).filter(Boolean),
      addOns: value.addOns.map((item) => ({
        id: String(item.id),
        title: String(item.title).trim(),
        price: Number(item.price),
      })),
    },
  };
}

function validateCategory(value) {
  if (!value?.title?.trim()) {
    return { fields: { title: "Укажите название группы" } };
  }

  return { title: value.title.trim() };
}

function validateAddOn(value) {
  const fields = {};
  if (!value?.title?.trim()) fields.title = "Укажите название допа";
  if (!Number.isFinite(value?.price) || value.price < 0) fields.price = "Укажите корректную цену";
  return Object.keys(fields).length > 0
    ? { fields }
    : { addOn: { title: value.title.trim(), price: value.price } };
}

module.exports = { validateAddOn, validateCategory, validateDish };

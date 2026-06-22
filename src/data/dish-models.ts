export const dishModelIds = {
  bruschetta: true,
  "shrimp-pasta": true,
  fondant: true,
} as const;

export type DishModelId = keyof typeof dishModelIds;

export function hasDishModel(dishId: string): dishId is DishModelId {
  return dishId in dishModelIds;
}

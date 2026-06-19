export interface MenuCategory {
  id: string;
  title: string;
}

export interface Nutrition {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface AddOn {
  id: string;
  title: string;
  price: number;
}

export interface Dish {
  id: string;
  categoryId: string;
  title: string;
  price: number;
  videoUrl: string;
  shortDescription: string;
  composition: string[];
  nutrition: Nutrition;
  story: string;
  addOns: AddOn[];
  pairings: string[];
}

export interface CartLine {
  id: string;
  dish: Dish;
  quantity: number;
  selectedAddOns: AddOn[];
}

export interface Order {
  id: string;
  table: string;
  status: "new" | "cooking" | "ready";
  createdAt: string;
  lines: CartLine[];
  total: number;
}

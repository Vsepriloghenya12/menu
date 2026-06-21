import { AddOn, Dish, MenuCategory } from "@/types/menu";
import { Platform } from "react-native";

export interface MenuPayload {
  categories: MenuCategory[];
  dishes: Dish[];
  addOnCatalog: AddOn[];
}

export async function createAddOn(title: string, price: number): Promise<AddOn> {
  const response = await fetch(`${getApiBaseUrl()}/api/admin/add-ons`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title, price }),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json();
}

export async function updateAddOn(id: string, title: string, price: number): Promise<AddOn> {
  const response = await fetch(`${getApiBaseUrl()}/api/admin/add-ons/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title, price }),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json();
}

export async function deleteAddOn(id: string): Promise<void> {
  const response = await fetch(`${getApiBaseUrl()}/api/admin/add-ons/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error(await parseError(response));
}

function getApiBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");
  if (configured) {
    return configured;
  }

  if (Platform.OS === "web" && typeof window !== "undefined") {
    if (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost") {
      return window.location.port === "3001" ? "" : "http://127.0.0.1:3001";
    }
    return "";
  }

  return "";
}

async function parseError(response: Response) {
  const fallback = "Не удалось выполнить операцию";
  try {
    const body = await response.json();
    return body.message || fallback;
  } catch {
    return fallback;
  }
}

export async function getMenu(): Promise<MenuPayload> {
  const response = await fetch(`${getApiBaseUrl()}/api/menu`);
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function getAdminMenu(): Promise<MenuPayload> {
  const response = await fetch(`${getApiBaseUrl()}/api/admin/menu`);
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function createCategory(title: string): Promise<MenuCategory> {
  const response = await fetch(`${getApiBaseUrl()}/api/admin/categories`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function updateCategory(id: string, title: string): Promise<MenuCategory> {
  const response = await fetch(`${getApiBaseUrl()}/api/admin/categories/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function deleteCategory(id: string): Promise<{ deletedDishCount: number }> {
  const response = await fetch(`${getApiBaseUrl()}/api/admin/categories/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function updateDish(dish: Dish): Promise<Dish> {
  const response = await fetch(`${getApiBaseUrl()}/api/admin/dishes/${encodeURIComponent(dish.id)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(dish),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function deleteDish(id: string): Promise<void> {
  const response = await fetch(`${getApiBaseUrl()}/api/admin/dishes/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
}

export async function uploadDishVideo(id: string, file: File): Promise<Dish> {
  const form = new FormData();
  form.append("video", file);
  const response = await fetch(`${getApiBaseUrl()}/api/admin/dishes/${encodeURIComponent(id)}/video`, {
    method: "POST",
    body: form,
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

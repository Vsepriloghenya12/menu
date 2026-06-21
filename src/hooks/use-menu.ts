import { categories as fallbackCategories, dishes as fallbackDishes } from "@/data/menu";
import { getMenu } from "@/services/menu-api";
import { useEffect, useState } from "react";

export function useMenu() {
  const [categories, setCategories] = useState(fallbackCategories);
  const [dishes, setDishes] = useState(fallbackDishes);

  useEffect(() => {
    let active = true;
    function refreshMenu() {
      getMenu()
        .then((menu) => {
          if (!active) return;
          setCategories(menu.categories);
          setDishes(menu.dishes);
        })
        .catch(() => {
          // The bundled menu remains available when the API cannot be reached.
        });
    }

    refreshMenu();
    const interval = setInterval(refreshMenu, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return { categories, dishes };
}

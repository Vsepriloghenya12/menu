import { AddOn, CartLine, Dish, Order } from "@/types/menu";

export interface CartState {
  lines: CartLine[];
  orders: Order[];
}

export type CartAction =
  | { type: "addDish"; dish: Dish }
  | { type: "toggleAddOn"; lineId: string; addOn: AddOn }
  | { type: "changeQuantity"; lineId: string; delta: number }
  | { type: "clear" }
  | { type: "submitOrder"; table: string };

export const initialCartState: CartState = {
  lines: [],
  orders: [],
};

export function getLineTotal(line: CartLine) {
  const addOnsTotal = line.selectedAddOns.reduce((sum, addOn) => sum + addOn.price, 0);
  return (line.dish.price + addOnsTotal) * line.quantity;
}

export function getCartTotal(lines: CartLine[]) {
  return lines.reduce((sum, line) => sum + getLineTotal(line), 0);
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "addDish":
      return {
        ...state,
        lines: [
          ...state.lines,
          {
            id: `${action.dish.id}-${Date.now()}`,
            dish: action.dish,
            quantity: 1,
            selectedAddOns: [],
          },
        ],
      };
    case "toggleAddOn":
      return {
        ...state,
        lines: state.lines.map((line) => {
          if (line.id !== action.lineId) {
            return line;
          }

          const selected = line.selectedAddOns.some((item) => item.id === action.addOn.id);
          return {
            ...line,
            selectedAddOns: selected
              ? line.selectedAddOns.filter((item) => item.id !== action.addOn.id)
              : [...line.selectedAddOns, action.addOn],
          };
        }),
      };
    case "changeQuantity":
      return {
        ...state,
        lines: state.lines
          .map((line) =>
            line.id === action.lineId
              ? { ...line, quantity: Math.max(0, line.quantity + action.delta) }
              : line,
          )
          .filter((line) => line.quantity > 0),
      };
    case "clear":
      return { ...state, lines: [] };
    case "submitOrder": {
      if (state.lines.length === 0) {
        return state;
      }

      const order: Order = {
        id: `A-${Math.floor(100 + Math.random() * 900)}`,
        table: action.table,
        status: "new",
        createdAt: new Date().toISOString(),
        lines: state.lines,
        total: getCartTotal(state.lines),
      };

      return {
        lines: [],
        orders: [order, ...state.orders],
      };
    }
    default:
      return state;
  }
}

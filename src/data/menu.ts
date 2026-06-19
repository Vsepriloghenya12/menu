import { Dish, MenuCategory, Order } from "@/types/menu";

export const categories: MenuCategory[] = [
  { id: "starters", title: "Закуски" },
  { id: "hot", title: "Горячее" },
  { id: "desserts", title: "Десерты" },
  { id: "drinks", title: "Напитки" },
];

export const dishes: Dish[] = [
  {
    id: "bruschetta",
    categoryId: "starters",
    title: "Брускетта с томатами",
    price: 520,
    videoUrl: "https://videos.pexels.com/video-files/3195650/3195650-uhd_2560_1440_25fps.mp4",
    shortDescription: "Хрустящий хлеб, томаты, базилик и оливковое масло.",
    composition: ["чиабатта", "томаты", "базилик", "оливковое масло", "пармезан"],
    nutrition: { calories: 310, protein: 9, fat: 15, carbs: 34 },
    story: "Легкая закуска перед основным блюдом, хорошо работает с белым вином.",
    addOns: [
      { id: "extra-cheese", title: "Больше пармезана", price: 90 },
      { id: "prosciutto", title: "Прошутто", price: 180 },
    ],
    pairings: ["Лимонад базилик", "Паста с креветками"],
  },
  {
    id: "shrimp-pasta",
    categoryId: "hot",
    title: "Паста с креветками",
    price: 890,
    videoUrl: "https://videos.pexels.com/video-files/4253329/4253329-uhd_2560_1440_25fps.mp4",
    shortDescription: "Паста в сливочном соусе с креветками и чесноком.",
    composition: ["лингвини", "креветки", "сливки", "чеснок", "петрушка"],
    nutrition: { calories: 640, protein: 32, fat: 28, carbs: 62 },
    story: "Сытное горячее блюдо с мягким сливочным вкусом и морским акцентом.",
    addOns: [
      { id: "extra-shrimp", title: "Дополнительные креветки", price: 260 },
      { id: "chili", title: "Острый чили", price: 60 },
    ],
    pairings: ["Брускетта с томатами", "Белое сухое вино"],
  },
  {
    id: "steak",
    categoryId: "hot",
    title: "Стейк с овощами",
    price: 1450,
    videoUrl: "https://videos.pexels.com/video-files/3209828/3209828-uhd_2560_1440_25fps.mp4",
    shortDescription: "Говяжий стейк, овощи гриль и перечный соус.",
    composition: ["говядина", "цукини", "перец", "соус демиглас", "розмарин"],
    nutrition: { calories: 720, protein: 48, fat: 44, carbs: 26 },
    story: "Главное блюдо для гостей, которые хотят плотный ужин.",
    addOns: [
      { id: "pepper-sauce", title: "Перечный соус", price: 120 },
      { id: "potato", title: "Картофельное пюре", price: 160 },
    ],
    pairings: ["Красное вино", "Шоколадный фондан"],
  },
  {
    id: "fondant",
    categoryId: "desserts",
    title: "Шоколадный фондан",
    price: 560,
    videoUrl: "https://videos.pexels.com/video-files/3992584/3992584-uhd_2560_1440_25fps.mp4",
    shortDescription: "Теплый шоколадный десерт с жидкой серединой.",
    composition: ["темный шоколад", "масло", "яйцо", "мука", "ваниль"],
    nutrition: { calories: 430, protein: 7, fat: 25, carbs: 45 },
    story: "Финальный сладкий акцент, готовится под заказ.",
    addOns: [
      { id: "ice-cream", title: "Шарик мороженого", price: 140 },
      { id: "berries", title: "Свежие ягоды", price: 180 },
    ],
    pairings: ["Эспрессо", "Капучино"],
  },
  {
    id: "lemonade",
    categoryId: "drinks",
    title: "Лимонад базилик",
    price: 390,
    videoUrl: "https://videos.pexels.com/video-files/3196344/3196344-uhd_2560_1440_25fps.mp4",
    shortDescription: "Домашний лимонад с лимоном, лаймом и базиликом.",
    composition: ["лимон", "лайм", "базилик", "содовая", "сироп"],
    nutrition: { calories: 120, protein: 0, fat: 0, carbs: 29 },
    story: "Освежающий напиток к закускам и пасте.",
    addOns: [
      { id: "less-sugar", title: "Меньше сахара", price: 0 },
      { id: "mint", title: "Мята", price: 50 },
    ],
    pairings: ["Брускетта с томатами", "Паста с креветками"],
  },
];

export const demoOrders: Order[] = [
  {
    id: "A-104",
    table: "Стол 7",
    status: "new",
    createdAt: new Date().toISOString(),
    lines: [
      {
        id: "line-demo-1",
        dish: dishes[1],
        quantity: 2,
        selectedAddOns: [dishes[1].addOns[0]],
      },
      {
        id: "line-demo-2",
        dish: dishes[4],
        quantity: 2,
        selectedAddOns: [],
      },
    ],
    total: 2690,
  },
];

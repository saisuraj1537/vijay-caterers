export const counters = [

  {
    title: 'Non Veg Snacks',
    categories: [
      "Chicken Snacks",
      "Prawn Snacks",
      "Egg Snacks",
      "Mutton Snacks"
    ]
    ,
  },
  {
    title: 'Main Veg Course',
    categories: [
      "Sweets",
      "Welcome Drinks",
      "Veg Snacks",
      "Hots",
      "Rotis",
      "Veg Soups",
      "Kurma Curries",
      "Special Gravy Curries",
      "Special Rice Items",
      "Veg Dum Biryanis",
      "Dal Items",
      "Veg Fry Items",
      "Semi Liquids",
      "Grinding Chutneys",
      "Avakayalu",
      "Powders",
      "Curd",
      "Papad",
      "Salads"
    ]

  },
  {
    title: 'Main Non-Veg Course',
    categories: [
      "Non Veg Soups",
      "Non Veg Biryanis",
      "Chicken Curries",
      "Mutton Curries",
      "Egg Items",
      "Prawn Items",
      "Crab Items",
      "Sea Foods",
      "Fish Fry"
    ]

  }, {
    title: 'Counter 1',
    categories: [
      "Chat Items",
      "Chinese List",
      "Italian Snacks",
      "South Indian Tiffins",
      "Fruits",
      "Ice Creams",
      "Pan",
      "Soda",
      "Mocktails"
    ]
    ,
  },
  {
    title: 'Custom Items',
    categories: ['customItems']
  }
];


export const CATEGORY_ORDER = [
  "Sweets", "Welcome Drinks",
  "Veg Snacks",
  "Hots",
  "Rotis",
  "Veg Soups",
  "Kurma Curries",
  "Special Gravy Curries",
  "Special Rice Items",
  "Veg Dum Biryanis",
  "Dal Items",
  "Veg Fry Items",
  "Semi Liquids",
  "Grinding Chutneys",
  "Avakayalu",
  "Powders",
  "Curd",
  "Papad",
  "Salads",
  "Chat Items",
  "Chinese List",
  "Italian Snacks",
  "South Indian Tiffins",
  "Fruits",
  "Ice Creams",
  "Pan",
  "Soda",
  "Mocktails", "Non Veg Soups",
  "Chicken Snacks",
  "Prawn Snacks",
  "Egg Snacks",
  "Mutton Snacks",
  "Non Veg Biryanis",
  "Chicken Curries",
  "Mutton Curries",
  "Egg Items",
  "Prawn Items",
  "Crab Items",
  "Sea Foods",
  "Fish Fry", 'customItems'
];


export const vegCategoryGroups = [
  ["Sweets", "Welcome Drinks"],
  ["Veg Snacks", "Hots", "Rotis"],
  ["Kurma Curries", "Special Gravy Curries", "Special Rice Items", "Veg Dum Biryanis", "Dal Items", "Veg Fry Items"],
  ["Semi Liquids", "Grinding Chutneys", "Avakayalu", "Powders", "Curd", "Papad", "Salads"],
  ["Chat Items", "Chinese List", "Italian Snacks", "South Indian Tiffins", "Fruits", "Ice Creams", "Pan", "Soda", "Mocktails"]
]
  ;

export const nonVegCategoryGroups = [
  ["Non Veg Soups"],
  ["Chicken Snacks", "Prawn Snacks", "Egg Snacks", "Mutton Snacks"],
  ["Non Veg Biryanis", "Chicken Curries", "Mutton Curries", "Egg Items", "Prawns Items", "Crab Items", "Sea Foods", "Fish Fry"]
]
  ;

export const getImageBase64 = async (url) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to Base64:', error);
    return null; // Return null or a placeholder if conversion fails
  }
};
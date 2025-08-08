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

// Helper function to extract English category names from category groups
export const getEnglishCategoryNames = () => {
  const englishNames = [];

  // Extract from veg category groups
  vegCategoryGroups.forEach(group => {
    group.forEach(cat => {
      englishNames.push(cat.en);
    });
  });

  // Extract from non-veg category groups
  nonVegCategoryGroups.forEach(group => {
    group.forEach(cat => {
      englishNames.push(cat.en);
    });
  });

  return englishNames;
};

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
  [
    { en: "Sweets", te: "స్వీట్‌లు" },
    { en: "Welcome Drinks", te: "వెల్‌కమ్ డ్రింక్స్" }
  ],
  [
    { en: "Veg Snacks", te: "వెజ్ స్నాక్స్" },
    { en: "Hots", te: "హాట్స్" },
    { en: "Rotis", te: "రొటీలు" }
  ],
  [
    { en: "Kurma Curries", te: "కుర్మా కర్రీలు" },
    { en: "Special Gravy Curries", te: "స్పెషల్ గ్రేవీ కర్రీలు" },
    { en: "Special Rice Items", te: "స్పెషల్ రైస్ ఐటమ్స్" },
    { en: "Veg Dum Biryanis", te: "వెజ్ దమ్ బిర్యానీలు" },
    { en: "Dal Items", te: "దాల్ ఐటమ్స్" },
    { en: "Veg Fry Items", te: "వెజ్ ఫ్రై ఐటమ్స్" }
  ],
  [
    { en: "Semi Liquids", te: "సెమీ లిక్విడ్స్" },
    { en: "Grinding Chutneys", te: "గ్రైండింగ్ చట్నీలు" },
    { en: "Avakayalu", te: "అవకాయలు" },
    { en: "Powders", te: "పౌడర్లు" },
    { en: "Curd", te: "కర్డ్" },
    { en: "Papad", te: "పాపడ్" },
    { en: "Salads", te: "సలాడ్స్" }
  ],
  [
    { en: "Chat Items", te: "చాట్ ఐటమ్స్" },
    { en: "Chinese List", te: "చైనీస్ లిస్ట్" },
    { en: "Italian Snacks", te: "ఇటాలియన్ స్నాక్స్" },
    { en: "South Indian Tiffins", te: "సౌత్ ఇండియన్ టిఫిన్స్" },
    { en: "Fruits", te: "ఫ్రూట్స్" },
    { en: "Ice Creams", te: "ఐస్ క్రీమ్స్" },
    { en: "Pan", te: "పాన్" },
    { en: "Soda", te: "సోడా" },
    { en: "Mocktails", te: "మాక్‌టైల్స్" }
  ]
];

export const nonVegCategoryGroups = [
  [
    { en: "Non Veg Soups", te: "నాన్ వెజ్ సూప్స్" }
  ],
  [
    { en: "Chicken Snacks", te: "చికెన్ స్నాక్స్" },
    { en: "Prawn Snacks", te: "ప్రాన్ స్నాక్స్" },
    { en: "Egg Snacks", te: "ఎగ్ స్నాక్స్" },
    { en: "Mutton Snacks", te: "మటన్ స్నాక్స్" }
  ],
  [
    { en: "Non Veg Biryanis", te: "నాన్ వెజ్ బిర్యానీస్" },
    { en: "Chicken Curries", te: "చికెన్ కర్రీలు" },
    { en: "Mutton Curries", te: "మటన్ కర్రీలు" },
    { en: "Egg Items", te: "ఎగ్ ఐటమ్స్" },
    { en: "Prawn Items", te: "ప్రాన్ ఐటమ్స్" },
    { en: "Crab Items", te: "క్రాబ్ ఐటమ్స్" },
    { en: "Sea Foods", te: "సీ ఫుడ్స్" },
    { en: "Fish Fry", te: "ఫిష్ ఫ్రై" }
  ]
];


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
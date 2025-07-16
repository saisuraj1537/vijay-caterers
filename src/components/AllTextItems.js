export const counters = [
  
  {
    title: 'Non Veg Snacks',
    categories: ['chickenSnacks', 'prawnSnacks', 'eggSnacks', 'muttonSnacks'],
  },
  {
    title: 'Main Veg Course',
    categories: [
      'sweets', 'juices',
      'vegSnacks', 'hots', 'rotis','vegSoups',
      'kurmaCurries', 'specialGravyCurries', 'specialRiceItems', 'vegDumBiryanis',
      'dalItems', 'vegFryItems',
      'liquidItems', 'rotiChutneys','avakayalu', 'powders', 'curds', 'papads','salads'
    ]
  },
  {
    title: 'Main Non-Veg Course',
    categories: ['nonVegSoups', 'nonVegBiryanis', 'chickenCurries', 'muttonCurries', 'eggItems', 'prawnItems', 'crabItems', 'seaFoods', 'fishFry']
  },{
    title: 'Counter 1',
    categories: ['chatItems', 'chineseList', 'italianSnacks', 'southIndianTiffins', 'fruits', 'iceCreams', 'pan', 'soda','mocktails'],
  },
  {
    title:'Custom Items',
    categories:['customItems']
  }
];


export const CATEGORY_ORDER = [
     'sweets', 'juices', 'vegSnacks', 'hots', 'rotis','vegSoups',
    'kurmaCurries', 'specialGravyCurries', 'specialRiceItems', 'vegDumBiryanis',
    'dalItems', 'vegFryItems', 'liquidItems', 'rotiChutneys',
    'avakayalu', 'powders', 'curds', 'papads','salads', 'chatItems', 'chineseList',
    'italianSnacks', 'southIndianTiffins', 'fruits', 'iceCreams','pan','soda','mocktails','nonVegSoups',
    'chickenSnacks', 'prawnSnacks', 'eggSnacks','muttonSnacks','nonVegBiryanis', 'chickenCurries', 
    'muttonCurries', 'eggItems', 'prawnItems',
    'crabItems','seaFoods','fishFry', 'customItems'
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
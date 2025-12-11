class WordDatabase {
  constructor() {
    // Word list with hints
    this.words = 
    [
      {
        word: "ELEPHANT",
        hints: [
          "It's a large mammal",
          "It has a trunk",
          "It's found in Africa and Asia",
          "It's gray in color",
          "It has big ears"
        ]
      },
      {
        word: "COMPUTER",
        hints: [
          "It's an electronic device",
          "You use it to browse the internet",
          "It has a keyboard and screen",
          "It processes data",
          "It runs software"
        ]
      },
      {
        word: "MOUNTAIN",
        hints: [
          "It's a natural landform",
          "It's very tall",
          "People climb it",
          "It's made of rock",
          "It's higher than a hill"
        ]
      },
      {
        word: "OCEAN",
        hints: [
          "It's a large body of water",
          "It's saltwater",
          "It covers most of Earth",
          "It's home to many creatures",
          "It has waves"
        ]
      },
      {
        word: "LIBRARY",
        hints: [
          "It's a place with books",
          "People go there to read",
          "It's usually quiet",
          "It has many shelves",
          "You can borrow books from here"
        ]
      },
      {
        word: "BUTTERFLY",
        hints: [
          "It's an insect",
          "It has colorful wings",
          "It starts as a caterpillar",
          "It flies from flower to flower",
          "It's very delicate"
        ]
      },
      {
        word: "TELEPHONE",
        hints: [
          "It's a communication device",
          "You use it to call people",
          "It has numbers on it",
          "It can be mobile or landline",
          "It rings when someone calls"
        ]
      },
      {
        word: "GARDEN",
        hints: [
          "It's an outdoor space",
          "People grow plants here",
          "It can have flowers or vegetables",
          "It needs water and sunlight",
          "It's a peaceful place"
        ]
      },
      {
        word: "KEYBOARD",
        hints: [
          "It's an input device",
          "It has letters and numbers",
          "You type on it",
          "It's used with computers",
          "It has QWERTY layout"
        ]
      },
      {
        word: "RAINBOW",
        hints: [
          "It appears in the sky",
          "It has many colors",
          "It appears after rain",
          "It's an arc shape",
          "It has red, orange, yellow, green, blue, indigo, violet"
        ]
      },
      {
        word: "TREASURE",
        hints: [
          "It's valuable",
          "Pirates search for it",
          "It's often hidden",
          "It can be gold or jewels",
          "It's in a chest"
        ]
      },
      {
        word: "VOLCANO",
        hints: [
          "It's a mountain",
          "It can erupt",
          "It spews lava",
          "It's very hot",
          "It's dangerous when active"
        ]
      },
      {
        word: "TELESCOPE",
        hints: [
          "It's used to look at stars",
          "It makes distant things appear closer",
          "Astronomers use it",
          "It has lenses",
          "It's pointed at the sky"
        ]
      },
      {
        word: "ADVENTURE",
        hints: [
          "It's an exciting experience",
          "It involves exploring",
          "It can be dangerous",
          "It's thrilling",
          "People seek it out"
        ]
      },
      {
        word: "MYSTERY",
        hints: [
          "It's something unknown",
          "Detectives solve it",
          "It's puzzling",
          "It needs investigation",
          "It's secretive"
        ]
      },
      {
        "word": "ASTRONAUT",
        "hints": [
          "They travel to space",
          "They wear a special suit",
          "They float in zero gravity",
          "They work on spacecraft",
          "They orbit Earth"
        ]
      },
      {
        "word": "PIZZA",
        "hints": [
          "It's a popular food",
          "It’s round and flat",
          "It has cheese and toppings",
          "It’s baked in an oven",
          "It’s sliced before eating"
        ]
      },
      {
        "word": "RIVER",
        "hints": [
          "It's a natural water flow",
          "It moves from high to low ground",
          "It leads to oceans or lakes",
          "It has a current",
          "Boats can travel on it"
        ]
      },
      {
        "word": "CAMERA",
        "hints": [
          "It's used to take photos",
          "It captures moments",
          "It can be digital or film",
          "It has a lens",
          "It can record videos too"
        ]
      },
      {
        "word": "SPACESHIP",
        "hints": [
          "It travels beyond Earth",
          "It carries astronauts",
          "It launches from rockets",
          "It’s used in space missions",
          "It floats in space"
        ]
      },
      {
        "word": "ISLAND",
        "hints": [
          "It’s land surrounded by water",
          "Some are tropical",
          "People take vacations there",
          "It can be big or small",
          "It’s separated from continents"
        ]
      },
      {
        "word": "CLOCK",
        "hints": [
          "It tells time",
          "It has numbers",
          "It can be digital or analog",
          "It ticks every second",
          "It hangs on walls or sits on desks"
        ]
      },
      {
        "word": "BANANA",
        "hints": [
          "It’s a fruit",
          "Monkeys like it",
          "It’s yellow when ripe",
          "It has a peel",
          "It grows in bunches"
        ]
      },
      {
        "word": "CASTLE",
        "hints": [
          "It’s a large building",
          "Kings and queens lived there",
          "It has towers",
          "It’s made of stone",
          "It’s historical and grand"
        ]
      },
      {
        "word": "ROBOT",
        "hints": [
          "It can move or perform tasks",
          "It’s made of metal or circuits",
          "It can be programmed",
          "It may look like a human",
          "It's used in factories"
        ]
      },
      {
        "word": "JUNGLE",
        "hints": [
          "It’s a dense forest",
          "It’s hot and humid",
          "Many animals live there",
          "It has thick vegetation",
          "Explorers travel through it"
        ]
      },
      {
        "word": "HELICOPTER",
        "hints": [
          "It flies in the air",
          "It has rotating blades",
          "It can hover",
          "It’s used for rescue missions",
          "It lands vertically"
        ]
      },
      {
        "word": "DIAMOND",
        "hints": [
          "It’s very valuable",
          "It’s a gemstone",
          "It’s extremely hard",
          "It’s often in jewelry",
          "It sparkles brightly"
        ]
      },
      {
        "word": "NOTEBOOK",
        "hints": [
          "You write in it",
          "It has many pages",
          "It can be lined or blank",
          "Students use it",
          "It’s used for notes"
        ]
      },
      {
        "word": "FIREPLACE",
        "hints": [
          "It’s found in homes",
          "It provides warmth",
          "It burns wood",
          "It has a chimney",
          "People sit around it in winter"
        ]
      }
    ];
  }

  getRandomWord() {
    const randomIndex = Math.floor(Math.random() * this.words.length);
    return this.words[randomIndex];
  }

  getWordByIndex(index) {
    return this.words[index % this.words.length];
  }
}

module.exports = { WordDatabase };



class WordDatabase {
  constructor() {
    // Word list with hints
    this.words = [
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



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
          "It's gray in color"
        ]
      },
      {
        word: "COMPUTER",
        hints: [
          "It's an electronic device",
          "You use it to browse the internet",
          "It has a keyboard and screen",
          "It processes data"
        ]
      },
      {
        word: "MOUNTAIN",
        hints: [
          "It's a natural landform",
          "It's very tall",
          "People climb it",
          "It's made of rock"
        ]
      },
      {
        word: "OCEAN",
        hints: [
          "It's a large body of water",
          "It's saltwater",
          "It covers most of Earth",
          "It's home to many creatures"
        ]
      },
      {
        word: "LIBRARY",
        hints: [
          "It's a place with books",
          "People go there to read",
          "It's usually quiet",
          "It has many shelves"
        ]
      },
      {
        word: "BUTTERFLY",
        hints: [
          "It's an insect",
          "It has colorful wings",
          "It starts as a caterpillar",
          "It flies from flower to flower"
        ]
      },
      {
        word: "TELEPHONE",
        hints: [
          "It's a communication device",
          "You use it to call people",
          "It has numbers on it",
          "It can be mobile or landline"
        ]
      },
      {
        word: "GARDEN",
        hints: [
          "It's an outdoor space",
          "People grow plants here",
          "It can have flowers or vegetables",
          "It needs water and sunlight"
        ]
      },
      {
        word: "KEYBOARD",
        hints: [
          "It's an input device",
          "It has letters and numbers",
          "You type on it",
          "It's used with computers"
        ]
      },
      {
        word: "RAINBOW",
        hints: [
          "It appears in the sky",
          "It has many colors",
          "It appears after rain",
          "It's an arc shape"
        ]
      },
      {
        word: "TREASURE",
        hints: [
          "It's valuable",
          "Pirates search for it",
          "It's often hidden",
          "It can be gold or jewels"
        ]
      },
      {
        word: "VOLCANO",
        hints: [
          "It's a mountain",
          "It can erupt",
          "It spews lava",
          "It's very hot"
        ]
      },
      {
        word: "TELESCOPE",
        hints: [
          "It's used to look at stars",
          "It makes distant things appear closer",
          "Astronomers use it",
          "It has lenses"
        ]
      },
      {
        word: "ADVENTURE",
        hints: [
          "It's an exciting experience",
          "It involves exploring",
          "It can be dangerous",
          "It's thrilling"
        ]
      },
      {
        word: "MYSTERY",
        hints: [
          "It's something unknown",
          "Detectives solve it",
          "It's puzzling",
          "It needs investigation"
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



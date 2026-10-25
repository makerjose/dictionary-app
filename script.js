
const API_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/";

const searchForm = document.getElementById("searchForm");
const wordInput = document.getElementById("wordInput");
const results = document.getElementById("results");
const message = document.getElementById("message");
const favoriteBtn = document.getElementById("favoriteBtn");
const favoritesList = document.getElementById("favoritesList");
const themeToggle = document.getElementById("themeToggle");

let currentWord = "";
let favorites = [];

try {
  const saved = JSON.parse(
    localStorage.getItem("wordlyFavorites") || "[]"
  );
  favorites = Array.isArray(saved) ? saved : [];
} catch {
  favorites = [];
}

// Search form event listener
searchForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const word = wordInput.value.trim();

  if (!word) {
    showMessage("Please enter a word.", true);
    results.hidden = true;
    return;
  }

  searchWord(word);
});

// Fetch word data from the API
async function searchWord(word) {
  showMessage("Searching...");
  results.hidden = true;
  currentWord = "";

  try {
    const response = await fetch(
      API_URL + encodeURIComponent(word)
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Word not found. Try another word.");
      }
      throw new Error("Unable to retrieve the word.");
    }

    const data = await response.json();

    if (!Array.isArray(data) || !data.length) {
      throw new Error("No dictionary entry was returned.");
    }

    displayWord(data[0]);
    showMessage("");
  } catch (error) {
    showMessage(error.message, true);
  }
}

// Display dictionary results
function displayWord(data) {
  results.hidden = false;

  currentWord = data.word;

  document.getElementById("wordTitle").textContent =
    data.word;

  const phonetic =
    data.phonetic ||
    data.phonetics?.find(item => item.text)?.text ||
    "Pronunciation text unavailable";

  document.getElementById("phonetic").textContent =
    phonetic;

  displayAudio(data.phonetics || []);
  displayDefinitions(data.meanings || []);
  displaySynonyms(data.meanings || []);
  displaySources(data.sourceUrls || []);
  updateFavoriteButton();
}

// Audio pronunciation
function displayAudio(phonetics) {
  const container =
    document.getElementById("audioContainer");

  container.replaceChildren();

  const audioEntry = phonetics.find(item => item.audio);

  if (!audioEntry) {
    container.textContent =
      "Audio pronunciation unavailable.";
    return;
  }

  const audio = document.createElement("audio");
  audio.controls = true;
  audio.preload = "none";
  audio.src = audioEntry.audio;

  container.appendChild(audio);
}

// Definitions and example sentences
function displayDefinitions(meanings) {
  const container =
    document.getElementById("definitions");

  container.replaceChildren();

  if (!meanings.length) {
    container.textContent = "No definitions available.";
    return;
  }

  meanings.forEach(meaning => {
    const heading = document.createElement("h4");
    heading.textContent =
      meaning.partOfSpeech || "Unknown part of speech";

    container.appendChild(heading);

    (meaning.definitions || []).forEach((item, index) => {
      const div = document.createElement("div");
      div.className = "definition";

      const paragraph = document.createElement("p");
      paragraph.textContent =
        `${index + 1}. ${item.definition}`;

      div.appendChild(paragraph);

      if (item.example) {
        const example = document.createElement("p");
        example.className = "example";
        example.textContent = `Example: "${item.example}"`;
        div.appendChild(example);
      }

      container.appendChild(div);
    });
  });
}

// Display synonyms
function displaySynonyms(meanings) {
  const container = document.getElementById("synonyms");
  container.replaceChildren();

  const synonyms = new Set();

  meanings.forEach(meaning => {
    (meaning.synonyms || []).forEach(word =>
      synonyms.add(word)
    );

    (meaning.definitions || []).forEach(definition => {
      (definition.synonyms || []).forEach(word =>
        synonyms.add(word)
      );
    });
  });

  if (synonyms.size === 0) {
    container.textContent = "No synonyms available.";
    return;
  }

  [...synonyms].slice(0, 20).forEach(word => {
    const button = document.createElement("button");
    button.className = "synonym";
    button.type = "button";
    button.textContent = word;

    button.addEventListener("click", () => {
      wordInput.value = word;
      searchWord(word);
    });

    container.appendChild(button);
  });
}

// Display API sources
function displaySources(urls) {
  const container = document.getElementById("sources");
  container.replaceChildren();

  if (!urls.length) {
    container.textContent = "No sources available.";
    return;
  }

  urls.forEach(url => {
    try {
      const parsed = new URL(url);

      if (!["https:", "http:"].includes(parsed.protocol)) {
        return;
      }

      const link = document.createElement("a");
      link.href = parsed.href;
      link.textContent = parsed.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      const paragraph = document.createElement("p");
      paragraph.appendChild(link);
      container.appendChild(paragraph);
    } catch {
      // Ignore invalid source URLs.
    }
  });

  if (!container.children.length) {
    container.textContent = "No valid sources available.";
  }
}

// Show status and error messages
function showMessage(text, isError = false) {
  message.textContent = text;
  message.className = isError ? "error" : "";
}

// Save or remove favorites
favoriteBtn.addEventListener("click", () => {
  if (!currentWord) return;

  const word = currentWord.toLowerCase();
  const index = favorites.indexOf(word);

  if (index === -1) {
    favorites.push(word);
  } else {
    favorites.splice(index, 1);
  }

  saveFavorites();
  updateFavoriteButton();
  displayFavorites();
});

function saveFavorites() {
  try {
    localStorage.setItem(
      "wordlyFavorites",
      JSON.stringify(favorites)
    );
  } catch {
    showMessage(
      "Unable to save favorites in this browser.",
      true
    );
  }
}

function updateFavoriteButton() {
  const isSaved = favorites.includes(
    currentWord.toLowerCase()
  );

  favoriteBtn.textContent = isSaved
    ? "Remove Favorite"
    : "Save Word";

  favoriteBtn.classList.toggle("saved", isSaved);
}

// Render favorite words
function displayFavorites() {
  favoritesList.replaceChildren();

  if (!favorites.length) {
    const item = document.createElement("li");
    item.textContent = "No favorite words saved yet.";
    favoritesList.appendChild(item);
    return;
  }

  favorites.forEach(word => {
    const item = document.createElement("li");

    const wordButton = document.createElement("button");
    wordButton.className = "favorite-word";
    wordButton.textContent = word;

    wordButton.addEventListener("click", () => {
      wordInput.value = word;
      searchWord(word);
    });

    const removeButton = document.createElement("button");
    removeButton.className = "remove-btn";
    removeButton.textContent = "Remove";
    removeButton.setAttribute(
      "aria-label",
      `Remove ${word} from favorites`
    );

    removeButton.addEventListener("click", () => {
      favorites = favorites.filter(item => item !== word);
      saveFavorites();
      displayFavorites();
      if (currentWord.toLowerCase() === word) {
        updateFavoriteButton();
      }
    });

    item.append(wordButton, removeButton);
    favoritesList.appendChild(item);
  });
}

// Dark mode functionality
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  const darkMode =
    document.body.classList.contains("dark");

  themeToggle.textContent = darkMode
    ? "Light Mode"
    : "Dark Mode";

  try {
    localStorage.setItem(
      "wordlyTheme",
      darkMode ? "dark" : "light"
    );
  } catch {
    // Theme still works for the current session.
  }
});

// Restore saved theme
try {
  if (localStorage.getItem("wordlyTheme") === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "Light Mode";
  }
} catch {
  // Continue with the default theme.
}

// Initialize favorites
displayFavorites();

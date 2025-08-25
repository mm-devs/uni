// --- Suite Mnemonica (ordre fixe des 52 cartes) ---
const mnemonica = [
  "4C","2H","7D","3C","4H","6D","AS","5H","9S","2S","QH","3D","QC",
  "8H","6S","5S","9H","KC","2D","JH","3S","8S","6H","10C","5D",
  "KD","2C","3H","8D","5C","KS","JD","8C","10S","KH","JC","7S",
  "10H","AD","4S","7H","4D","AC","9C","JS","QD","7C","QS","10D",
  "6C","AH","9D"
];

// --- Préchargement des cartes ---
function preloadCards() {
  mnemonica.forEach(cardCode => {
    const img = new Image();
    img.src = `images/${cardCode}.svg`;
  });
}
window.addEventListener("load", preloadCards);

// --- Fonctions utilitaires pour générer des valeurs aléatoires ---
function getRandomCard() {
  const suits = ["S","H","D","C"];
  const values = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
  const value = values[Math.floor(Math.random() * values.length)];
  const suit = suits[Math.floor(Math.random() * suits.length)];
  return value + suit; 
}
function getRandomNumber() {
  return Math.floor(Math.random() * 52) + 1;
}

// --- Récupération des éléments HTML ---
const cardDisplay = document.getElementById("cardDisplay");
const numberDisplay = document.getElementById("numberDisplay");
const changeCardBtn = document.getElementById("changeCardBtn");
const changeNumberBtn = document.getElementById("changeNumberBtn");
const showProbabilityBtn = document.getElementById("showProbabilityBtn");
const probabilityDisplay = document.getElementById("probabilityDisplay");

// --- Variables de contrôle ---
let pendingReveal = null;
let lastCard = null;
let lastNumber = null;
let neutralMode = false;
let idleTimer = null;

// --- Réinitialisation du timer d'inactivité ---
function resetIdleTimer() {
  neutralMode = false;
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    neutralMode = true;
  }, 3000);
}

// --- Vérifier cohérence carte ↔ numéro ---
function isCoherent() {
  if (lastCard === null || lastNumber === null) return false;
  return mnemonica[lastNumber - 1] === lastCard;
}

// --- Vérifier si carte et nombre sont en miroir ---
function isMirror() {
  if (lastCard === null || lastNumber === null) return false;
  return mnemonica[53 - lastNumber - 1] === lastCard;
}

// --- Fonctions de synchronisation (affichent uniquement l’élément cliqué) ---
function syncCardWithNumber() {
  const cardCode = mnemonica[lastNumber - 1];
  cardDisplay.src = `images/${cardCode}.svg`;
  lastCard = cardCode;
}
function syncNumberWithCard() {
  const index = mnemonica.indexOf(lastCard);
  numberDisplay.textContent = index + 1;
  lastNumber = index + 1;
}

// --- Masquer la probabilité quand on change carte/nombre ---
function hideProbability() {
  probabilityDisplay.classList.remove("visible");
  probabilityDisplay.classList.add("hidden");
}

// --- Gestion des clics sur la carte ---
cardDisplay.addEventListener("click", () => {
  hideProbability();

  if (neutralMode || pendingReveal === "card") {
    // Premier clic après 3s ou après avoir cliqué l'autre élément
    if (isCoherent()) {
      // Cohérent → valeur miroir (de la carte)
      const mirrorIndex = 53 - lastNumber;
      lastCard = mnemonica[mirrorIndex - 1];
      cardDisplay.src = `images/${lastCard}.svg`;
    } else if (isMirror()) {
      // Déjà en miroir → remettre cohérence (carte = carte à la position du nombre)
      syncCardWithNumber();
    } else {
      // Ni cohérent ni miroir → s’aligner sur le nombre
      syncCardWithNumber();
    }
    pendingReveal = "number";
    neutralMode = false;
  } else {
    // Clics répétés (moins de 3s, même élément) → aléatoire
    const newCard = getRandomCard();
    cardDisplay.src = `images/${newCard}.svg`;
    lastCard = newCard;
    pendingReveal = "number";
  }
  resetIdleTimer();
});

// --- Gestion des clics sur le nombre ---
numberDisplay.addEventListener("click", () => {
  hideProbability();

  if (neutralMode || pendingReveal === "number") {
    // Premier clic après 3s ou après avoir cliqué l'autre élément
    if (isCoherent()) {
      // Cohérent → valeur miroir (du nombre)
      const mirrorNumber = 53 - lastNumber;
      lastNumber = mirrorNumber;
      numberDisplay.textContent = lastNumber;
    } else if (isMirror()) {
      // Déjà en miroir → remettre cohérence (nombre = position réelle de la carte)
      lastNumber = mnemonica.indexOf(lastCard) + 1;
      numberDisplay.textContent = lastNumber;
    } else {
      // Ni cohérent ni miroir → s’aligner sur la carte
      lastNumber = mnemonica.indexOf(lastCard) + 1;
      numberDisplay.textContent = lastNumber;
    }
    pendingReveal = "card";
    neutralMode = false;
  } else {
    // Clics répétés (moins de 3s, même élément) → aléatoire
    const newNumber = getRandomNumber();
    numberDisplay.textContent = newNumber;
    lastNumber = newNumber;
    pendingReveal = "card";
  }
  resetIdleTimer();
});

// --- Boutons supplémentaires (déclenchent les mêmes comportements) ---
changeCardBtn.addEventListener("click", () => cardDisplay.click());
changeNumberBtn.addEventListener("click", () => numberDisplay.click());

// --- Initialisation : As de pique (AS) et numéro 52 ---
lastCard = "AS";
lastNumber = 52;
cardDisplay.src = `images/${lastCard}.svg`;
numberDisplay.textContent = lastNumber;
resetIdleTimer();

// --- Bouton "Afficher la probabilité" ---
function calculateProbability() {
  if (!lastCard || !lastNumber) return null;

  const suit = lastCard.slice(-1);
  const indexCard = mnemonica.indexOf(lastCard) + 1;
  let stat = 0;

  // 2) Cohérent
  if (mnemonica[lastNumber - 1] === lastCard) {
    stat = (lastNumber + 11) * 0.0001;

  // 3) Miroir
  } else if (mnemonica[53 - lastNumber - 1] === lastCard) {
    stat = indexCard * 0.0001 + 0.01;

  // 1) Aucun rapport
  } else {
    let Y = 0;
    if (suit === "H") Y = 0.0049;    // cœur
    else if (suit === "S") Y = 0.0039; // pique
    else if (suit === "C") Y = 0.0029; // trèfle
    else if (suit === "D") Y = 0.0019; // carreau
    stat = lastNumber * indexCard * Y + 1;
  }

  return stat.toFixed(4);
}

showProbabilityBtn.addEventListener("click", () => {
  const stat = calculateProbability();
  if (stat !== null) {
    probabilityDisplay.textContent =
      "Bien que toutes les combinaisons ont la même probabilité de sortir lors d'un tirage à l'aveugle, " +
      stat +
      "% des sondés ont nommé cette combinaison.";
    probabilityDisplay.classList.add("visible");
    probabilityDisplay.classList.remove("hidden");
  }
});

// --- Réduction de la bannière au scroll ---
window.addEventListener("scroll", () => {
  const header = document.querySelector("header");
  // seuil volontairement un peu plus élevé pour éviter les micro-bugs sur mobile
  header.classList.toggle("shrink", window.scrollY > 80);
});
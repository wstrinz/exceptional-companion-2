function findElementByXPath(expression, text) {
  return document.evaluate(
    `${expression}[text()='${text}']`,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue;
}

function goBranch(branchId) {
  let branch = document.querySelector(
    `div[data-branch-id="${branchId}"] button.button--go`
  );
  if (branch) {
    document
      .querySelector(`div[data-branch-id="${branchId}"] button.button--go`)
      .click();
    return true;
  } else {
    return false;
  }
}

function getTimeUntilNextCard() {
  let time = document.querySelector("div.deck-info__timer > span").innerText;

  if (time) {
    // time looks like "Next in 3:46". We want to return the number of seconds until the next card
    let minutes = parseInt(time.split(" ")[2].split(":")[0]);
    let seconds = parseInt(time.split(" ")[2].split(":")[1]);
    return (minutes * 60 + seconds) * 1000;
  }
}

async function drawCard() {
  while (true) {
    if (document.querySelector(".deck--empty")) {
      console.log("Deck is empty, waiting until next card...");
      break;
    }

    // Check if the element with the "card card--empty" class is present
    const emptyCardElement = document.querySelector(".card.card--empty");
    if (emptyCardElement) {
      // If the empty card element is found, click on the element with the ".deck" selector
      // console.log(
      //   'Found empty card element, clicking on element with ".deck" selector...'
      // );
      document.querySelector(".deck").click();
      await new Promise((resolve) => setTimeout(resolve, 1000));

      break;
    } else {
      // If the element is not found, log a message and wait 30 seconds before trying again
      console.log("Empty card element not found, trying again in 3 seconds...");
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

async function watchForElement(querySelector) {
  while (true) {
    const element = document.querySelector(querySelector);
    if (element) {
      element.click();
      break;
    } else {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}

async function watchForAndClickXpathButton(text) {
  while (true) {
    const element = findElementByXPath("//button", text);
    if (element) {
      element.click();
      break;
    } else {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}

async function waitUntilNextCard() {
  let lastTime;
  let timeUntilNextCard = getTimeUntilNextCard();
  console.log(
    `Waiting until next card... ${Math.round(
      timeUntilNextCard / 60000
    )} minutes left`
  );

  while (true) {
    if (
      document.querySelector(".deck-info__cards-in-deck").innerText !=
      "No cards waiting."
    ) {
      console.log("Card showed up, ending early!");
      break;
    }

    timeUntilNextCard = getTimeUntilNextCard();
    if (!lastTime || timeUntilNextCard < lastTime) {
      lastTime = timeUntilNextCard;

      let nextTimeout = timeUntilNextCard / 2;

      if (nextTimeout < 30000) {
        nextTimeout = 30000;
      }

      await new Promise((resolve) => setTimeout(resolve, nextTimeout));
    } else {
      break;
    }
  }
}

function firstDiscardableCard() {
  return Array.from(document.querySelectorAll(".hand__card-container")).filter(
    (card) => {
      // Check if the card is not in the array of reserved event IDs
      let isReservedEvent = [19455].includes(
        card.getAttribute("data-event-id")
      );

      const reservedRegexes = [
        /cheesemonger/i,
        /a visit/i,
        /whisper/i,
        /game/i,
        /mole/i,
        /you know her/i,
      ];
      let matchesRegex = reservedRegexes.find((regex) =>
        card
          .querySelector('[role="button"]')
          .getAttribute("aria-label")
          .match(regex)
      );

      return !(isReservedEvent || matchesRegex);
    }
  )[0];
}

async function cardWatchLoop(cardDefinitions) {
  while (true) {
    // Look for the first element with a data attribute matching one of the specified event IDs
    let foundCard;
    for (const event of cardDefinitions) {
      let element = document.querySelector(
        `[data-event-id="${event.eventId}"] > div > div > div`
      );
      if (element) {
        console.log(
          `Found element with data-event-id "${event.eventId}", clicking on it...`
        );
        foundCard = event;
        break;
      }
    }

    // If an element is found, click on it
    if (foundCard) {
      document
        .querySelector(
          `[data-event-id="${foundCard.eventId}"] > div > div > div`
        )
        .click();

      // Wait for the "play" button to appear and click it
      await watchForAndClickXpathButton("play");

      // Wait for the element with the matching branchId to appear and click it
      console.log(`Waiting for branch with ID ${foundCard.branchId}...`);
      await watchForElement(`[data-branch-id="${foundCard.branchId}"]`);
      goBranch(foundCard.branchId);

      // Wait for the "onwards" button to appear and click it
      await watchForAndClickXpathButton("Onwards");
    } else if (document.querySelector(".deck--empty")) {
      await waitUntilNextCard();

      // console.log("Done waiting");
    } else {
      // Check if the element with the "card card--empty" class is present
      const emptyCardElement = document.querySelector(".card.card--empty");
      if (emptyCardElement) {
        await drawCard();
      } else {
        // Discard the first card, unless its event ID is 19455
        let firstDiscardable = firstDiscardableCard();

        if (firstDiscardable) {
          const label = firstDiscardable
            .querySelector('[role="button"]')
            .getAttribute("aria-label");

          console.log(`Discarding ${label}`);
          firstDiscardable.querySelector("button").click();
        } else {
          console.log("Only undiscardable cards left 😥");
        }
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

function startCardLoop() {
  // Start the loop, passing in the list of event IDs as a parameter
  cardWatchLoop([
    { eventId: 11209, branchId: 6144 }, // Afternoon of good deeds
    { eventId: 22413, branchId: 10521 }, // Temptation of money
    { eventId: 11211, branchId: 6714 }, // Restorative
    { eventId: 10135, branchId: 206992 }, // Bohemians
    { eventId: 10147, branchId: 204817 }, // Great Game
  ]);
}

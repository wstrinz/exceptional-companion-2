// ==UserScript==
// @name        Exceptional Companion
// @namespace   Violentmonkey Scripts
// @match       https://www.fallenlondon.com/
// @grant       none
// @version     1.0
// @author      -
// @description 12/31/2022, 1:23:13 PM
// ==/UserScript==

// Exceptional Companion

//----------------------------------------------------------------
// Utility functions
//----------------------------------------------------------------

getElementByXpath = (path) => {
  return document.evaluate(
    path,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue;
};

sleep = (time) => {
  return new Promise((resolve) => setTimeout(resolve, time));
};

waitForCss = (selector) => {
  return new Promise(async (accept) => {
    do {
      await sleep(500);
    } while (!document.querySelector(selector));
    accept();
  });
};

waitForXpath = (selectors) => {
  return new Promise(async (accept) => {
    do {
      await sleep(500);
    } while (!selectors.some(getElementByXpath));
    accept();
  });
};

waitForGo = () => waitForCss("#main button.button--go");
waitForTryAgain = () =>
  waitForXpath(['//button[.="Try again"]', '//button[.="Onwards"]']);
tryAgainOrOnwards = () => {
  let again = getElementByXpath('//button[.="Try again"]');
  let onwards = getElementByXpath('//button[.="Onwards"]');
  if (again) {
    again.click();
  } else {
    onwards.click();
  }
};

waitForAndClick = async (buttonText) => {
  const xpath = `//button[.="${buttonText}"]`;

  await waitForXpath([xpath]);
  getElementByXpath(xpath).click();
};

goBranch = (branchId) => {
  branch = document.querySelector(
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
};

waitForJq = (selector) => {
  return new Promise(async (accept) => {
    do {
      await sleep(500);
    } while (!$(selector)[0]);
    accept();
  });
};

onwards = () => $("button:contains('Onwards')")[0].click();

tryAgain = () => $("button:contains('Try again')")[0].click();

waitForBranchAndGo = async (branch) => {
  return new Promise(async (resolve) => {
    await waitForJq(`div[data-branch-id='${branch}']`);
    goBranch(branch);
    resolve();
  });
};

waitForOnwardsAndGo = async () => {
  return new Promise(async (resolve) => {
    await waitForJq("button:contains('Onwards')");
    onwards();
    resolve();
  });
};

tryUntilSuccess = async (branch) => {
  await waitForBranchAndGo(branch);
  await waitForJq(".quality-update__body");
  if ($(".quality-update__body:contains('succeeded')")[0]) {
    onwards();
  } else {
    tryAgainOrOnwards();
    await tryUntilSuccess(branch);
  }
};

//----------------------------------------------------------------
// Lab research
//----------------------------------------------------------------

drawUntil = (eventIds, n, resolve) => {
  if (n <= 0) return;

  draw = () => $("button.deck").click();

  discard = () => $(".hand__card-container .card__discard-button").click();

  draw();

  foundId = eventIds.find((id) => {
    if (!!$(`.hand__card-container[data-event-id="${id}"]`)[0]) {
      return id;
    } else {
      discard();
    }
  });

  if (foundId) {
    resolve(foundId);
    return;
  } // 322775

  setTimeout(() => drawUntil(eventIds, n - 1, resolve), 500);
};

drawWrapper = (eventIds) => {
  return new Promise((resolve) => {
    drawUntil(eventIds, 100, resolve);
  });
};

studentCards = {
  Gifted: {
    actions: ["239020", "239024"],
    card: "325173",
  },
  Meticulous: {
    actions: ["237388", "237384"],
    card: "322775",
  },
  Profound: {
    actions: ["239037", "239033"],
    card: "325208",
    trainingBranch: "239033",
    graduateBranch: "239081",
    hireBranch: "238973",
  },
  Visionary: {
    actions: ["239046", "239050"],
    card: "325243",
    trainingBranch: "325322",
    graduateBranch: "239096",
    hireBranch: "238974",
  },
};

studentLevel = () => {
  let iconEl = $('div[aria-label*="Laboratory Services from a"]')[0];
  return parseInt(
    iconEl.getAttribute("aria-label").match(/you have (\d) in all/)[1]
  );
};

playCard = async (eventId) => {
  return new Promise(async (resolve) => {
    $(
      `.hand__card-container[data-event-id="${eventId}"] div[role="button"]`
    )[0].click();
    await waitForJq(".tooltip--item-modal button");
    $(".tooltip--item-modal button")[0].click();
    await sleep(150);
    await waitForJq("div[data-branch-id]");
    resolve();
  });
};

researchNTimes = async (n) => {
  Array(n)
    .fill()
    .reduce(async (previousPromise) => {
      if (previousPromise) await previousPromise;
      await waitForJq(".card--empty");
      await sleep(150);
      return doResearch();
    });
};

graduateStudent = async (student) => {
  return new Promise(async (resolve) => {
    goBranch(student.trainingBranch);
    await waitForJq(`div[data-branch-id='${student.graduateBranch}']`);
    goBranch(student.graduateBranch);
    await waitForJq("button:contains('Onwards')");
    onwards();
    await sleep(150);
    await waitForJq("div[data-branch-id='322853']");
    resolve();
  });
};

hireStudent = async (student) => {
  return new Promise(async (resolve) => {
    await waitForBranchAndGo("324414");
    await waitForBranchAndGo(student.hireBranch);
    await waitForOnwardsAndGo();
    await sleep(150);
    resolve();
  });
};

doResearch = async () => {
  return new Promise(async (resolve) => {
    let student = studentCards["Visionary"];

    if (studentLevel() === 5) {
      await graduateStudent(student);
      await hireStudent(student);
    }

    await drawWrapper([student.card]);
    await playCard(student.card);
    await waitForJq(".storylet-root__frequency");
    if (!goBranch(student.actions[0]) && student.actions[1]) {
      goBranch(student.actions[1]);
    }

    await waitForJq("button:contains('Onwards')");
    await sleep(150);
    onwards();
    await waitForJq("div[data-branch-id]");
    resolve();
  });
};

eolithFinish = async () => {
  goBranch("321170");
  await waitForJq("div[data-branch-id='236628']");
  goBranch("236628");
  await sleep(1200);
  await waitForJq("button:contains('Onwards')");
  onwards();
  await waitForJq("button:contains('Go')");
  $("button:contains('Go')")[0].click();
  await waitForJq("button:contains('Onwards')");
  onwards();
};

eolithBegin = async () => {
  goBranch("320959");
  await waitForJq("div[data-branch-id='236629']");
  goBranch("236629");
  await waitForJq("button:contains('Onwards')");
  onwards();
};

eolithLoop = async () => {
  await eolithBegin();
  await doResearch();
  await doResearch();
  eolithFinish();
};

researchTargets = {
  thighbone: {
    startBranch: "236568",
    endBranch: "236569",
    nTimesResearch: 4,
  },
};

researchLoop = async (startBranch, endBranch, nTimesResearch) => {
  goBranch("320959");

  await waitForJq(`div[data-branch-id='${startBranch}']`);
  goBranch(startBranch);
  await waitForJq("button:contains('Onwards')");
  onwards();
  await waitForJq("div[data-branch-id='322853']");

  // await researchNTimes(nTimesResearch);
  await doResearch();
  await doResearch();
  await doResearch();

  goBranch("321170");
  await waitForJq(`div[data-branch-id='${endBranch}']`);
  goBranch(endBranch);
  await waitForJq("button:contains('Onwards')");
  onwards();
  await waitForJq("button:contains('Go')");
  $("button:contains('Go')")[0].click();
  await waitForJq("button:contains('Onwards')");
  onwards();
  await waitForJq("div[data-branch-id='320959']");
};

researchObject = async (name) => {
  let target = researchTargets[name];
  researchLoop(target.startBranch, target.endBranch, target.researchNTimes);
};

//----------------------------------------------------------------
// Misc Specific grinds
//----------------------------------------------------------------

waswood = async () => {
  goBranch("321289"); // leave camp
  await waitForJq("div[data-branch-id='237529']");
  goBranch("237529"); // to waswood
  await waitForJq("button:contains('Onwards')");
  onwards();
  await waitForJq("div[data-branch-id]");

  went = goBranch("237826");
  if (!went) goBranch("238057");

  await sleep(1200);
  await waitForJq("button:contains('Onwards')");
  onwards();
  await waitForJq("div[data-branch-id]");
  goBranch("237836"); // back to camp
  await waitForJq("button:contains('Onwards')");
  onwards();
  await waitForJq("div[data-branch-id]");
};

justificandeLoop = async () => {
  // Start
  await waitForBranchAndGo("323176");

  // Red
  await waitForBranchAndGo("238110");
  await waitForOnwardsAndGo();

  // opening
  await waitForBranchAndGo("237802");
  await waitForOnwardsAndGo();
  await waitForBranchAndGo("323176");
  await waitForBranchAndGo("237802");
  await waitForOnwardsAndGo();

  // Midgame
  await waitForBranchAndGo("323215");

  await waitForBranchAndGo("237806");
  await waitForOnwardsAndGo();

  await waitForBranchAndGo("323215");

  await waitForBranchAndGo("237806");
  await waitForOnwardsAndGo();

  // Endgame
  await waitForBranchAndGo("323215");
  await waitForBranchAndGo("237683");
  // await waitForJq("button:contains('Onwards')");
  // onwards();
};

heliconGrind = async () => {
  // To the house
  await waitForBranchAndGo("323652");
  // Go with amber
  await waitForBranchAndGo("244602");
  // Onwards
  await waitForOnwardsAndGo();

  // Festive friend
  await waitForBranchAndGo("244423");
  // Onwards
  await waitForOnwardsAndGo();

  // Entrance Hall
  await waitForBranchAndGo("332737");
  // Watchem
  await waitForBranchAndGo("244301");
  // Onwards
  await waitForOnwardsAndGo();

  // Entrance Hall
  await waitForBranchAndGo("332737");
  // Watchem
  await waitForBranchAndGo("244301");
  // Onwards
  await waitForOnwardsAndGo();

  // Entrance Hall
  await waitForBranchAndGo("332737");
  // Watchem
  await waitForBranchAndGo("244301");
  // Onwards
  await waitForOnwardsAndGo();

  // Entrance Hall
  await waitForBranchAndGo("332737");
  // Solacefruit
  await waitForBranchAndGo("244483");
  // Onwards
  await waitForOnwardsAndGo();

  // To the house
  await waitForBranchAndGo("323652");
  // Go with amber
  await waitForBranchAndGo("244602");
  // Onwards
  await waitForOnwardsAndGo();

  // Festive friend
  await waitForBranchAndGo("244423");
  // Onwards
  await waitForOnwardsAndGo();

  // Honey Den
  await waitForBranchAndGo("331044");
  // Claim items
  await waitForBranchAndGo("243787");

  await sleep(1500); // check results

  await waitForOnwardsAndGo();
};

boxGrind = async () => {
  // Agent of the masters
  await waitForBranchAndGo(23988);
  // Expose x4
  await tryUntilSuccess(11123);
  await waitForBranchAndGo(23988);
  await tryUntilSuccess(11123);
  await waitForBranchAndGo(23988);
  await tryUntilSuccess(11123);
  await waitForBranchAndGo(23988);
  await tryUntilSuccess(11123);

  // Jasper and Frank
  await waitForBranchAndGo(23998);
  // Lie x3
  await tryUntilSuccess(11128);
  await waitForBranchAndGo(23998);
  await tryUntilSuccess(11128);
  await waitForBranchAndGo(23998);
  await tryUntilSuccess(11128);

  // Encryption of a sort
  await waitForBranchAndGo(24008);
  // Intercept messages x3
  await tryUntilSuccess(11131);
  await waitForBranchAndGo(24008);
  await tryUntilSuccess(11131);
  await waitForBranchAndGo(24008);
  await tryUntilSuccess(11131);

  // Strong box
  await waitForBranchAndGo(24013);
  // Tell colleagues x3
  await tryUntilSuccess(11133);
  await waitForBranchAndGo(24013);
  await tryUntilSuccess(11133);
  await waitForBranchAndGo(24013);
  await tryUntilSuccess(11133);
};

contraptionGrind = async () => {
  // Missing Woman
  await waitForBranchAndGo(19513);
  await waitForBranchAndGo(8715);
  await waitForOnwardsAndGo();

  // Your Own Eyes x4
  await waitForBranchAndGo(19514);
  await tryUntilSuccess(8718);
  await waitForBranchAndGo(19514);
  await tryUntilSuccess(8718);
  await waitForBranchAndGo(19514);
  await tryUntilSuccess(8718);

  // Who is she
  await waitForBranchAndGo(19517);
  await waitForBranchAndGo(8723);
  await waitForOnwardsAndGo();

  // Professor x5
  await waitForBranchAndGo(19520);
  await tryUntilSuccess(8727);
  await waitForBranchAndGo(19520);
  await tryUntilSuccess(8727);
  await waitForBranchAndGo(19520);
  await tryUntilSuccess(8727);
  await waitForBranchAndGo(19520);
  await tryUntilSuccess(8727);
  await waitForBranchAndGo(19520);
  await tryUntilSuccess(8727);

  // The End
  await waitForBranchAndGo(19524);
  await waitForBranchAndGo(8713);
};

suspicionGrind = async () => {
  const branchPriorities = [
    [173620, 4877], // Confound the constables
    [173617], // Burgle Jewelers - Moon-pearl
    [173624], // Christen Jack - Moon-Pearl
    [173619], // Burgle Glim - Glim
    [173614], // Case a Jewelers - Hints
  ];

  const foundBranches = branchPriorities.find((branches) =>
    document.querySelector(`div[data-branch-id="${branches[0]}"]`)
  );

  if (foundBranches) {
    foundBranches.forEach(async (branch) => {
      await waitForBranchAndGo(branch);
    });
  } else {
    console.log("No branch found");
  }

  await waitForOnwardsAndGo();
};

const outfits = {
  exceptional_a: 3961918,
  hard_wearing: 105820,
  seventh: 4085581,
};

const changeOutfit = async (outfit) => {
  // 3961918 : Exceptional A

  await fetch("https://api.fallenlondon.com/api/outfit/change", {
    headers: {
      accept: "application/json, *.*",
      "accept-language": "en-US,en;q=0.9",
      authorization: `Bearer ${window.localStorage.access_token}`,
      "content-type": "application/json",
      "sec-ch-ua":
        '" Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "x-current-version": "6.5.16",
      "x-requested-with": "XMLHttpRequest",
    },
    referrer: "https://www.fallenlondon.com/",
    referrerPolicy: "strict-origin-when-cross-origin",
    body: `{"outfitId":${outfit}}`,
    method: "POST",
    mode: "cors",
    credentials: "include",
  });
};

sharkGrind = async () => {
  // Track animals
  await waitForBranchAndGo(321322);

  // Hunt shark
  await waitForBranchAndGo(239249);
  await waitForOnwardsAndGo();

  // Outfit A for Glass
  await changeOutfit(outfits.exceptional_a);
  await sleep(500);

  // 2x Apply glass knowledge
  await waitForBranchAndGo(240074);
  await waitForOnwardsAndGo();
  await waitForBranchAndGo(240074);
  await waitForOnwardsAndGo();

  // Hard wearing
  await changeOutfit(outfits.hard_wearing);
  await sleep(500);

  // Push onward
  await tryUntilSuccess(237525);

  // Wait at pool
  await waitForBranchAndGo(237692);
  await waitForOnwardsAndGo();

  // Continue towards its pool
  await tryUntilSuccess(237518);

  // Strike it down
  await waitForBranchAndGo(236397);
  await waitForOnwardsAndGo();

  // 7th outfit for Monstrous Anatomy
  await changeOutfit(outfits.seventh);
  await sleep(500);

  // 4x ambush at close range
  await tryUntilSuccess(237723);
  await tryUntilSuccess(237723);
  await tryUntilSuccess(237723);
  await tryUntilSuccess(237723);

  // Kill
  await waitForBranchAndGo(239258);
};

trackLoop = async () => {
  return new Promise(async (resolve) => {
    await waitForJq("div[data-branch-id='321322']");
    goBranch("321322"); // to track

    await waitForJq("div[data-branch-id='237691']");
    goBranch("237691"); // track birb

    await waitForJq("button:contains('Onwards')");
    onwards();

    await waitForJq("div[data-branch-id='236418']");
    goBranch("236418"); // Go home

    await sleep(1500); // check results

    await waitForJq("button:contains('Onwards')");
    onwards();

    resolve();
  });
};

nightmareAssistGrind = async () => {
  await waitForBranchAndGo(204565);
  await waitForAndClick("Choose");
  await waitForTryAgain();
  tryAgainOrOnwards();
};

//----------------------------------------------------------------
// Card automation
//----------------------------------------------------------------
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

window.startCardLoop = () => {
  // Start the loop, passing in the list of event IDs as a parameter
  cardWatchLoop([
    { eventId: 11209, branchId: 6144 }, // Afternoon of good deeds
    { eventId: 22413, branchId: 10521 }, // Temptation of money
    { eventId: 11211, branchId: 6714 }, // Restorative
    // { eventId: 10135, branchId: 206992 }, // Bohemians
    // { eventId: 10147, branchId: 204817 }, // Great Game
    // { eventId: 10143, branchId: 30483 }, // Church
    // { eventId: 21276, branchId: 204816 }, // Mole
    { eventId: 11222, branchId: 7027 }, // Merry Gentleman
    { eventId: 19455, branchId: 12345678 }, // You know her
  ]);
};

//----------------------------------------------------------------
// General Grind
//----------------------------------------------------------------

branchLoop = (branchId) => {
  return new Promise(async (resolve) => {
    await waitForGo();
    document
      .querySelector(`div[data-branch-id="${branchId}"] button.button--go`)
      .click();
    await waitForTryAgain();
    tryAgainOrOnwards();
    resolve();
  });
};

grind = async (branchId, n) => {
  if (n == 0) {
    console.log("done!");
  } else {
    console.log(`loop ${n}`);
    await branchLoop(branchId);
    grind(branchId, n - 1);
  }
};

grindAll = async (branchId, grindAmt) => {
  window.localStorage.grindBranch = branchId;

  let actionsBox = document.querySelector('img[aria-label="actions"]')
    .parentElement.parentElement;
  let actionsText = actionsBox.querySelector(
    "div.item__desc > div"
  ).textContent;

  if (!grindAmt || grindAmt == 0) {
    grindAmt = parseInt(actionsText.match(/(\d+)\/\d+/)[1]);
  }

  grind(branchId, grindAmt);
};

grindAllMarked = async () => {
  let markedBranchId = $("#grind-input").val();
  let grindAmt = parseInt($("#grind-amount").val());

  grindAll(markedBranchId, grindAmt);
};

showBranches = () => {
  Array.from(
    document.querySelectorAll("div.media--branch[data-branch-id]")
  ).map((branchEl) => {
    let titleEl = branchEl.querySelector("h2");
    titleEl.innerText =
      titleEl.innerText + " - " + branchEl.getAttribute("data-branch-id");
  });
};

showCards = () => {
  Array.from(document.querySelectorAll(".hand__card-container")).map(
    (cardEl) => {
      let discardEl = cardEl.querySelector("button");
      discardEl.innerText =
        discardEl.innerText + " - " + cardEl.getAttribute("data-event-id");
    }
  );
};

doGrind = async () => {
  const fn = document.querySelector("#grind-select").value;
  console.log("grind fn:", fn);
  this[fn]();
};

createHelperEls = () => {
  var grindBranch = window.localStorage.grindBranch || "6285";

  var div = document.createElement("div");
  div.innerHTML = `
    <br>
    <button class="button--primary" onclick="showBranches()">Show Branch IDs</button>
    <br>
    <button class="button--primary" onclick="showCards()">Show Card IDs</button>
    <br>
    <button class="button--primary" onclick="startCardLoop()">Start Card Automation</button>
    <br>
      <select name="grinds" id="grind-select">
        <option value="grindAllMarked">Generic</option>
        <option value="heliconGrind">Helicon House</option>
        <option value="boxGrind">Affair of the Box</option>
        <option value="contraptionGrind">Whirring Contraption</option>
        <option value="sharkGrind">Pinewood Shark</option>
        <option value="nightmareAssistGrind">Nightmares</option>
        <option value="suspicionGrind">Suspicion</option>
      </select>
      <button class="button--primary" onclick="doGrind()">Grind</button>

      <input id="grind-input" value="${grindBranch}"/>
      <input id="grind-amount" value="0"/>
  `;
  document.querySelector(".items--list").insertAdjacentElement("afterEnd", div);
};

async function helperWatch() {
  while (true) {
    await sleep(1000);
    if (!document.querySelector("#grind-select")) {
      console.log("re-creating helper els");
      createHelperEls();
    }

    await sleep(5000);
  }
}

document.addEventListener("readystatechange", (event) => {
  // When window loaded ( external resources are loaded too- `css`,`src`, etc...)
  if (event.target.readyState === "complete") {
    setTimeout(helperWatch, 3000);
  }
});

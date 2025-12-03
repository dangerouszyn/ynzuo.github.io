// Basic game state [data structure tracking current situation]
const gameState = {
  currentNodeId: "intro_1937",
  stats: {
    readiness: 45,   // military preparedness
    public: 40,      // public support for firmness
    trust: 45,       // trust in Hitler's assurances
    allies: 50,      // confidence in France & others
    czech: 55        // security of Czechoslovakia
  },
  turn: 0,
  history: []
};

function calculateDeterrenceProbability(stats) {
  let score =
      stats.readiness * 0.50 +
      stats.allies    * 0.20 +
      (stats.public - 50) * 0.20 +
      stats.czech     * 0.30 +
      (50 - stats.trust) * 0.2;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function applyPostEndingConsequences(endingId, stats) {
  if (endingId === "ending_appeasement") {
    // Historical consequences (1939 trajectory)
    stats.czech = 0;                 // Complete dismemberment
    stats.readiness = clamp(stats.readiness + 25, 0, 100);  
    stats.trust = clamp(stats.trust - 40, 0, 100);          
    stats.allies = clamp(stats.allies + 5, 0, 100);        
    stats.public = clamp(stats.public + 20, 0, 100);        
  }

  if (endingId === "ending_conditional") {
    // Partial appeasement → early war model
    stats.czech = clamp(stats.czech - 20, 0, 100);  // Prague loses fortification
    stats.readiness = clamp(stats.readiness + 10, 0, 100);
    stats.trust = clamp(stats.trust - 25, 0, 100);  
    stats.allies = clamp(stats.allies + 10, 0, 100); 
  }

  if (endingId === "ending_confrontation") {
    // Early confrontation already assumed
    stats.readiness = clamp(stats.readiness - 5, 0, 100); 
    stats.czech = clamp(stats.czech + 10, 0, 100);  
    stats.allies = clamp(stats.allies + 30, 0, 100); 
    stats.trust = clamp(stats.trust, 0, 100);
  }

  return stats;
}

// Decision nodes [structured representation of events and options]
const nodes = {
  intro_1937: {
    id: "intro_1937",
    year: "Early 1937",
    title: "A New Prime Minister, Old European Fears",
    tags: ["Context", "Domestic Politics"],
    description: `
      You have just taken office as Prime Minister. The memory of the Great War hangs heavily over Britain.
      The RAF is still building up, and the army is small. The Treasury urges restraint, but some advisers warn
      that <strong>Hitler is revising the Versailles settlement by stealth</strong>.
    `,
    choices: [
      {
        text: "Quietly prioritise rearmament while avoiding public alarms.",
        subtext: "You bank on time: build strength first, confrontation later.",
        effects: { readiness: +10, public: -2, trust: 0, allies: +2, czech: 0 },
        log: "You instruct the Chiefs of Staff to accelerate rearmament, but you keep public rhetoric moderate.",
        next: "anschluss_1938"
      },
      {
        text: "Launch a public campaign warning of German danger.",
        subtext: "You invite the public into strategic anxiety.",
        effects: { readiness: +6, public: +6, trust: -3, allies: +3, czech: +2 },
        log: "Parliament hears blunt speeches; some backbenchers applaud, pacifists grumble.",
        next: "anschluss_1938"
      },
      {
        text: "Assume Hitler mainly wants limited revisions; focus on domestic reforms.",
        subtext: "You gamble that the European order can be managed with diplomacy.",
        effects: { readiness: -4, public: +2, trust: +6, allies: 0, czech: -3 },
        log: "You treat German demands as manageable adjustments, postponing major defence expansion.",
        next: "anschluss_1938"
      }
    ]
  },

  anschluss_1938: {
    id: "anschluss_1938",
    year: "March 1938",
    title: "The Anschluss: Austria Absorbed",
    tags: ["Shock", "Intelligence"],
    description: `
      Germany has annexed Austria. Intelligence suggests <strong>Hitler acted quickly and faced little resistance</strong>.
      The Foreign Office worries that Czechoslovakia, with its defensible frontier and alliances, will be next.
      Your Cabinet is divided between alarm and weary resignation.
    `,
    choices: [
      {
        text: "Interpret Anschluss as a limited, ethnically framed adjustment.",
        subtext: "You downplay the systemic implications.",
        effects: { readiness: -2, public: 0, trust: +6, allies: -3, czech: -4 },
        log: "You brief Parliament that German moves remain within 'self-determination' logic.",
        next: "sudeten_crisis"
      },
      {
        text: "Treat Anschluss as a major warning and step up defence coordination with France.",
        subtext: "You begin to think in terms of an eventual showdown.",
        effects: { readiness: +5, public: +3, trust: -5, allies: +8, czech: +2 },
        log: "You press Paris to coordinate planning, though French politics are fragile.",
        next: "sudeten_crisis"
      },
      {
        text: "Seek intelligence specifically on German capabilities and war-readiness.",
        subtext: "You want a clearer picture before committing.",
        effects: { readiness: +3, public: 0, trust: -1, allies: +2, czech: 0 },
        log: "You instruct the intelligence services to prioritise estimates of German rearmament.",
        next: "intel_dossier"
      }
    ]
  },

  intel_dossier: {
    id: "intel_dossier",
    year: "Mid 1938",
    title: "Conflicting Intelligence Dossiers",
    tags: ["Uncertainty", "Estimates"],
    description: `
      Intelligence reports come in. Some analysts claim Germany is <strong>already formidable</strong>; others stress
      bottlenecks in fuel and raw materials. There are serious margins of error. A Cabinet committee awaits your line.
    `,
    choices: [
      {
        text: "Assume worst-case German strength; treat time as necessary for Britain to Catch Up",
        subtext: "You favour accommodation while Britain is weaker.",
        effects: { readiness: +5, public: -4, trust: +4, allies: -1, czech: -0 },
        log: "You warn colleagues that Britain cannot yet risk a continental war.",
        next: "sudeten_crisis"
      },
      {
        text: "Assume Germany is still vulnerable; Britain is not vulnerable",
        subtext: "You see scope for firmer resistance if war is delayed a little.",
        effects: { readiness: +2, public: +4, trust: -4, allies: +3, czech: +1 },
        log: "You note German weaknesses in oil and foreign exchange in your diary.",
        next: "sudeten_crisis"
      }
    ]
  },

  sudeten_crisis: {
    id: "sudeten_crisis",
    year: "Summer 1938",
    title: "The Sudetenland Question",
    tags: ["Czechoslovakia", "Alliances"],
    description: `
      Hitler demands the Sudetenland, claiming discrimination against ethnic Germans. Czechoslovakia is militarily
      competent and fortified, but strategically exposed. France is treaty-bound to Prague yet politically hesitant.
      The British public fears another 1914.
    `,
    choices: [
      {
        text: "Signal to France and Prague that Britain may stand firm, but avoid explicit guarantees.",
        subtext: "You keep options open and test allied resolve.",
        effects: { readiness: +3, public: -1, trust: -3, allies: +4, czech: +2 },
        log: "You send ambiguous messages: encouraging Prague, but stopping short of firm commitments.",
        next: "soviet_option"
      },
      {
        text: "Discourage French and Czech firmness; emphasise the need for negotiated concessions.",
        subtext: "You tilt toward managed territorial revision.",
        effects: { readiness: 0, public: +3, trust: +4, allies: -4, czech: -6 },
        log: "Paris senses British reluctance; Prague grows anxious and isolated.",
        next: "soviet_option"
      },
      {
        text: "Explore a broader front: discreetly sound out the Soviet Union.",
        subtext: "You look for a larger deterrent coalition, despite ideological misgivings.",
        effects: { readiness: +2, public: -2, trust: -2, allies: +5, czech: +3 },
        log: "Initial Soviet signals suggest interest, but mutual suspicion is deep.",
        next: "soviet_option"
      }
    ]
  },

  soviet_option: {
    id: "soviet_option",
    year: "Late Summer 1938",
    title: "The Soviet Question",
    tags: ["Grand Strategy", "Ideology"],
    description: `
      Officials debate whether to bring the Soviet Union into any deterrent scheme. Some argue that
      <strong>only a broad coalition can restrain Hitler</strong>; others fear entanglement with Stalin and domestic backlash.
    `,
    choices: [
      {
        text: "Keep the USSR at arms’ length; rely on Britain and France as 'respectable' guarantors.",
        subtext: "You prioritise ideological comfort and domestic optics.",
        effects: { readiness: 0, public: +3, trust: +2, allies: -3, czech: -3 },
        log: "Soviet diplomats note coolness and question Western seriousness.",
        next: "public_opinion"
      },
      {
        text: "Secretly include the USSR in contingency planning, even if public rhetoric is cautious.",
        subtext: "You try to square domestic politics with strategic necessity.",
        effects: { readiness: +2, public: -1, trust: -2, allies: +5, czech: +4 },
        log: "You quietly ask the Chiefs of Staff how Soviet participation could alter the balance.",
        next: "public_opinion"
      },
      {
        text: "Openly propose a grand anti-aggression front including the USSR.",
        subtext: "You gamble that clarity of deterrent will outweigh ideological discomfort.",
        effects: { readiness: +3, public: -8, trust: -4, allies: +7, czech: +5 },
        log: "Some Conservatives revolt; Labour applauds; Hitler fumes at the rhetoric.",
        next: "public_opinion"
      }
    ]
  },

  public_opinion: {
    id: "public_opinion",
    year: "September 1938",
    title: "Public Opinion and the Shadow of 1914",
    tags: ["Domestic Politics", "War Memory"],
    description: `
      Mass meetings chant “No more war”, yet some newspapers demand firmness. Intelligence suggests
      that German air raids on London could be devastating. Your political survival and the cohesion of your
      Cabinet depend on how you frame the choice.
    `,
    choices: [
      {
        text: "Emphasise the horrors of modern war and present peace as the paramount objective.",
        subtext: "You align strongly with pacifist sentiment.",
        effects: { readiness: -2, public: +7, trust: +4, allies: -3, czech: -5 },
        log: "You speak movingly about air raids and civilian casualties; crowds cheer, strategists worry.",
        next: "munich_choice"
      },
      {
        text: "Stress both the risks of war and the danger of endless concessions.",
        subtext: "You keep the public psychologically balanced but uncertain.",
        effects: { readiness: +1, public: +2, trust: 0, allies: +1, czech: +1 },
        log: "Your speeches are nuanced; different audiences hear different emphases.",
        next: "munich_choice"
      },
      {
        text: "Warn that further concessions may only embolden aggression despite the costs of war.",
        subtext: "You prepare the public for possible confrontation.",
        effects: { readiness: +3, public: -3, trust: -4, allies: +3, czech: +4 },
        log: "You are accused of 'warming to war', but hawks in the Cabinet feel vindicated.",
        next: "munich_choice"
      }
    ]
  },

  munich_choice: {
    id: "munich_choice",
    year: "End of September 1938",
    title: "The Munich Decision",
    tags: ["Critical Choice"],
    description: `
      Hitler invites you, Daladier, and Mussolini to Munich. No Czech representative is at the table.
      You must decide your posture: is this the last concession to preserve peace, or a line that must not be crossed?
      Your previous choices have shaped Britain’s readiness, alliances, and moral position.
    `,
    choices: [
      {
        text: "Accept the Munich terms, framing them as the price of 'peace for our time'.",
        subtext: "You bet that satisfying territorial claims will stabilise Europe.",
        effects: { readiness: +2, public: +4, trust: +6, allies: -3, czech: -40 },
        log: "You sign the agreement, believing you have averted immediate catastrophe.",
        next: "ending_appeasement"
      },
      {
        text: "Accept in principle, but insist on stronger guarantees for what remains of Czechoslovakia.",
        subtext: "You try to bind Hitler and reassure allies simultaneously.",
        effects: { readiness: +3, public: +1, trust: +1, allies: +4, czech: -30 },
        log: "You return with an agreement and solemn pledges to defend the new status quo.",
        next: "ending_conditional"
      },
      {
        text: "Refuse to sign unless Czechoslovakia is directly represented and key fortifications remain.",
        subtext: "You risk immediate crisis and potential war.",
        effects: { readiness: -2, public: -4, trust: -6, allies: +8, czech: +2 },
        log: "You stiffen in the negotiations; tempers flare as the prospect of war looms.",
        next: "ending_confrontation"
      }
    ]
  },

  ending_appeasement: {
    id: "ending_appeasement",
    year: "After Munich",
    title: "Outcome: Classic Appeasement",
    tags: ["Ending"],
    description: `
      You return to cheering crowds and speak of “peace for our time.” In the short run, war is avoided and
      your public standing is high. Yet Czechoslovakia is dismembered, and your trust in Hitler is now a critical
      variable. Future crises will test whether this was prudence or illusion.
    `,
    isEnding: true
  },

  ending_conditional: {
    id: "ending_conditional",
    year: "After Munich",
    title: "Outcome: Conditional Deterrent",
    tags: ["Ending"],
    description: `
      You secure an agreement that still sacrifices the Sudetenland, but you leave Munich emphasising
      that <strong>any further aggression will transform Britain’s posture</strong>. Your alliances are somewhat stronger,
      and Germany notes that British ambiguity is narrowing. The crisis is postponed, not resolved.
    `,
    isEnding: true
  },

  ending_confrontation: {
    id: "ending_confrontation",
    year: "Counterfactual 1938",
    title: "Outcome: Early Confrontation",
    tags: ["Ending", "Counterfactual"],
    description: `
      Refusing to endorse Munich, you precipitate a drastically different path. War may come earlier,
      but Czechoslovakia’s fortifications and industry remain intact, and the signal to Hitler is unmistakable.
      Whether history will judge this as reckless or farsighted depends on variables no statesman can fully know.
    `,
    isEnding: true
  }
};

// Utility: clamp values into [0, 100] range
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// Apply choice effects [update state and log narrative]
function applyChoice(choice, node) {
  gameState.turn += 1;

  const s = gameState.stats;
  const eff = choice.effects || {};

  s.readiness = clamp(s.readiness + (eff.readiness || 0), 0, 100);
  s.public    = clamp(s.public    + (eff.public    || 0), 0, 100);
  s.trust     = clamp(s.trust     + (eff.trust     || 0), 0, 100);
  s.allies    = clamp(s.allies    + (eff.allies    || 0), 0, 100);
  s.czech     = clamp(s.czech     + (eff.czech     || 0), 0, 100);

  // Push log entry
  gameState.history.push({
    turn: gameState.turn,
    nodeTitle: node.title,
    choiceText: choice.text,
    log: choice.log || ""
  });

  // Move to next node
  gameState.currentNodeId = choice.next;
}

// Render stats panel [map game state to DOM]
function renderStats() {
  const { readiness, public: pub, trust, allies, czech } = gameState.stats;

  const setBar = (idBar, idVal, value) => {
    const bar = document.getElementById(idBar);
    const val = document.getElementById(idVal);
    if (!bar || !val) return;
    bar.style.width = `${value}%`;
    val.textContent = `${value}/100`;
  };

  setBar("stat-readiness-bar", "stat-readiness-value", readiness);
  setBar("stat-public-bar",    "stat-public-value",    pub);
  setBar("stat-trust-bar",     "stat-trust-value",     trust);
  setBar("stat-allies-bar",    "stat-allies-value",    allies);
  setBar("stat-czech-bar",     "stat-czech-value",     czech);
}

// Render log panel
function renderLog() {
  const container = document.getElementById("log-entries");
  container.innerHTML = "";

  gameState.history.forEach(entry => {
    const div = document.createElement("div");
    div.className = "log-entry";
    div.innerHTML = `
      <div class="log-time">Turn ${entry.turn} – ${entry.nodeTitle}</div>
      <div class="log-choice"><strong>Choice:</strong> ${entry.choiceText}</div>
      ${entry.log ? `<div class="log-text">${entry.log}</div>` : ""}
    `;
    container.appendChild(div);
  });

  container.scrollTop = container.scrollHeight;
}

// Render the current event card and choices
function renderNode() {
  const node = nodes[gameState.currentNodeId];
  if (!node) return;

  const yearEl = document.getElementById("event-year");
  const titleEl = document.getElementById("event-title");
  const descEl = document.getElementById("event-description");
  const tagsEl = document.getElementById("event-tags");
  const choiceContainer = document.getElementById("choice-container");
  const cardEl = document.getElementById("event-card");

  yearEl.textContent = node.year || "";
  titleEl.textContent = node.title || "";
  descEl.innerHTML = node.description || "";

  // Tags
  tagsEl.innerHTML = "";
  (node.tags || []).forEach(tag => {
    const span = document.createElement("span");
    span.className = "tag-pill";
    span.textContent = tag;
    tagsEl.appendChild(span);
  });

// If this is an ending node
if (node.isEnding) {
    cardEl.classList.add("ending");

    // 🔥 Apply historical/counterfactual consequences BEFORE calculating probability
    applyPostEndingConsequences(node.id, gameState.stats);

    // Re-render stats to show the new post-ending state
    renderStats();

    // 🎯 Generate dynamic narrative text based on the ending
    let endingNarrative = "";

    if (node.id === "ending_appeasement") {
        endingNarrative = `
          <p style="margin-top:8px;">
          <strong>This is the historical outcome</strong>.
            After Munich, events move swiftly. Germany occupies Prague in March 1939,
            <strong>completing the destruction of Czechoslovakia</strong>.
            British trust in Hitler collapses, and defence spending surges.
            Public confidence in your judgement falters while European stability deteriorates further.
          </p>
        `;
    }

    if (node.id === "ending_conditional") {
        endingNarrative = `
          <p style="margin-top:8px;">
            Your conditional stance stiffens French resolve. Hitler, frustrated by partial concessions,
            accelerates military preparations. By early 1939, Europe spirals into a
            <strong>premature full-scale confrontation in early 1939</strong>. Czechoslovakia has lost the border fortifications, but what remains of it joins the Allies in the early war that Germany is less prepared for than historically.
          </p>
        `;
    }

    if (node.id === "ending_confrontation") {
        endingNarrative = `
          <p style="margin-top:8px;">
            Your refusal at Munich triggers an immediate crisis. War breaks out under conditions that preserve
            Czech fortifications and Allied credibility. The strategic balance favours the Allies more than in the
            historical 1939 timeline.
          </p>
        `;
    }

    // Compute probability AFTER consequences
    const prob = calculateDeterrenceProbability(gameState.stats);

    // 🎨 Now insert everything into the ending card
    choiceContainer.innerHTML = `
      <div class="ending-title">Simulation Complete</div>

      ${endingNarrative}

      <p style="font-size:0.9rem; margin-top:8px; color:#fde68a;">
        Estimated probability of successful deterrence or victory in a resulting war:
        <strong>${prob}%</strong>
      </p>

      <button id="ending-restart" class="restart-btn" style="margin-top:10px;">
        Run the Scenario Again
      </button>
    `;

    const btn = document.getElementById("ending-restart");
    btn.addEventListener("click", () => restartGame());
    return;
}

  cardEl.classList.remove("ending");

  // Render choices
  choiceContainer.innerHTML = "";
  (node.choices || []).forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.innerHTML = `
      <span class="choice-main">${choice.text}</span>
      <span class="choice-sub">${choice.subtext || ""}</span>
    `;
    btn.addEventListener("click", () => {
      applyChoice(choice, node);
      renderStats();
      renderLog();
      renderNode();
    });
    choiceContainer.appendChild(btn);
  });
}



// Restart the simulation
function restartGame() {
  gameState.currentNodeId = "intro_1937";
  gameState.stats = {
    readiness: 45,
    public: 40,
    trust: 45,
    allies: 50,
    czech: 55
  };
  gameState.turn = 0;
  gameState.history = [];
  renderStats();
  renderLog();
  renderNode();
}

// Initialise when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const restartBtn = document.getElementById("restart-btn");
  restartBtn.addEventListener("click", restartGame);

  renderStats();
  renderLog();
  renderNode();
});
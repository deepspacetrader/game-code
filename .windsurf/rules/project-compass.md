---
trigger: manual
---

• Project Vision
– A lean, sci-fi trading sim that grows in depth as players “upgrade” their UI Level.
– Mechanics unlock progressively (flash-sales, warp travel, quantum shop, leaderboards, etc.) without wholesale shifts to turn-based play.
– Encounters (market police, enemy characters, danger events) remain real-time with time sensitive player decisions for input, modified by shields/stealth/escape chances.
– Backstory about why the markets behave the way they do is explained throughout the game as the player progresses through UI levels and learns more by engaging in dialog with the traders.

-   Travel between galaxies, travel between traders of a galaxy but no visiting planets or other ships.

• Design Pillars

-   Minimalist UI that layers in richer visuals and data only at higher UI tiers.
-   Consistent thresholds (UI ≥ 25, 50, 75, 100, 150, 200, 250, 500, 1000, 1500, 2000, 2500, 5000, 5500, 10000, 15000, 50000, 100000) to gate new features & styling.
    Progressive feedback (sparklines, badges, banners) that reward player investment.
    Clear separation of concerns: context for state; small, reusable components; declarative hooks.
    Credits int
    Fuel float
    UI level int
    Durations float
    Stock int
    Health int
    Shield bool
    Stealth bool
    Escape chance float
    Delivery speed float
    Duration float

• Tech Stack & Style
React functional components with hooks and Context API.
SCSS for dynamic styles.
JS: Array methods, useEffect/useMemo, helper functions (randomInt, shuffle).
Lint-clean, avoid unused vars, wrap handlers in useCallback where needed.

Avoid adding new npm packages unless asking for approval first (i'm open to the idea of adding new packages, but want to keep things simple and avoid bloat)

• Project Rules
Never pivot to full turn-based gameplay; travel and trade happen in “visits,” but encounters stay event-driven.
Reflect state changes immediately in the UI; no hidden or non visual significant changes in gameplay.
Maintain “UI level” tiers to unlock features/styling: low, medium, high, elite.
Favor scalability: new features should slot into context.
Optimize for performance and avoid unnecessary re-renders.

• Core Gameplay Mechanics

-   Buy/sell goods
-   Install ship modules
-   Use items on self
-   Activate Shield
-   Activate Stealth
-   Travel to next trader
-   Travel to previous trader
-   Travel to random galaxy (low UI)
-   Open Star Map (medium UI)
    -   Use Low quality starmap
    -   Use Medium quality starmap
    -   Use High quality starmap
-   Fuel Storage can NOT be sold during travel
-   Ship Modules can ONLY be sold during travel (except quantum processors) if player has installed at least 1x Particle Beam Reverter
-   Ship Modules can ONLY be bought during travel (except quantum processors) if player has installed at least 1x Particle Beam Receiver

-   Cheater mode is disabled by default but player can activate by giving prompt message and have Credits balance labeled as cheater!
-   Quantum Processors (high UI, but always visible)
    -   1x Enables Quantum Hover with Auto Trade.
    -   2x ... TBD
    -   3x ... TBD
    -   4x ... TBD
        = 5x Quantum Processors = Game Over Scenario (if conditions met, Jax Orion + Quantum Auto Buy for first time (using localstorage))
-   Illegal Goods such as weapons and encrypted data (professional)
-   Access Leaderboards (elite UI (only if game has been completed before track using localstorage))
-   TBD: SECRET ITEMS (legendary)

UI Tier List:

improvedUILevel <= 0 ? 'zero'
improvedUILevel < 5 ? 'worthless'
improvedUILevel < 10 ? 'awful'
improvedUILevel < 15 ? 'bad'
improvedUILevel < 20 ? 'verylow'
improvedUILevel < 25 ? 'low'
improvedUILevel < 50 ? 'medium'
improvedUILevel < 75 ? 'high'
improvedUILevel < 100 ? 'ultra'
improvedUILevel < 150 ? 'newbie'
improvedUILevel < 200 ? 'apprentice'
improvedUILevel < 250 ? 'journeyman'
improvedUILevel < 300 ? 'adventurer'
improvedUILevel < 500 ? 'explorer'
improvedUILevel < 1000 ? 'professional'
improvedUILevel < 1500 ? 'skilled'
improvedUILevel < 2000 ? 'knowledgeable'
improvedUILevel < 2500 ? 'smart'
improvedUILevel < 5000 ? 'expert'
improvedUILevel < 10000 ? 'master'
improvedUILevel < 15000 ? 'grandmaster'
improvedUILevel < 25000 ? 'elite'
improvedUILevel < 50000 ? 'legendary'
improvedUILevel < 100000 ? 'potential'
improvedUILevel >= 100000 ? 'endgame'

META:
Player should acquire 5 quantum processors asap.
Player needs courier drones to transport goods faster especially quantum processors because that's the only way to beat the game.
Player needs credits to buy courier drones.
Courier drones are pretty commonly found but not always available.
There are many ways a player can acquire credits (trading, lucky encounters, innovative strategies)
But only one record holder.

Therefore the recommended way to acquire 5 quantum processors is to transport them more quickly with courier drones acquired by trading in a war zone because of the extreme volatility. Good luck. War zones are dangerous and require a lot of caution before entering those galaxies. Traveling without an active shield or stealth module is a very dangerous strategy therefore the Hall of Legends provides each player with a remote trading ship used for their own private business operationsnot a company because there are no markets anymore just these weird shadowy remnants of what were markets but are now just a series of overlord traders who dominate all trade in various aspects of the universe. They create markets and sell goods to other traders using quantum supremacy auto buyers and also to players. They offer stock to the player to trade with but the player is new, slow and cumbersome so they can easily buy up all the stock and transport elsewhere so oblivious to the fuel costs spent during transportation and the time spent waiting for goods to be delivered without having their own 5x QPs and quantum auto buy ready.

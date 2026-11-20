# Emotion Checkers

## Chinese checkers with a twist using the emotion colors from Inside Out

### Building this game to play with my family and friends

#### https://tinyurl.com/emotion-checkers 

<details>
  <summary>Possible future variations:</summary>
  <ul>
    <li>
      <strong>Character Powers:</strong> Each character has a special ability that can change the rules. For example, one character can "jump" two spaces at once, while another can block moves for a turn.
    </li>
    <li>
      <strong>Reverse Objective:</strong> Instead of trying to get all your pieces across the board to the opposite corner, you need to keep your pieces in your starting area while forcing others to move theirs out.
    </li>
    <li>
      <strong>Warp Zones:</strong> Add areas on the board that act as portals, allowing players to teleport their pieces to random parts of the board. This could be a feature tied to a specific character's power.
    </li>
    <li>
      <strong>Timed Moves:</strong> Players must complete their moves within a short time limit, adding an element of pressure.
    </li>
    <li>
      <strong>Dynamic Obstacles:</strong> Have barriers or obstacles that can be placed or moved around the board by certain characters, making it harder for others to move.
    </li>
    <li>
      <strong>Inner Power-ups:</strong> Introduce inner power-ups (representing emotions) scattered around the board that give temporary boosts, like moving extra spaces or jumping multiple times.
    </li>
  </ul>
</details>

### This project is built using - React + TypeScript + Vite

### Family rooms

Configure the server secret `FAMILY_ACCESS_CODE` to enable private rooms. Missing or incorrect codes block all room requests. Share the code privately and rotate it on the server to revoke access. On the game page, unlock **Private multiplayer** with the code, then open **Play online with family**, choose 2, 3, 4, or 6 players and create a room. Share the family invite privately. Each browser that joins claims a seat. The game starts once all seats are filled. Keep the room URL to reconnect from the same browser profile. Board rotation, hints and emoji settings are personal to each screen.

The Node server serves both the built React app and the room API. With Node 22.13 or newer, run `npm ci`, `npm run build`, then `npm start`. Open port 3000, or set `PORT`. Run the room test after building with `node --test tests/family-room.test.mjs`.

On Azure App Service use one Node instance, Node 22.13 or later, and persistent writable storage. The default database directory is `$HOME/data/emotion-checkers` on App Service. Override it with `ROOM_DATA_DIR` if needed. A frontend-only Static Web Apps deployment also needs a backend serving `/api/rooms/*` for online games.

Online play admits up to 100,000 metered room API requests per UTC calendar month. Each minute, the server allows up to 36 requests across challenges, room creation and joining, and 180 other room requests. Limit checks are shared by all rooms and persist across server restarts. Change `monthLimit` in `server/guard.ts` to tune the monthly allowance. Host billing also covers traffic outside the game API.

The browser solves a short ALTCHA proof-of-work puzzle when creating or joining a room. The signed puzzle expires after three minutes and is bound to that room, seat credential and action. Returning players use their existing seat. The client pauses polling on hidden tabs and finished games.

### GitHub Pages

[Play Emotion Checkers](https://harikayedidi.github.io/emotion-checkers/). The static frontend lives in the personal Pages repository under `emotion-checkers/`. Set `VITE_ROOM_API_ORIGIN` to the multiplayer server origin and run `npm run build:pages` to regenerate `dist/`. Local and same-origin builds use `/api/rooms/` by default.

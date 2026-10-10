/* Pick by video ID, so a reordered playlist still avoids the previous opener. */
export function chooseOpeningTrack(videos, previous, random = Math.random) {
  const choices = videos.map((video, index) => ({video, index}));
  const fresh = choices.filter(({video}) => video !== previous);
  const pool = fresh.length ? fresh : choices;
  if (!pool.length) return null;
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
}

export async function waitForPlaylist(player, {attempts = 40, delay = 200, sleep = ms => new Promise(resolve => setTimeout(resolve, ms))} = {}) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const videos = player.getPlaylist() || [];
    if (videos.length) return videos;
    if (attempt + 1 < attempts) await sleep(delay);
  }
  return [];
}

// اجرای زنده‌ی end-to-end علیه API در حال اجرا (دیتابیس واقعی).
// راه‌اندازی سرور، سپس:  node apps/api/scripts/live-demo.mjs
const API = process.env.API ?? 'http://localhost:4000/api';

async function post(path, body, token) {
  const res = await fetch(API + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) throw new Error(`POST ${path} -> ${res.status} ${await res.text()}`);
  return res.json().catch(() => ({}));
}

async function get(path, token) {
  const res = await fetch(API + path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  return res.json();
}

async function main() {
  const stamp = Date.now();
  const users = [];
  for (let i = 0; i < 4; i++) {
    const r = await post('/auth/register', {
      email: `live${stamp}_${i}@test.local`,
      password: 'password123',
      displayName: `Player${i}`,
    });
    users.push({ token: r.accessToken, id: r.user.id, name: r.user.displayName });
  }
  console.log('✅ registered', users.length, 'users in the real DB');

  const t = await post(
    '/tournaments',
    { title: 'Live Demo Cup', game: 'FC26', format: 'SINGLE_ELIM', genre: 'DUEL' },
    users[0].token,
  );
  console.log('✅ created tournament', t.id);

  for (const u of users) await post(`/tournaments/${t.id}/register`, { name: u.name }, u.token);
  console.log('✅ 4 players registered');

  await post(`/tournaments/${t.id}/start`, {}, users[0].token);
  console.log('✅ started');

  let guard = 0;
  while (true) {
    const cur = await get(`/tournaments/${t.id}`);
    if (cur.status === 'COMPLETED') break;
    if (guard++ > 50) throw new Error('did not converge');
    const ready = await get(`/tournaments/${t.id}/ready`);
    for (const m of ready) {
      await post(
        `/tournaments/${t.id}/matches/${m.id}/report`,
        { winnerId: m.participantIds[0], score: '2-1' },
        users[0].token,
      );
    }
  }
  console.log('✅ all matches played');

  const standings = await get(`/tournaments/${t.id}/standings`);
  const resultsList = await get(`/tournaments/${t.id}/results`);
  const games = await get('/tournaments/games');

  console.log('🏆 champion:', standings[0].name, '(rank ' + standings[0].rank + ')');
  console.log('📊 standings:', standings.map((s) => `${s.rank}.${s.name}(${s.points})`).join('  '));
  console.log('🎮 games catalog:', JSON.stringify(games));
  console.log('📜 results:', resultsList.length, 'matches; sample score:', resultsList[0]?.score);

  if (standings.length !== 4) throw new Error('standings length != 4');
  if (!standings[0].name) throw new Error('no champion');
  if (resultsList[0]?.score !== '2-1') throw new Error('score not persisted');
  console.log('\n✅✅ LIVE END-TO-END PASSED against a real SQLite database');
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});

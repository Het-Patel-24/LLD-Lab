const fs = require('fs');
const path = require('path');

const dbPath = process.env.VERCEL 
  ? path.join('/tmp', 'db.json')
  : path.join(__dirname, '../../data/db.json');

function read() {
  try {
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch {
    return { attempts: [] };
  }
}

function write(db) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

function create(attempt) {
  const db = read();
  db.attempts.push(attempt);
  write(db);
  return attempt;
}

function find(id) {
  return read().attempts.find(a => a.id === id);
}

function update(id, patch) {
  const db = read();
  const i = db.attempts.findIndex(a => a.id === id);
  if (i < 0) return null;
  db.attempts[i] = { ...db.attempts[i], ...patch };
  write(db);
  return db.attempts[i];
}

function byProblem(problemId) {
  return read()
    .attempts.filter(a => a.problemId === problemId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

module.exports = { create, find, update, byProblem };

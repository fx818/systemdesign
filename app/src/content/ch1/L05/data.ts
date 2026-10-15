/** Shared data for Level 5 (scene, quiz and mini-game). */

export type Target = 'primary' | 'replica';

export interface QueryCard {
  id: string;
  sql: string;
  /** What the query does, in plain words. */
  what: string;
  answer: Target;
  why: string;
}

/** SQL statements for the "Query Router" mini-game. */
export const QUERIES: QueryCard[] = [
  { id: 'feed', sql: 'SELECT * FROM photos WHERE owner_id IN (…) ORDER BY created_at DESC LIMIT 20;', what: 'Load the home feed', answer: 'replica', why: 'A read. Reads are served by replicas.' },
  { id: 'upload', sql: "INSERT INTO photos (owner_id, url) VALUES (42, 'cat.jpg');", what: 'Upload a photo', answer: 'primary', why: 'INSERT modifies data, so it must go to the master (primary).' },
  { id: 'profile', sql: 'SELECT username, bio FROM users WHERE id = 42;', what: 'Open a profile', answer: 'replica', why: 'A plain read: send it to a replica.' },
  { id: 'rename', sql: "UPDATE users SET bio = 'cat person' WHERE id = 42;", what: 'Edit your bio', answer: 'primary', why: 'UPDATE changes data. Only the master accepts writes.' },
  { id: 'join', sql: 'SELECT u.username, p.url FROM users u JOIN photos p ON p.owner_id = u.id WHERE u.id = 7;', what: "Show mom's photos with her name", answer: 'replica', why: 'Even a fancy JOIN is still a read. Replicas handle it.' },
  { id: 'unlike', sql: 'DELETE FROM likes WHERE user_id = 42 AND photo_id = 9;', what: 'Un-like a photo', answer: 'primary', why: 'DELETE modifies data, so it goes to the master.' },
  { id: 'count', sql: 'SELECT COUNT(*) FROM likes WHERE photo_id = 9;', what: 'Show the like counter', answer: 'replica', why: 'Counting rows only reads them. Replica.' },
  { id: 'comment', sql: "INSERT INTO comments (photo_id, user_id, body) VALUES (9, 42, 'so cute');", what: 'Post a comment', answer: 'primary', why: 'A new row is a write: master only.' },
  { id: 'search', sql: "SELECT id FROM users WHERE username LIKE 'rav%';", what: 'Search for a friend', answer: 'replica', why: 'Searching is reading. Replica.' },
  { id: 'ban', sql: 'UPDATE photos SET hidden = true WHERE id = 13;', what: 'Hide a spam photo', answer: 'primary', why: 'Changing a column is an UPDATE: master.' },
  { id: 'album', sql: 'SELECT * FROM albums WHERE owner_id = 42;', what: 'List your albums', answer: 'replica', why: 'Read-only. Replica.' },
  { id: 'deleteacct', sql: 'DELETE FROM sessions WHERE user_id = 42;', what: 'Log out everywhere', answer: 'primary', why: 'Deleting rows modifies data: master.' },
];

/** Seconds a query card stays before it "times out" in the mini-game. */
export const ROUTER_TIME = 7;

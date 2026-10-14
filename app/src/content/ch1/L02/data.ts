/** Shared data for Level 2 (scene, quiz and mini-game). */

export const USERS_ROWS: (string | number)[][] = [
  [1, 'maya', 'Bengaluru'],
  [2, 'ravi', 'Pune'],
  [3, 'mom', 'Bengaluru'],
];

export const PHOTOS_ROWS: (string | number)[][] = [
  [101, 1, 'launch.jpg'],
  [102, 3, 'cat.jpg'],
  [103, 3, 'cat-again.jpg'],
  [104, 2, 'diagram.png'],
];

export const JOIN_SQL = `SELECT u.username, p.title
FROM users u
JOIN photos p ON p.user_id = u.id
WHERE u.id = 3;`;

/** The four cases from the book where a non-relational database might be the right choice (p. 8). */
export const NOSQL_FITS = [
  { title: 'You need super-low latency', example: 'e.g. a like counter read thousands of times per second' },
  { title: 'Data is unstructured or not relational', example: 'e.g. free-form photo metadata, no joins needed' },
  { title: 'You only serialize / deserialize', example: 'e.g. stash a JSON, XML or YAML blob and read it back' },
  { title: 'You store a massive amount of data', example: 'e.g. billions of photo-view events' },
];

export type Store = 'sql' | 'nosql';
export interface FeatureCard {
  id: string;
  feature: string;
  detail: string;
  answer: Store;
  /** For NoSQL answers: which family fits best. */
  family?: 'Key-value' | 'Graph' | 'Column' | 'Document';
  why: string;
}

/** PixelPost features for the "SQL or NoSQL?" sorting mini-game. */
export const FEATURES: FeatureCard[] = [
  {
    id: 'profiles',
    feature: 'User accounts & profiles',
    detail: 'Linked to photos, albums and payments; queried together all the time.',
    answer: 'sql',
    why: 'Structured, relational data you JOIN across tables. Exactly what relational databases do well.',
  },
  {
    id: 'likes',
    feature: 'Live like counter',
    detail: 'Read on every photo view; must answer in about a millisecond.',
    answer: 'nosql',
    family: 'Key-value',
    why: 'Super-low latency is one of the cases where NoSQL fits. A key-value lookup (photo id to count) is all it needs.',
  },
  {
    id: 'exif',
    feature: 'Photo EXIF metadata',
    detail: 'Every camera writes different fields; some photos have none.',
    answer: 'nosql',
    family: 'Document',
    why: 'Unstructured data with no fixed schema and no relations: a natural fit for a document store.',
  },
  {
    id: 'follows',
    feature: 'Who follows whom',
    detail: 'Friends of friends, "people you may know" suggestions.',
    answer: 'nosql',
    family: 'Graph',
    why: 'Connections between people are a graph. A graph store, one of the four NoSQL families, is built for this.',
  },
  {
    id: 'sessions',
    feature: 'Login session blobs',
    detail: 'Store a JSON blob by session id, read it back whole.',
    answer: 'nosql',
    family: 'Key-value',
    why: 'You only serialize and deserialize the data (JSON in, JSON out). That is a textbook NoSQL case.',
  },
  {
    id: 'payments',
    feature: 'Pro subscription payments',
    detail: 'Each payment belongs to a user and a plan; finance runs reports joining them.',
    answer: 'sql',
    why: 'Relational data with joins across users, plans and payments. Relational databases have handled this reliably for decades.',
  },
  {
    id: 'views',
    feature: 'Photo view events',
    detail: 'Billions of rows, every view of every photo, forever.',
    answer: 'nosql',
    family: 'Column',
    why: 'A massive amount of data is one of the four NoSQL cases. Column stores like Cassandra or HBase are built for that scale.',
  },
  {
    id: 'albums',
    feature: 'Albums and their photos',
    detail: 'An album has many photos, a photo has an owner; list "mom\'s albums with cover photos".',
    answer: 'sql',
    why: 'Tables and rows with clear relationships, queried with joins. Stick with the relational default.',
  },
  {
    id: 'comments',
    feature: 'Comments on photos',
    detail: 'Each comment links a user and a photo; show the author name next to each.',
    answer: 'sql',
    why: 'Comments relate users to photos, and you join them to show author names. Classic relational modelling.',
  },
];

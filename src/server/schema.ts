// Database schema migrations for Chatworld.
// Each entry is applied in order and recorded in _migrations.

export interface Migration {
  name: string;
  sql: string;
}

export const MIGRATIONS: Migration[] = [
  {
    name: "001_core_users",
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        avatar TEXT,
        bio TEXT,
        plan TEXT NOT NULL DEFAULT 'free',
        is_admin INTEGER NOT NULL DEFAULT 0,
        age_verified INTEGER NOT NULL DEFAULT 0,
        settings TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    `,
  },
  {
    name: "002_personas",
    sql: `
      CREATE TABLE IF NOT EXISTS personas (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        age TEXT,
        occupation TEXT,
        personality TEXT NOT NULL DEFAULT '',
        appearance TEXT NOT NULL DEFAULT '',
        background TEXT NOT NULL DEFAULT '',
        avatar TEXT,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_personas_user ON personas(user_id);
    `,
  },
  {
    name: "003_characters",
    sql: `
      CREATE TABLE IF NOT EXISTS characters (
        id TEXT PRIMARY KEY,
        creator_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        name TEXT NOT NULL,
        avatar TEXT,
        banner TEXT,
        age TEXT,
        gender TEXT,
        species TEXT,
        occupation TEXT,
        tags TEXT NOT NULL DEFAULT '[]',
        short_description TEXT NOT NULL DEFAULT '',
        public_description TEXT NOT NULL DEFAULT '',
        greetings TEXT NOT NULL DEFAULT '[]',
        is_public INTEGER NOT NULL DEFAULT 0,
        allow_remix INTEGER NOT NULL DEFAULT 1,
        visibility TEXT NOT NULL DEFAULT 'private',
        definition TEXT NOT NULL DEFAULT '{}',
        personality TEXT NOT NULL DEFAULT '{}',
        world_id TEXT,
        scenario_id TEXT,
        remixed_from TEXT,
        stats TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_characters_creator ON characters(creator_id);
      CREATE INDEX IF NOT EXISTS idx_characters_public ON characters(is_public);
    `,
  },
  {
    name: "004_worlds_lore_scenarios_stories",
    sql: `
      CREATE TABLE IF NOT EXISTS worlds (
        id TEXT PRIMARY KEY,
        creator_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        genre TEXT NOT NULL DEFAULT '',
        artwork TEXT,
        timeline TEXT,
        locations TEXT NOT NULL DEFAULT '[]',
        factions TEXT NOT NULL DEFAULT '[]',
        characters TEXT NOT NULL DEFAULT '[]',
        creatures TEXT NOT NULL DEFAULT '[]',
        items TEXT NOT NULL DEFAULT '[]',
        magic_system TEXT,
        technology TEXT,
        politics TEXT,
        history TEXT,
        rules TEXT,
        events TEXT NOT NULL DEFAULT '[]',
        custom_lore TEXT NOT NULL DEFAULT '[]',
        is_public INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS lore_entries (
        id TEXT PRIMARY KEY,
        world_id TEXT REFERENCES worlds(id) ON DELETE CASCADE,
        character_id TEXT REFERENCES characters(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        keywords TEXT NOT NULL DEFAULT '[]',
        aliases TEXT NOT NULL DEFAULT '[]',
        content TEXT NOT NULL DEFAULT '',
        priority INTEGER NOT NULL DEFAULT 5,
        enabled INTEGER NOT NULL DEFAULT 1,
        always_active INTEGER NOT NULL DEFAULT 0,
        activation_probability REAL NOT NULL DEFAULT 0.75,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_lore_world ON lore_entries(world_id);
      CREATE INDEX IF NOT EXISTS idx_lore_character ON lore_entries(character_id);

      CREATE TABLE IF NOT EXISTS scenarios (
        id TEXT PRIMARY KEY,
        creator_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        location TEXT NOT NULL DEFAULT '',
        time TEXT NOT NULL DEFAULT '',
        situation TEXT NOT NULL DEFAULT '',
        characters TEXT NOT NULL DEFAULT '[]',
        starting_conditions TEXT NOT NULL DEFAULT '',
        objectives TEXT NOT NULL DEFAULT '',
        rules TEXT NOT NULL DEFAULT '',
        is_public INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS stories (
        id TEXT PRIMARY KEY,
        creator_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        cover TEXT,
        description TEXT NOT NULL DEFAULT '',
        genre TEXT NOT NULL DEFAULT '',
        world_id TEXT REFERENCES worlds(id) ON DELETE SET NULL,
        characters TEXT NOT NULL DEFAULT '[]',
        is_public INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
    `,
  },
  {
    name: "005_conversations_branches_messages",
    sql: `
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        character_id TEXT REFERENCES characters(id) ON DELETE SET NULL,
        persona_id TEXT REFERENCES personas(id) ON DELETE SET NULL,
        world_id TEXT REFERENCES worlds(id) ON DELETE SET NULL,
        scenario_id TEXT REFERENCES scenarios(id) ON DELETE SET NULL,
        title TEXT NOT NULL DEFAULT 'New story',
        mode TEXT NOT NULL DEFAULT 'character',
        settings TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        last_message_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);

      CREATE TABLE IF NOT EXISTS branches (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        parent_message_id TEXT,
        name TEXT NOT NULL DEFAULT 'main',
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_branches_conversation ON branches(conversation_id);

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        branch_id TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL DEFAULT '',
        structured TEXT,
        model TEXT,
        parent_id TEXT,
        is_canonical INTEGER NOT NULL DEFAULT 1,
        swipes TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_messages_branch ON messages(branch_id, created_at);
    `,
  },
  {
    name: "006_memory_relationship_state",
    sql: `
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        character_id TEXT REFERENCES characters(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL DEFAULT 'event',
        importance REAL NOT NULL DEFAULT 0.5,
        content TEXT NOT NULL,
        participants TEXT NOT NULL DEFAULT '[]',
        location TEXT,
        emotional_impact TEXT,
        is_pinned INTEGER NOT NULL DEFAULT 0,
        is_important INTEGER NOT NULL DEFAULT 0,
        source TEXT NOT NULL DEFAULT 'auto',
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_memories_conversation ON memories(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_memories_character ON memories(character_id);

      CREATE TABLE IF NOT EXISTS relationships (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        stage TEXT NOT NULL DEFAULT 'Acquaintance',
        trust INTEGER NOT NULL DEFAULT 50,
        affection INTEGER NOT NULL DEFAULT 40,
        respect INTEGER NOT NULL DEFAULT 45,
        fear INTEGER NOT NULL DEFAULT 0,
        attraction INTEGER NOT NULL DEFAULT 0,
        loyalty INTEGER NOT NULL DEFAULT 30,
        familiarity INTEGER NOT NULL DEFAULT 0,
        suspicion INTEGER NOT NULL DEFAULT 0,
        history TEXT NOT NULL DEFAULT '[]',
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_relationships_conversation ON relationships(conversation_id);

      CREATE TABLE IF NOT EXISTS world_state (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL UNIQUE REFERENCES conversations(id) ON DELETE CASCADE,
        world_id TEXT,
        date TEXT NOT NULL DEFAULT 'Day 1',
        time_of_day TEXT NOT NULL DEFAULT 'morning',
        season TEXT NOT NULL DEFAULT 'spring',
        weather TEXT NOT NULL DEFAULT 'clear',
        current_location TEXT NOT NULL DEFAULT '',
        npc_locations TEXT NOT NULL DEFAULT '{}',
        mutable TEXT NOT NULL DEFAULT '{}',
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS canonical_events (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        character_id TEXT,
        type TEXT NOT NULL,
        before TEXT NOT NULL DEFAULT '{}',
        after TEXT NOT NULL DEFAULT '{}',
        cause TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_events_conversation ON canonical_events(conversation_id);
    `,
  },
  {
    name: "006b_kv_store",
    sql: `
      CREATE TABLE IF NOT EXISTS kv_store (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `,
  },
  {
    name: "007_social_usage_notifications",
    sql: `
      CREATE TABLE IF NOT EXISTS follows (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        target_id TEXT NOT NULL,
        target_type TEXT NOT NULL DEFAULT 'user',
        created_at TEXT NOT NULL,
        UNIQUE(user_id, target_id, target_type)
      );

      CREATE TABLE IF NOT EXISTS likes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        target_id TEXT NOT NULL,
        target_type TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(user_id, target_id, target_type)
      );

      CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        target_id TEXT NOT NULL,
        target_type TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(user_id, target_id, target_type)
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        read INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);

      CREATE TABLE IF NOT EXISTS usage (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        conversation_id TEXT,
        model TEXT NOT NULL,
        input_tokens INTEGER NOT NULL DEFAULT 0,
        output_tokens INTEGER NOT NULL DEFAULT 0,
        cost REAL NOT NULL DEFAULT 0,
        latency_ms INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS chapter_summaries (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        chapter INTEGER NOT NULL,
        title TEXT NOT NULL DEFAULT '',
        summary TEXT NOT NULL DEFAULT '',
        events TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL
      );
    `,
  },
  {
    name: "008_points",
    sql: `
      CREATE TABLE IF NOT EXISTS point_balances (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        balance INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS point_transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        kind TEXT NOT NULL,
        note TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_point_transactions_user ON point_transactions(user_id, created_at);

      CREATE TABLE IF NOT EXISTS point_claims (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        last_claim_date TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS point_codes (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        amount INTEGER NOT NULL,
        used_by TEXT,
        created_at TEXT NOT NULL
      );
    `,
  },
  {
    name: "009_point_streaks",
    sql: `
      ALTER TABLE point_claims ADD COLUMN streak INTEGER NOT NULL DEFAULT 0;
    `,
  },
  {
    name: "010_admin",
    sql: `
      ALTER TABLE users ADD COLUMN banned INTEGER NOT NULL DEFAULT 0;

      CREATE TABLE IF NOT EXISTS admin_audit (
        id TEXT PRIMARY KEY,
        admin_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        target_user_id TEXT,
        detail TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit(created_at);
    `,
  },
  {
    name: "011_billing",
    sql: `
      CREATE TABLE IF NOT EXISTS plans (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        price_cents INTEGER NOT NULL DEFAULT 0,
        currency TEXT NOT NULL DEFAULT 'usd',
        interval TEXT NOT NULL DEFAULT 'month',
        stripe_price_id TEXT,
        features TEXT NOT NULL DEFAULT '{}',
        blurb TEXT NOT NULL DEFAULT '',
        active INTEGER NOT NULL DEFAULT 1,
        sort INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS credit_packages (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        credits INTEGER NOT NULL,
        price_cents INTEGER NOT NULL,
        currency TEXT NOT NULL DEFAULT 'usd',
        stripe_price_id TEXT,
        active INTEGER NOT NULL DEFAULT 1,
        sort INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        kind TEXT NOT NULL,
        item_ref TEXT NOT NULL DEFAULT '',
        stripe_session_id TEXT,
        stripe_customer_id TEXT,
        amount_cents INTEGER NOT NULL,
        currency TEXT NOT NULL DEFAULT 'usd',
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_payments_session ON payments(stripe_session_id);

      CREATE TABLE IF NOT EXISTS subscriptions (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        plan_code TEXT NOT NULL,
        stripe_subscription_id TEXT,
        stripe_customer_id TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        current_period_end TEXT,
        updated_at TEXT NOT NULL
      );
    `,
  },
  {
    name: "012_billing_provider",
    sql: `
      ALTER TABLE payments ADD COLUMN provider TEXT NOT NULL DEFAULT 'stripe';
    `,
  },
  {
    name: "013_story_engine",
    sql: `
      CREATE TABLE IF NOT EXISTS quests (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        objectives TEXT NOT NULL DEFAULT '[]',
        status TEXT NOT NULL DEFAULT 'active',
        difficulty TEXT NOT NULL DEFAULT 'normal',
        reward TEXT NOT NULL DEFAULT '',
        giver TEXT NOT NULL DEFAULT '',
        source TEXT NOT NULL DEFAULT 'auto',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        completed_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_quests_conversation ON quests(conversation_id);

      CREATE TABLE IF NOT EXISTS inventory_items (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        rarity TEXT NOT NULL DEFAULT 'common',
        quantity INTEGER NOT NULL DEFAULT 1,
        weight REAL NOT NULL DEFAULT 0,
        effects TEXT NOT NULL DEFAULT '',
        lore TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_inventory_conversation ON inventory_items(conversation_id);
    `,
  },
  {
    name: "014_feedback",
    sql: `
      CREATE TABLE IF NOT EXISTS feedback (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        contact TEXT NOT NULL DEFAULT '',
        message TEXT NOT NULL,
        read INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at DESC);
    `,
  },
  {
    name: "015_drop_legacy_art",
    sql: `
      UPDATE characters SET avatar = NULL
       WHERE avatar IN ('/avatars/elena.png', '/avatars/raven.png', '/avatars/marcus.png');
      UPDATE worlds SET artwork = NULL
       WHERE artwork = '/avatars/ashen-kingdom.png';
    `,
  },
  {
    name: "016_drop_legacy_story_avatar",
    sql: `
      UPDATE characters SET avatar = NULL
       WHERE avatar = '/avatars/ashen-kingdom.png';
    `,
  },
  {
    name: "017_relink_legacy_art",
    sql: `
      UPDATE characters SET avatar = '/avatars/elena.jpg'  WHERE name = 'Elena';
      UPDATE characters SET avatar = '/avatars/raven.jpg'  WHERE name = 'Raven';
      UPDATE characters SET avatar = '/avatars/marcus.jpg' WHERE name = 'Marcus';
      UPDATE characters SET avatar = '/avatars/ashen-kingdom.jpg' WHERE name = 'The Ashen Road';
      UPDATE worlds SET artwork = '/avatars/ashen-kingdom.jpg' WHERE name = 'The Ashen Kingdom';
    `,
  },
  {
    name: "020_retired_asset_cleanup",
    sql: `
      DELETE FROM messages WHERE conversation_id IN (
        SELECT id FROM conversations WHERE character_id IN (
          SELECT id FROM characters WHERE avatar = '/avatars/vc-01.jpg'));
      DELETE FROM memories WHERE character_id IN (
        SELECT id FROM characters WHERE avatar = '/avatars/vc-01.jpg');
      DELETE FROM relationships WHERE character_id IN (
        SELECT id FROM characters WHERE avatar = '/avatars/vc-01.jpg');
      DELETE FROM conversations WHERE character_id IN (
        SELECT id FROM characters WHERE avatar = '/avatars/vc-01.jpg');
      DELETE FROM characters WHERE avatar = '/avatars/vc-01.jpg';
    `,
  },
  {
    name: "021_story_asset_fix",
    sql: `
      UPDATE stories SET cover = '/avatars/ashen-kingdom.jpg'
       WHERE cover = '/avatars/ashen-kingdom.png';
    `,
  },
  {
    name: "022_story_artwork",
    sql: `
      UPDATE stories SET cover = '/avatars/ninth-bell.jpg'   WHERE id = 'sty_ninth_bell';
      UPDATE stories SET cover = '/avatars/glass-season.jpg' WHERE id = 'sty_glass_season';
      UPDATE stories SET cover = '/avatars/understudy.jpg'   WHERE id = 'sty_understudy';
      UPDATE stories SET cover = '/avatars/salt-and-iron.jpg' WHERE id = 'sty_salt_and_iron';
      UPDATE stories SET cover = '/avatars/last-summer.jpg'  WHERE id = 'sty_last_summer';
      UPDATE characters SET avatar = '/avatars/ninth-bell.jpg'   WHERE id = 'chr_story_ninth_bell';
      UPDATE characters SET avatar = '/avatars/glass-season.jpg' WHERE id = 'chr_story_glass_season';
      UPDATE characters SET avatar = '/avatars/understudy.jpg'   WHERE id = 'chr_story_understudy';
      UPDATE characters SET avatar = '/avatars/salt-and-iron.jpg' WHERE id = 'chr_story_salt_and_iron';
      UPDATE characters SET avatar = '/avatars/last-summer.jpg'  WHERE id = 'chr_story_last_summer';
    `,
  },
];

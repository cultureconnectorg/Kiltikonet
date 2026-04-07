// omega.ts — Interfaces TypeScript completes pour Kiltikonet Omega
// Fichier de REFERENCE uniquement (le frontend est en JSX, pas TSX)
// Date : 2026-04-07

// ═══════ FEED ═══════

/** Post dans le feed social */
export interface FeedPost {
  id: string;
  author_id: string;
  author_name: string;
  author_image: string;
  author_title: string;
  author_country: string;
  /** Contenu textuel du post */
  content: string;
  /** Type de media : text, video, reel, image */
  post_type: 'text' | 'video' | 'reel' | 'image';
  is_reel: boolean;
  video_url?: string;
  thumbnail_url?: string;
  duration?: string;
  dimension?: string;
  /** IDs des utilisateurs ayant like */
  likes: string[];
  likes_count: number;
  /** Eclairs = reaction premium (coute 1 KT) */
  eclairs_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  comments: FeedComment[];
  /** Post genere par un ghost profile */
  is_ghost: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeedComment {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

/** Reaction Eclair = like premium debitant 1 KT */
export interface FeedEclair {
  post_id: string;
  user_id: string;
  user_frek_id: string;
  kt_debited: number;
  timestamp: string;
}

// ═══════ MESSAGES / DMs ═══════

export interface DMConversation {
  id: string;
  participants: string[];
  participant_names: string[];
  last_message: string;
  last_message_at: string;
  unread: number;
  created_at: string;
}

export interface DMMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  read: boolean;
  created_at: string;
}

// ═══════ AGENDA ═══════

export interface AgendaDay {
  /** Format YYYY-MM-DD */
  date: string;
  /** Nom du jour (ex: "Vendredi 15 nov.") */
  label: string;
  slots: AgendaSlot[];
}

export interface AgendaSlot {
  id: string;
  /** Heure de debut (HH:MM) */
  start_time: string;
  /** Heure de fin (HH:MM) */
  end_time: string;
  title: string;
  description: string;
  /** Lieu dans l'enceinte */
  location: string;
  category: 'conference' | 'atelier' | 'spectacle' | 'exposition' | 'networking';
  artistes: AgendaArtiste[];
}

export interface AgendaArtiste {
  name: string;
  frek_id?: string;
  role: string;
  photo_url?: string;
}

// ═══════ SHOP / MARKETPLACE ═══════

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: 'ticketing' | 'musique' | 'art' | 'gastronomie' | 'mode' | 'litterature' | 'formation' | 'pack_kt';
  badge?: string;
  stock: number;
  /** URL image produit */
  image_url?: string;
  active: boolean;
  order: number;
  created_at: string;
}

export interface ShopPack {
  id: string;
  name: string;
  tokens: number;
  price: number;
  currency: string;
  bonus_pct: number;
  badge?: string;
  marketing_label: string;
  validity_extension: boolean;
  validity_note: string;
  legal_entity: string;
}

export interface ShopOrder {
  id: string;
  user_id: string;
  user_frek_id: string;
  items: Array<{ item_id: string; quantity: number; price: number }>;
  total: number;
  currency: string;
  payment_status: 'pending' | 'completed' | 'refunded' | 'failed';
  stripe_session_id?: string;
  created_at: string;
  completed_at?: string;
}

// ═══════ TRADE ═══════

export interface TradeOrder {
  order_id: string;
  user_frek_id: string;
  user_id: string;
  offer_type: 'buy' | 'sell';
  token_type: 'KT' | 'CC';
  amount: number;
  price_eur_per_token: number;
  total_eur: number;
  status: 'pending' | 'matched' | 'completed' | 'cancelled';
  matched_with?: string;
  created_at: string;
  completed_at?: string;
}

export interface TradeMatch {
  match_id: string;
  buy_order_id: string;
  sell_order_id: string;
  amount: number;
  price_per_token: number;
  fee_pct: number;
  completed_at: string;
}

// ═══════ ADHESION ═══════

export interface AdhesionLevel {
  id: string;
  name: string;
  price_eur_monthly: number;
  price_eur_annual: number;
  benefits: string[];
  quota_kt: number;
  quota_cc: number;
  brain_quota: number;
  studio_uploads: number;
  terminal_deploys: number;
  governance_weight: number;
}

export interface AdhesionSubscription {
  id: string;
  user_id: string;
  user_frek_id: string;
  level_id: string;
  level_name: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  stripe_subscription_id?: string;
  started_at: string;
  expires_at: string;
  auto_renew: boolean;
}

// ═══════ GOUVERNANCE ═══════

export interface GovernanceProposal {
  id: string;
  title: string;
  description: string;
  author_frek_id: string;
  author_name: string;
  category: 'budget' | 'event' | 'rule' | 'partnership' | 'other';
  status: 'open' | 'closed' | 'adopted' | 'rejected';
  votes_for: number;
  votes_against: number;
  votes_abstain: number;
  /** Votes ponderes par governance_weight */
  weighted_for: number;
  weighted_against: number;
  deadline: string;
  quorum_required: number;
  created_at: string;
}

export interface GovernanceVote {
  vote_id: string;
  proposal_id: string;
  voter_frek_id: string;
  voter_role: string;
  vote: 'for' | 'against' | 'abstain';
  weight: number;
  timestamp: string;
}

// ═══════ TERMINAL ═══════

export interface TerminalSession {
  session_id: string;
  user_frek_id: string;
  slug: string;
  current_html: string;
  started_at: string;
  last_edit_at: string;
}

export interface TerminalDeploy {
  deploy_id: string;
  user_frek_id: string;
  user_id: string;
  slug: string;
  title: string;
  html: string;
  version: number;
  is_current: boolean;
  url: string;
  created_at: string;
}

// ═══════ NFC SCAN ═══════

export interface NFCScan {
  scan_id: string;
  badge_id: string;
  agent_frek_id: string;
  zone_access: string;
  event_day: 1 | 2 | 3 | 4;
  scan_type: 'QR' | 'NFC' | 'MANUAL';
  timestamp: string;
}

export interface NFCScanResult {
  success: boolean;
  badge: {
    badge_id: string;
    prenom: string;
    nom: string;
    type_badge: string;
    statut: string;
    photo_url?: string;
  };
  message: string;
  scan_count_today: number;
}

// ═══════ USER SETTINGS ═══════

export interface UserSettings {
  profile: {
    full_name: string;
    bio: string;
    photo_url: string;
    language: 'fr' | 'kw' | 'en';
    frek_id: string;
    actor_role: string;
  };
  notifications: {
    email_enabled: boolean;
    push_enabled: boolean;
    in_app_enabled: boolean;
    brain_suggestions: boolean;
  };
  privacy: {
    profile_public: boolean;
    frek_id_public: boolean;
    show_in_catalog: boolean;
    show_in_directory: boolean;
  };
  preferences: {
    language: 'fr' | 'kw' | 'en';
    brain_language: 'fr' | 'kw' | 'en';
    theme: 'sovereign_onyx';
    currency_display: 'EUR';
  };
  security: {
    two_factor_enabled: boolean;
    active_sessions: number;
    last_login: string;
  };
  connections: {
    github_linked: boolean;
    frekcore_linked: boolean;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  bio?: string;
  photo_url?: string;
  profile_type: string;
  actor_role: string;
  frek_id: string;
  is_admin: boolean;
  cultural_practice?: string;
  genre_style?: string;
  registered_at: string;
}

// ═══════ FREK CERTIFICATION ═══════

/** Etape du cycle de certification FREK Luciole */
export type FrekStage = 'GENESIS' | 'WORKSHOP' | 'METAMORPHOSE' | 'EMISSION' | 'LEGACY';

export interface FrekWork {
  work_id: string;
  frek_id: string;
  title: string;
  type: 'musique' | 'art_visuel' | 'texte' | 'video' | 'spectacle' | 'autre';
  stage: FrekStage;
  /** Hash SHA256 du fichier source (fingerprint ~2.5KB) */
  fingerprint: string;
  /** Ratio : 3% visible, 97% invisible (metadata) */
  visible_hash: string;
  metadata: Record<string, unknown>;
  certified_at: string;
  created_at: string;
}

export interface FrekCertification {
  cert_id: string;
  work_id: string;
  frek_id: string;
  stage: FrekStage;
  previous_stage?: FrekStage;
  transition_reason: string;
  timestamp: string;
}

// ═══════ AUDIT LOG ═══════

export type AuditActionType =
  | 'FREK_CERTIFY' | 'FEED_POST' | 'FEED_ECLAIR' | 'FEED_COMMENT'
  | 'BRAIN_QUERY' | 'WALLET_CREDIT' | 'WALLET_DEBIT' | 'TRADE_ORDER'
  | 'SHOP_PURCHASE' | 'ADHESION_SUBSCRIBE' | 'GOUVERNANCE_VOTE'
  | 'TERMINAL_DEPLOY' | 'NFC_SCAN' | 'BADGE_EMIT' | 'BADGE_SCAN'
  | 'SETTINGS_UPDATE' | 'AUTH_LOGIN' | 'AUTH_LOGOUT';

export interface AuditLog {
  log_id: string;
  user_frek_id: string;
  action_type: AuditActionType;
  object_id: string;
  object_type: string;
  metadata: Record<string, unknown>;
  timestamp: string;
  /** SHA256 du log precedent pour chainee immuable */
  hash: string;
  session_id: string;
}

// ═══════ ADMIN ═══════

export interface AdminStats {
  total_users: number;
  total_badges: number;
  total_transactions: number;
  total_kt_circulating: number;
  active_users_30d: number;
  revenue_eur_30d: number;
}

export interface AdminBadgeStat {
  type_badge: string;
  count: number;
  active_count: number;
  nfc_enabled_count: number;
}

// ═══════ WALLET ═══════

export interface Wallet {
  wallet_id: string;
  user_id: string;
  frek_id?: string;
  balance: number;
  currency: 'KT' | 'CC';
  total_earned: number;
  total_purchased: number;
  total_received: number;
  total_spent: number;
  status: 'active' | 'frozen' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  tx_id: string;
  wallet_id: string;
  user_id: string;
  type: 'credit' | 'debit' | 'purchase' | 'transfer_in' | 'transfer_out' | 'consumption';
  amount: number;
  balance_after: number;
  description: string;
  channel: string;
  metadata: {
    from_role?: string;
    to_role?: string;
    cc_flow_applied?: string;
    [key: string]: unknown;
  };
  created_at: string;
}

// ═══════ BRAIN ═══════

export interface BrainMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  /** Processus de reflexion visible (thought process) */
  thinking?: string;
  tool_used?: string;
}

export type BrainToolId = 'terminal' | 'code' | 'layout' | 'globe' | 'analyse' | 'web-search';

export interface BrainTool {
  id: BrainToolId;
  label: string;
  icon: string;
  endpoint: string;
}

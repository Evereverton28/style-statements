-- ============================================================
--  STYLE STATEMENTS · PostgreSQL schema (v1)
--  Nairobi, Kenya · e-commerce platform
--  Conventions: snake_case, UUID PKs, TIMESTAMPTZ, money in cents (KES)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()

-- ---------- ENUM types ----------
CREATE TYPE user_role       AS ENUM ('super_admin', 'manager', 'staff', 'customer');
CREATE TYPE order_status    AS ENUM ('pending', 'processing', 'ready_for_delivery', 'delivered', 'cancelled', 'refund_requested', 'refunded');
CREATE TYPE payment_method  AS ENUM ('mpesa', 'card', 'cash_on_delivery');
CREATE TYPE payment_status  AS ENUM ('unpaid', 'pending', 'paid', 'failed', 'refunded');
CREATE TYPE coupon_type     AS ENUM ('percent', 'fixed', 'free_shipping');
CREATE TYPE review_status   AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE message_channel AS ENUM ('contact_form', 'whatsapp', 'enquiry');

-- ============================================================
--  USERS & AUTH
-- ============================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name       TEXT NOT NULL,
    email           CITEXT UNIQUE NOT NULL,          -- case-insensitive
    phone           TEXT,                             -- e.g. +254704358866
    password_hash   TEXT,                             -- NULL if OAuth/Firebase only
    firebase_uid    TEXT UNIQUE,                      -- if using Firebase Auth
    role            user_role NOT NULL DEFAULT 'customer',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_role ON users(role);

CREATE TABLE addresses (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label         TEXT,                               -- 'Home', 'Office'
    recipient     TEXT NOT NULL,
    phone         TEXT NOT NULL,
    line1         TEXT NOT NULL,
    city          TEXT NOT NULL DEFAULT 'Nairobi',
    county        TEXT,
    country       TEXT NOT NULL DEFAULT 'Kenya',
    is_default    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_addresses_user ON addresses(user_id);

-- ============================================================
--  CATALOG
-- ============================================================
CREATE TABLE categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,                        -- 'Jewelry', 'Sunglasses', 'Perfumes'
    slug        TEXT UNIQUE NOT NULL,
    parent_id   UUID REFERENCES categories(id) ON DELETE SET NULL,  -- subcategories: Rings, Aviator...
    sort_order  INT NOT NULL DEFAULT 0
);
CREATE INDEX idx_categories_parent ON categories(parent_id);

CREATE TABLE products (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name           TEXT NOT NULL,
    slug           TEXT UNIQUE NOT NULL,
    category_id    UUID REFERENCES categories(id) ON DELETE SET NULL,
    description    TEXT,
    specs          JSONB NOT NULL DEFAULT '{}',       -- {"Material": "...", "Size": "..."}
    price_cents    BIGINT NOT NULL CHECK (price_cents >= 0),   -- KES * 100
    compare_at_cents BIGINT,                          -- original price for "on sale"
    stock          INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    low_stock_at   INT NOT NULL DEFAULT 5,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured    BOOLEAN NOT NULL DEFAULT FALSE,
    badge          TEXT,                              -- 'New', 'Best seller'
    rating_avg     NUMERIC(2,1) NOT NULL DEFAULT 0,
    rating_count   INT NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active   ON products(is_active) WHERE is_active;

CREATE TABLE product_images (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url         TEXT NOT NULL,                        -- Cloudinary / Firebase Storage URL
    alt         TEXT,
    is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order  INT NOT NULL DEFAULT 0
);
CREATE INDEX idx_product_images_product ON product_images(product_id);

-- ============================================================
--  CART & WISHLIST  (server-persisted; guest carts key off session_id)
-- ============================================================
CREATE TABLE carts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id  TEXT,                                 -- for guests
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE cart_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id     UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity    INT NOT NULL CHECK (quantity > 0),
    UNIQUE (cart_id, product_id)
);
CREATE TABLE wishlist_items (
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, product_id)
);

-- ============================================================
--  ORDERS
-- ============================================================
CREATE TABLE orders (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number      TEXT UNIQUE NOT NULL,           -- 'SS-1042'
    user_id           UUID REFERENCES users(id) ON DELETE SET NULL,
    status            order_status NOT NULL DEFAULT 'pending',
    subtotal_cents    BIGINT NOT NULL,
    discount_cents    BIGINT NOT NULL DEFAULT 0,
    shipping_cents    BIGINT NOT NULL DEFAULT 0,
    tax_cents         BIGINT NOT NULL DEFAULT 0,
    total_cents       BIGINT NOT NULL,
    coupon_id         UUID,   -- FK added after coupons table is created (see below)
    payment_method    payment_method,
    payment_status    payment_status NOT NULL DEFAULT 'unpaid',
    shipping_address  JSONB NOT NULL,                 -- snapshot, immutable
    notes             TEXT,
    placed_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_user   ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);

CREATE TABLE order_items (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id       UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id     UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name   TEXT NOT NULL,                     -- snapshot at purchase
    unit_cents     BIGINT NOT NULL,
    quantity       INT NOT NULL CHECK (quantity > 0)
);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- M-Pesa / card transaction log (one order can have retries)
CREATE TABLE payments (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id           UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    method             payment_method NOT NULL,
    status             payment_status NOT NULL DEFAULT 'pending',
    amount_cents       BIGINT NOT NULL,
    mpesa_checkout_id  TEXT,                           -- Daraja CheckoutRequestID
    mpesa_receipt      TEXT,                           -- MpesaReceiptNumber
    provider_ref       TEXT,                           -- card gateway ref
    raw_callback       JSONB,                          -- full webhook payload
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_order ON payments(order_id);

-- ============================================================
--  MARKETING
-- ============================================================
CREATE TABLE coupons (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code           TEXT UNIQUE NOT NULL,
    type           coupon_type NOT NULL,
    value_cents    BIGINT,                             -- for fixed
    percent        NUMERIC(5,2),                       -- for percent
    min_order_cents BIGINT DEFAULT 0,
    usage_limit    INT,
    used_count     INT NOT NULL DEFAULT 0,
    starts_at      TIMESTAMPTZ,
    ends_at        TIMESTAMPTZ,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE
);

-- Now that coupons exists, wire the deferred FK from orders
ALTER TABLE orders
    ADD CONSTRAINT fk_orders_coupon
    FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL;

CREATE TABLE reviews (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
    author_name  TEXT NOT NULL,
    rating       INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    body         TEXT,
    status       review_status NOT NULL DEFAULT 'pending',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reviews_product ON reviews(product_id, status);

CREATE TABLE messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel     message_channel NOT NULL,
    name        TEXT,
    email       TEXT,
    phone       TEXT,
    body        TEXT NOT NULL,
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE newsletter_subscribers (
    email       CITEXT PRIMARY KEY,
    subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

-- ============================================================
--  CMS  (editable site content — no code changes needed)
-- ============================================================
CREATE TABLE content_blocks (
    key         TEXT PRIMARY KEY,                     -- 'home.hero_tagline', 'about.story'
    value       JSONB NOT NULL,
    updated_by  UUID REFERENCES users(id),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
--  ANALYTICS  (lightweight event capture; heavy reporting via GA)
-- ============================================================
CREATE TABLE visit_events (
    id          BIGSERIAL PRIMARY KEY,
    session_id  TEXT,
    path        TEXT,
    referrer    TEXT,                                 -- traffic source
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_visit_events_time ON visit_events(occurred_at);

-- ============================================================
--  FUTURE-SCALABILITY placeholders (create when the feature ships)
-- ============================================================
-- loyalty_points(user_id, balance, updated_at)
-- gift_cards(code, balance_cents, expires_at)
-- referrals(referrer_id, referred_id, reward_cents, status)
-- push_tokens(user_id, token, platform)
-- product_translations(product_id, locale, name, description)   -- multi-language
-- fx_rates(currency, rate_to_kes, fetched_at)                   -- multi-currency

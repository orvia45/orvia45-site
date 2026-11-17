CREATE TABLE IF NOT EXISTS users (
 id BIGSERIAL PRIMARY KEY, public_id VARCHAR(32) NOT NULL UNIQUE, name VARCHAR(80) NOT NULL,
 email VARCHAR(254) UNIQUE, phone VARCHAR(30) UNIQUE, password_hash CHAR(128) NOT NULL, password_salt VARCHAR(64) NOT NULL,
 role VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
 sponsor_id BIGINT REFERENCES users(id) ON DELETE SET NULL, status VARCHAR(12) NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), CHECK(sponsor_id IS NULL OR sponsor_id<>id)
);
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique_idx ON users(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS users_sponsor_idx ON users(sponsor_id);
CREATE TABLE IF NOT EXISTS sessions (
 id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 token_hash CHAR(64) NOT NULL UNIQUE, expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS deposits (
 id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id), amount_cfa BIGINT NOT NULL CHECK(amount_cfa>0),
 provider VARCHAR(30) NOT NULL CHECK(provider IN ('flooz','tmoney','mixx','other')), provider_reference VARCHAR(120) UNIQUE,
 payment_verified BOOLEAN NOT NULL DEFAULT false, status VARCHAR(12) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 approved_by BIGINT REFERENCES users(id), approved_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS payer_phone VARCHAR(30);
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS verified_by BIGINT REFERENCES users(id);
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS verification_method VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK(verification_method IN ('manual','provider_api','provider_webhook'));
CREATE INDEX IF NOT EXISTS deposits_provider_reference_idx ON deposits(provider,provider_reference);

CREATE TABLE IF NOT EXISTS first_investments (
 id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL UNIQUE REFERENCES users(id), deposit_id BIGINT NOT NULL UNIQUE REFERENCES deposits(id),
 amount_cfa BIGINT NOT NULL CHECK(amount_cfa>0), validated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS referral_commissions (
 id BIGSERIAL PRIMARY KEY, beneficiary_id BIGINT NOT NULL REFERENCES users(id), referred_user_id BIGINT NOT NULL REFERENCES users(id),
 first_investment_id BIGINT NOT NULL REFERENCES first_investments(id), level SMALLINT NOT NULL CHECK(level BETWEEN 1 AND 3),
 rate_basis_points INTEGER NOT NULL CHECK(rate_basis_points IN (1000,300,100)), amount_cfa BIGINT NOT NULL CHECK(amount_cfa>=0),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(referred_user_id,level)
);
CREATE TABLE IF NOT EXISTS audit_logs (
 id BIGSERIAL PRIMARY KEY, actor_id BIGINT REFERENCES users(id), action VARCHAR(100) NOT NULL,
 entity_type VARCHAR(50) NOT NULL, entity_id VARCHAR(100), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- Grand livre immuable : chaque événement financier produit un journal équilibré.
ALTER TABLE first_investments ALTER COLUMN deposit_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS journal_transactions (
 id BIGSERIAL PRIMARY KEY, event_key VARCHAR(140) NOT NULL UNIQUE,
 event_type VARCHAR(40) NOT NULL, user_id BIGINT REFERENCES users(id),
 amount_cfa BIGINT NOT NULL CHECK(amount_cfa>0), description TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS journal_lines (
 id BIGSERIAL PRIMARY KEY, transaction_id BIGINT NOT NULL REFERENCES journal_transactions(id) ON DELETE RESTRICT,
 account_code VARCHAR(40) NOT NULL CHECK(account_code IN ('cash_held','user_wallet_liability','investment_liability','withdrawal_payable','withdrawal_fee_revenue','commission_expense','investment_return_expense','investment_adjustment_revenue')),
 debit_cfa BIGINT NOT NULL DEFAULT 0 CHECK(debit_cfa>=0), credit_cfa BIGINT NOT NULL DEFAULT 0 CHECK(credit_cfa>=0),
 CHECK ((debit_cfa=0) <> (credit_cfa=0)), UNIQUE(transaction_id,account_code)
);
CREATE INDEX IF NOT EXISTS journal_lines_account_idx ON journal_lines(account_code);
CREATE TABLE IF NOT EXISTS investments (
 id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id), amount_cfa BIGINT NOT NULL CHECK(amount_cfa>0),
 status VARCHAR(12) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','released')),
 approved_by BIGINT REFERENCES users(id), approved_at TIMESTAMPTZ, released_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS withdrawals (
 id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id), amount_cfa BIGINT NOT NULL CHECK(amount_cfa>0),
 fee_cfa BIGINT NOT NULL CHECK(fee_cfa>=0), net_amount_cfa BIGINT NOT NULL CHECK(net_amount_cfa>=0),
 provider VARCHAR(10) NOT NULL CHECK(provider IN ('flooz','tmoney','mixx')),
 destination VARCHAR(120) NOT NULL, status VARCHAR(12) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','paid')),
 approved_by BIGINT REFERENCES users(id), approved_at TIMESTAMPTZ, paid_at TIMESTAMPTZ,
 provider_reference VARCHAR(120) UNIQUE, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), CHECK(amount_cfa=fee_cfa+net_amount_cfa)
);
CREATE INDEX IF NOT EXISTS withdrawals_user_status_idx ON withdrawals(user_id,status);

-- Offres et quotas personnels de souscription par utilisateur.
CREATE TABLE IF NOT EXISTS investment_offers (
 id BIGSERIAL PRIMARY KEY, code VARCHAR(32) NOT NULL UNIQUE, name VARCHAR(80) NOT NULL,
 description TEXT NOT NULL DEFAULT '', duration_label VARCHAR(80) NOT NULL, min_amount_cfa BIGINT NOT NULL CHECK(min_amount_cfa>0),
 max_amount_cfa BIGINT CHECK(max_amount_cfa IS NULL OR max_amount_cfa>=min_amount_cfa), display_value_cfa BIGINT NOT NULL CHECK(display_value_cfa>0),
 default_user_limit INTEGER NOT NULL DEFAULT 2 CHECK(default_user_limit>=0), active BOOLEAN NOT NULL DEFAULT true,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO investment_offers(code,name,duration_label,min_amount_cfa,display_value_cfa) VALUES
 ('SMILE-1','SMILE 1','1 jour',3000,4500),('SMILE-2','SMILE 2','10 jours',10000,14500),
 ('SMILE-3','SMILE 3','30 jours',22000,33000),('SMILE-4','SMILE 4','60 jours',42000,63000),
 ('SMILE-5','SMILE 5','90 jours',75000,112500),('SMILE-6','SMILE 6','120 jours',106000,159000)
ON CONFLICT(code) DO NOTHING;
ALTER TABLE investment_offers ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE investment_offers ADD COLUMN IF NOT EXISTS category VARCHAR(16) NOT NULL DEFAULT 'ia' CHECK(category IN ('ia','super','limited','daily','team'));
ALTER TABLE investment_offers ADD COLUMN IF NOT EXISTS max_amount_cfa BIGINT;
ALTER TABLE investment_offers ADD COLUMN IF NOT EXISTS default_user_limit INTEGER NOT NULL DEFAULT 2 CHECK(default_user_limit>=0);
ALTER TABLE investment_offers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE investment_offers ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE investment_offers ADD COLUMN IF NOT EXISTS stock_limit INTEGER CHECK(stock_limit IS NULL OR stock_limit>=0);
ALTER TABLE investment_offers ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE investment_offers ADD COLUMN IF NOT EXISTS purchase_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE investment_offers ADD COLUMN IF NOT EXISTS removed BOOLEAN NOT NULL DEFAULT false;

-- Offres reproduites depuis la vidéo de référence : elles sont créées en brouillon.
-- L’administrateur choisit explicitement lesquelles publier dans le compte utilisateur.
INSERT INTO investment_offers(code,name,description,category,duration_label,min_amount_cfa,display_value_cfa,default_user_limit,active,stock_limit,published) VALUES
 ('SMILE-IA-01','SMILE IA 1.1','Offre IA reproduite depuis la vidéo de référence.','ia','6 jours',10000,14500,1,true,33933,false),
 ('SMILE-IA-02','SMILE IA 1.2','Offre IA reproduite depuis la vidéo de référence.','ia','10 jours',22000,33000,1,true,31061,false),
 ('SMILE-IA-03','SMILE IA 1.3','Offre IA reproduite depuis la vidéo de référence.','ia','20 jours',44000,68200,2,true,41925,false),
 ('SMILE-IA-04','SMILE IA 1.4','Offre IA reproduite depuis la vidéo de référence.','ia','30 jours',65000,104000,2,true,76093,false),
 ('SMILE-IA-05','SMILE IA 1.5','Offre IA reproduite depuis la vidéo de référence.','ia','40 jours',87000,140940,2,true,54423,false),
 ('SMILE-IA-06','SMILE IA 1.6','Offre IA reproduite depuis la vidéo de référence.','ia','50 jours',106000,174900,2,true,55093,false),
 ('SMILE-IA-07','SMILE IA 1.7','Offre IA reproduite depuis la vidéo de référence.','ia','80 jours',142000,248500,2,true,66546,false),
 ('SMILE-IA-08','SMILE IA 1.8','Offre IA reproduite depuis la vidéo de référence.','ia','120 jours',175000,350000,2,true,45150,false),
 ('SMILE-IA-09','SMILE IA 1.9','Offre IA reproduite depuis la vidéo de référence.','ia','160 jours',220000,550000,2,true,54509,true),
 ('SMILE-IA-10','SMILE IA 2.0','Offre IA reproduite depuis la vidéo de référence.','ia','200 jours',300000,900000,2,true,13547,false),
 ('SMILE-IA-11','SMILE IA 2.1','Offre IA reproduite depuis la vidéo de référence.','ia','240 jours',330000,1320000,2,true,24534,false),
 ('SMILE-IA-12','SMILE IA 2.2','Offre IA reproduite depuis la vidéo de référence.','ia','280 jours',400000,2400000,2,true,22543,false),
 ('SMILE-IA-13','SMILE IA 2.3','Offre IA reproduite depuis la vidéo de référence.','ia','360 jours',500000,4000000,2,true,31541,false),
 ('SMILE-SUPER-IA-01','SMILE SUPER IA 2.0','Offre Super IA reproduite depuis la vidéo de référence.','super','2 jours',37000,55500,1,true,14788,false),
 ('SMILE-SUPER-IA-02','SMILE SUPER IA 3.0','Offre Super IA reproduite depuis la vidéo de référence.','super','2 jours',77000,123200,1,true,25802,false),
 ('SMILE-SUPER-IA-03','SMILE SUPER IA 4.0','Offre Super IA reproduite depuis la vidéo de référence.','super','2 jours',154000,308000,1,true,13559,false),
 ('SMILE-SUPER-IA-04','SMILE SUPER IA 5.0','Offre Super IA reproduite depuis la vidéo de référence.','super','2 jours',310000,775000,1,true,28640,false),
 ('SMILE-SUPER-IA-05','SMILE SUPER IA 6.0','Offre Super IA reproduite depuis la vidéo de référence.','super','2 jours',550000,1650000,1,true,35241,false),
 ('SMILE-SUPER-IA-06','SMILE SUPER IA 7.0','Offre Super IA reproduite depuis la vidéo de référence.','super','2 jours',880000,3080000,1,true,47856,false),
 ('SMILE-SUPER-IA-07','SMILE SUPER IA 8.0','Offre Super IA reproduite depuis la vidéo de référence.','super','2 jours',1800000,9000000,1,true,38447,false),
 ('SMILE-SUPER-IA-08','SMILE SUPER IA 9.0','Offre Super IA reproduite depuis la vidéo de référence.','super','2 jours',3100000,18600000,1,true,13854,false),
 ('SMILE-SUPER-IA-09','SMILE SUPER IA 10.0','Offre Super IA reproduite depuis la vidéo de référence.','super','2 jours',4400000,30800000,1,true,31264,false)
ON CONFLICT(code) DO NOTHING;
CREATE TABLE IF NOT EXISTS offer_stock_audit (id BIGSERIAL PRIMARY KEY, offer_id BIGINT NOT NULL REFERENCES investment_offers(id), actor_id BIGINT REFERENCES users(id), old_stock_limit INTEGER, new_stock_limit INTEGER, reason TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS user_offer_quotas (
 id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 offer_id BIGINT NOT NULL REFERENCES investment_offers(id), total_limit INTEGER NOT NULL CHECK(total_limit>=0),
 remaining INTEGER NOT NULL CHECK(remaining>=0 AND remaining<=total_limit), assigned_by BIGINT REFERENCES users(id),
 assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(user_id,offer_id)
);
ALTER TABLE investments ADD COLUMN IF NOT EXISTS offer_id BIGINT REFERENCES investment_offers(id);
ALTER TABLE investments ADD COLUMN IF NOT EXISTS execution_key VARCHAR(100) UNIQUE;
-- Conditions contractuelles figées au moment de chaque souscription exécutée.
ALTER TABLE investments ADD COLUMN IF NOT EXISTS offer_conditions_snapshot JSONB;
ALTER TABLE investments ADD COLUMN IF NOT EXISTS offer_name_snapshot VARCHAR(80);
ALTER TABLE investments ADD COLUMN IF NOT EXISTS offer_code_snapshot VARCHAR(32);
ALTER TABLE investments ADD COLUMN IF NOT EXISTS duration_label_snapshot VARCHAR(80);
ALTER TABLE investments ADD COLUMN IF NOT EXISTS min_amount_cfa_snapshot BIGINT;
ALTER TABLE investments ADD COLUMN IF NOT EXISTS display_value_cfa_snapshot BIGINT;
ALTER TABLE investments ADD COLUMN IF NOT EXISTS offer_description_snapshot TEXT;

-- Verrou contractuel : une souscription exécutée conserve définitivement ses conditions.
-- Même un UPDATE SQL direct ne peut modifier ni supprimer son instantané payé.
CREATE OR REPLACE FUNCTION protect_paid_investment_snapshot() RETURNS trigger AS $$
BEGIN
 IF TG_OP = 'DELETE' THEN
  IF OLD.offer_conditions_snapshot IS NOT NULL THEN
   RAISE EXCEPTION 'Une souscription payée avec conditions figées ne peut pas être supprimée.';
  END IF;
  RETURN OLD;
 END IF;
 IF OLD.offer_conditions_snapshot IS NOT NULL AND (
    NEW.offer_conditions_snapshot IS DISTINCT FROM OLD.offer_conditions_snapshot OR
    NEW.offer_name_snapshot IS DISTINCT FROM OLD.offer_name_snapshot OR
    NEW.offer_code_snapshot IS DISTINCT FROM OLD.offer_code_snapshot OR
    NEW.duration_label_snapshot IS DISTINCT FROM OLD.duration_label_snapshot OR
    NEW.min_amount_cfa_snapshot IS DISTINCT FROM OLD.min_amount_cfa_snapshot OR
    NEW.display_value_cfa_snapshot IS DISTINCT FROM OLD.display_value_cfa_snapshot OR
    NEW.offer_description_snapshot IS DISTINCT FROM OLD.offer_description_snapshot OR
    NEW.offer_id IS DISTINCT FROM OLD.offer_id OR
    NEW.amount_cfa IS DISTINCT FROM OLD.amount_cfa OR
    NEW.total_return_cfa IS DISTINCT FROM OLD.total_return_cfa OR
    NEW.due_at IS DISTINCT FROM OLD.due_at
 ) THEN
  RAISE EXCEPTION 'Les conditions contractuelles d’une souscription payée sont immuables.';
 END IF;
 RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS investments_paid_snapshot_immutable ON investments;
CREATE TRIGGER investments_paid_snapshot_immutable
 BEFORE UPDATE OR DELETE ON investments
 FOR EACH ROW EXECUTE FUNCTION protect_paid_investment_snapshot();
-- Historique traçable des modifications de conditions et de stock par administrateur.
CREATE TABLE IF NOT EXISTS offer_conditions_audit (
 id BIGSERIAL PRIMARY KEY,
 offer_id BIGINT NOT NULL REFERENCES investment_offers(id),
 actor_id BIGINT REFERENCES users(id),
 old_conditions JSONB NOT NULL,
 new_conditions JSONB NOT NULL,
 reason VARCHAR(300) NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS offer_conditions_audit_offer_idx ON offer_conditions_audit(offer_id,created_at DESC);
CREATE INDEX IF NOT EXISTS user_offer_quotas_user_idx ON user_offer_quotas(user_id,offer_id);


-- Notifications internes liées aux décisions financières (sans SMS ni e-mail).
CREATE TABLE IF NOT EXISTS user_notifications (
 id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 event_key VARCHAR(160) NOT NULL UNIQUE, title VARCHAR(120) NOT NULL, message TEXT NOT NULL,
 is_read BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_notifications_user_created_idx ON user_notifications(user_id,created_at DESC);


-- Échéance, montant contractuel à recevoir et libération automatique des investissements.
ALTER TABLE investments ADD COLUMN IF NOT EXISTS total_return_cfa BIGINT;
ALTER TABLE investments ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ;
ALTER TABLE investments ADD COLUMN IF NOT EXISTS released_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS investments_due_idx ON investments(due_at) WHERE status='approved';


-- Messagerie interne du service client (sans e-mail ni SMS).
CREATE TABLE IF NOT EXISTS support_messages (
 id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 sender_role VARCHAR(10) NOT NULL CHECK(sender_role IN ('user','admin')),
 body TEXT NOT NULL CHECK(length(trim(body)) BETWEEN 1 AND 3000),
 parent_id BIGINT REFERENCES support_messages(id) ON DELETE CASCADE,
 is_read BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS support_messages_user_created_idx ON support_messages(user_id,created_at);

-- Jetons de réinitialisation à usage unique, valables 30 minutes.
CREATE TABLE IF NOT EXISTS password_reset_tokens (
 id BIGSERIAL PRIMARY KEY,
 user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 token_hash CHAR(64) NOT NULL UNIQUE,
 expires_at TIMESTAMPTZ NOT NULL,
 used_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS password_reset_tokens_user_idx ON password_reset_tokens(user_id, expires_at);


-- Historique immuable des changements de quotas individuels.
CREATE TABLE IF NOT EXISTS user_offer_quota_audit (
 id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id), offer_id BIGINT NOT NULL REFERENCES investment_offers(id),
 actor_id BIGINT REFERENCES users(id), old_total_limit INTEGER, new_total_limit INTEGER NOT NULL, used_count INTEGER NOT NULL, reason VARCHAR(300) NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_offer_quota_audit_user_idx ON user_offer_quota_audit(user_id,created_at DESC);


-- Sécurité des retraits, bénéficiaires Mobile Money et publications administrables.
ALTER TABLE users ADD COLUMN IF NOT EXISTS withdrawal_pin_hash VARCHAR(128);
ALTER TABLE users ADD COLUMN IF NOT EXISTS withdrawal_pin_salt VARCHAR(64);
CREATE TABLE IF NOT EXISTS wallet_beneficiaries (
 id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 provider VARCHAR(10) NOT NULL CHECK(provider IN ('flooz','tmoney','mixx')), label VARCHAR(60) NOT NULL,
 phone VARCHAR(24) NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(user_id,provider,phone)
);
CREATE INDEX IF NOT EXISTS wallet_beneficiaries_user_idx ON wallet_beneficiaries(user_id);
CREATE TABLE IF NOT EXISTS publications (
 id BIGSERIAL PRIMARY KEY, title VARCHAR(160) NOT NULL, body TEXT NOT NULL CHECK(length(trim(body)) BETWEEN 1 AND 10000),
 status VARCHAR(12) NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
 created_by BIGINT REFERENCES users(id), published_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS publications_feed_idx ON publications(status,published_at DESC);


-- Comptes spéciaux SMILE : activation et attribution idempotente des commissions.
CREATE TABLE IF NOT EXISTS special_commission_accounts (
 id SMALLSERIAL PRIMARY KEY,
 user_id BIGINT NOT NULL UNIQUE REFERENCES users(id),
 active BOOLEAN NOT NULL DEFAULT false,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS special_commissions (
 id BIGSERIAL PRIMARY KEY,
 special_account_id SMALLINT NOT NULL REFERENCES special_commission_accounts(id),
 deposit_id BIGINT NOT NULL REFERENCES deposits(id),
 depositor_user_id BIGINT NOT NULL REFERENCES users(id),
 rate_basis_points INTEGER NOT NULL DEFAULT 1200 CHECK(rate_basis_points=1200),
 amount_cfa BIGINT NOT NULL CHECK(amount_cfa>=0),
 status VARCHAR(12) NOT NULL CHECK(status IN ('credited','forfeited')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(special_account_id,deposit_id)
);
CREATE INDEX IF NOT EXISTS special_commissions_account_idx ON special_commissions(special_account_id,created_at DESC);


-- Sécurisation de la rubrique Contrôle et journal des comptes spéciaux.
CREATE TABLE IF NOT EXISTS special_control_credentials (
 id SMALLINT PRIMARY KEY DEFAULT 1 CHECK(id=1), password_hash CHAR(128) NOT NULL, password_salt VARCHAR(64) NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS special_control_sessions (
 id BIGSERIAL PRIMARY KEY, admin_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE, token_hash CHAR(64) NOT NULL UNIQUE, expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS special_control_sessions_expiry_idx ON special_control_sessions(expires_at);
CREATE TABLE IF NOT EXISTS special_control_audit (
 id BIGSERIAL PRIMARY KEY, actor_id BIGINT REFERENCES users(id), special_account_id SMALLINT REFERENCES special_commission_accounts(id), action VARCHAR(30) NOT NULL, details JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS special_first_deposit_claims (
 depositor_user_id BIGINT PRIMARY KEY REFERENCES users(id), deposit_id BIGINT NOT NULL UNIQUE REFERENCES deposits(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- Migration v1.49 : TMoney + Flooz pour les nouvelles opérations.
-- Mixx reste accepté dans les contraintes SQL uniquement pour préserver les anciennes opérations historiques.
ALTER TABLE deposits DROP CONSTRAINT IF EXISTS deposits_provider_check;
ALTER TABLE deposits ADD CONSTRAINT deposits_provider_check CHECK(provider IN ('flooz','tmoney','mixx','other'));
ALTER TABLE withdrawals DROP CONSTRAINT IF EXISTS withdrawals_provider_check;
ALTER TABLE withdrawals ADD CONSTRAINT withdrawals_provider_check CHECK(provider IN ('flooz','tmoney','mixx'));
ALTER TABLE wallet_beneficiaries DROP CONSTRAINT IF EXISTS wallet_beneficiaries_provider_check;
ALTER TABLE wallet_beneficiaries ADD CONSTRAINT wallet_beneficiaries_provider_check CHECK(provider IN ('flooz','tmoney','mixx'));

ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS paid_by BIGINT REFERENCES users(id);

-- Paramètres programmables des produits SM Durée limitée (v1.53.6).
ALTER TABLE investment_offers ADD COLUMN IF NOT EXISTS sale_start_at TIMESTAMPTZ;
ALTER TABLE investment_offers ADD COLUMN IF NOT EXISTS sale_end_at TIMESTAMPTZ;
ALTER TABLE investment_offers ADD COLUMN IF NOT EXISTS reservation_amounts_cfa JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE investment_offers ADD COLUMN IF NOT EXISTS product_wallet_balance_cfa BIGINT NOT NULL DEFAULT 0 CHECK(product_wallet_balance_cfa>=0);
ALTER TABLE investment_offers ADD COLUMN IF NOT EXISTS reservations_remaining INTEGER NOT NULL DEFAULT 0 CHECK(reservations_remaining>=0);
ALTER TABLE investment_offers ADD COLUMN IF NOT EXISTS limited_deleted_at TIMESTAMPTZ;

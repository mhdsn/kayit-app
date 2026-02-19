-- =============================================================
-- KAYIT v2 — Migration Base de Données
-- Description : Ajout des modules Produits, Commandes, Dépenses
-- Date : 2025
-- ⚠️  À exécuter dans Supabase > SQL Editor
-- =============================================================

-- ============================================================
-- 1. TABLE PRODUITS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom         TEXT NOT NULL,
  prix_achat  NUMERIC(12, 2) NOT NULL DEFAULT 0,
  prix_vente  NUMERIC(12, 2) NOT NULL DEFAULT 0,
  stock       INTEGER NOT NULL DEFAULT 0,
  categorie   TEXT,
  image_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour accélérer les requêtes par utilisateur
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);

-- Row Level Security (RLS) — chaque user ne voit que ses produits
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_select_own" ON products
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "products_insert_own" ON products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "products_update_own" ON products
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "products_delete_own" ON products
  FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- 2. TABLE COMMANDES
-- ============================================================
CREATE TABLE IF NOT EXISTS commandes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_nom        TEXT NOT NULL,
  client_telephone  TEXT,
  statut            TEXT NOT NULL DEFAULT 'en_attente'
                    CHECK (statut IN ('en_attente', 'validee', 'annulee')),
  mode_paiement     TEXT,
  total             NUMERIC(12, 2) NOT NULL DEFAULT 0,
  invoice_id        UUID,  -- Lien vers la facture générée automatiquement
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commandes_user_id ON commandes(user_id);
CREATE INDEX IF NOT EXISTS idx_commandes_statut  ON commandes(statut);

ALTER TABLE commandes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commandes_select_own" ON commandes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "commandes_insert_own" ON commandes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "commandes_update_own" ON commandes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "commandes_delete_own" ON commandes
  FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- 3. TABLE COMMANDE_ITEMS (lignes de commande)
-- ============================================================
CREATE TABLE IF NOT EXISTS commande_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commande_id     UUID NOT NULL REFERENCES commandes(id) ON DELETE CASCADE,
  produit_id      UUID NOT NULL REFERENCES products(id),
  quantite        INTEGER NOT NULL DEFAULT 1,
  prix_unitaire   NUMERIC(12, 2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_commande_items_commande ON commande_items(commande_id);
CREATE INDEX IF NOT EXISTS idx_commande_items_produit  ON commande_items(produit_id);

ALTER TABLE commande_items ENABLE ROW LEVEL SECURITY;

-- Les items héritent des droits via la commande (JOIN nécessaire)
CREATE POLICY "commande_items_select" ON commande_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM commandes c
      WHERE c.id = commande_items.commande_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "commande_items_insert" ON commande_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM commandes c
      WHERE c.id = commande_items.commande_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "commande_items_delete" ON commande_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM commandes c
      WHERE c.id = commande_items.commande_id
        AND c.user_id = auth.uid()
    )
  );


-- ============================================================
-- 4. TABLE EXPENSES — Mise à jour (ajout colonne titre + user_id si manquant)
-- ============================================================
-- Si la table expenses existe déjà, on ajoute les colonnes manquantes
-- Sans supprimer les données existantes
DO $$
BEGIN
  -- Ajouter la colonne 'titre' si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'titre'
  ) THEN
    ALTER TABLE expenses ADD COLUMN titre TEXT;
    -- Rétrocompatibilité : copier description dans titre pour les anciens enregistrements
    UPDATE expenses SET titre = description WHERE titre IS NULL;
  END IF;

  -- Ajouter user_id si manquant
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;
END;
$$;


-- ============================================================
-- 5. COLONNE invoice_id dans la table invoices (lien commande)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'commande_id'
  ) THEN
    ALTER TABLE invoices ADD COLUMN commande_id UUID REFERENCES commandes(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'commande_number'
  ) THEN
    ALTER TABLE invoices ADD COLUMN commande_number TEXT;
  END IF;
END;
$$;


-- ============================================================
-- 6. FONCTION + TRIGGER : Déduction stock à la validation
-- ============================================================

-- Fonction déclenchée AFTER UPDATE sur commandes
CREATE OR REPLACE FUNCTION handle_commande_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Commande vient d'être VALIDEE
  IF NEW.statut = 'validee' AND OLD.statut != 'validee' THEN
    -- Déduire le stock pour chaque item
    UPDATE products p
    SET stock = p.stock - ci.quantite
    FROM commande_items ci
    WHERE ci.commande_id = NEW.id
      AND ci.produit_id = p.id;
  END IF;

  -- Commande vient d'être ANNULEE depuis VALIDEE
  IF NEW.statut = 'annulee' AND OLD.statut = 'validee' THEN
    -- Restaurer le stock
    UPDATE products p
    SET stock = p.stock + ci.quantite
    FROM commande_items ci
    WHERE ci.commande_id = NEW.id
      AND ci.produit_id = p.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger (supprimer si déjà existant pour éviter les doublons)
DROP TRIGGER IF EXISTS trg_commande_status ON commandes;

CREATE TRIGGER trg_commande_status
  AFTER UPDATE ON commandes
  FOR EACH ROW
  EXECUTE FUNCTION handle_commande_status_change();


-- ============================================================
-- 7. VUE DASHBOARD — stats globales par utilisateur
-- ============================================================
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
  c.user_id,
  COUNT(c.id)                                          AS nb_commandes,
  SUM(CASE WHEN c.statut = 'validee' THEN c.total ELSE 0 END) AS total_ventes,
  SUM(CASE WHEN c.statut = 'validee' THEN
    (SELECT SUM(ci.quantite * p.prix_achat)
     FROM commande_items ci
     JOIN products p ON p.id = ci.produit_id
     WHERE ci.commande_id = c.id)
  ELSE 0 END)                                         AS cout_achat_total
FROM commandes c
GROUP BY c.user_id;

-- ============================================================
-- FIN DE LA MIGRATION
-- ============================================================

-- Seed data (optionnel - à exécuter après création d'un household)
-- Ce fichier contient des exemples de catégories de courses par défaut

-- Note: Les catégories par défaut seront créées lors de la création d'un household
-- via une fonction trigger ou depuis l'application

-- Fonction pour créer des catégories par défaut lors de la création d'un household
CREATE OR REPLACE FUNCTION create_default_grocery_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO grocery_categories (household_id, name) VALUES
    (NEW.id, 'Fruits/Légumes'),
    (NEW.id, 'Viandes'),
    (NEW.id, 'Hygiène'),
    (NEW.id, 'Maison'),
    (NEW.id, 'Autre')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour créer les catégories par défaut
CREATE TRIGGER create_default_categories_on_household_create
  AFTER INSERT ON households
  FOR EACH ROW
  EXECUTE FUNCTION create_default_grocery_categories();

-- Fonction pour créer une liste de courses par défaut
CREATE OR REPLACE FUNCTION create_default_grocery_list()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO grocery_lists (household_id, name) VALUES
    (NEW.id, 'Liste principale');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour créer la liste par défaut
CREATE TRIGGER create_default_list_on_household_create
  AFTER INSERT ON households
  FOR EACH ROW
  EXECUTE FUNCTION create_default_grocery_list();

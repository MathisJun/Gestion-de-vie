-- Enable Row Level Security on all tables
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_entries ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is member of household
CREATE OR REPLACE FUNCTION is_household_member(household_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM household_members
    WHERE household_id = household_uuid
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Households policies
CREATE POLICY "Users can view their households"
  ON households FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_id = households.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create households"
  ON households FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their households"
  ON households FOR UPDATE
  USING (is_household_member(id));

CREATE POLICY "Users can delete their households"
  ON households FOR DELETE
  USING (is_household_member(id));

-- Household members policies
CREATE POLICY "Users can view members of their households"
  ON household_members FOR SELECT
  USING (is_household_member(household_id));

CREATE POLICY "Users can add members to their households"
  ON household_members FOR INSERT
  WITH CHECK (is_household_member(household_id));

CREATE POLICY "Users can update members of their households"
  ON household_members FOR UPDATE
  USING (is_household_member(household_id));

CREATE POLICY "Users can remove members from their households"
  ON household_members FOR DELETE
  USING (is_household_member(household_id));

-- Grocery categories policies
CREATE POLICY "Users can view categories of their households"
  ON grocery_categories FOR SELECT
  USING (is_household_member(household_id));

CREATE POLICY "Users can create categories in their households"
  ON grocery_categories FOR INSERT
  WITH CHECK (is_household_member(household_id));

CREATE POLICY "Users can update categories in their households"
  ON grocery_categories FOR UPDATE
  USING (is_household_member(household_id));

CREATE POLICY "Users can delete categories in their households"
  ON grocery_categories FOR DELETE
  USING (is_household_member(household_id));

-- Grocery lists policies
CREATE POLICY "Users can view lists of their households"
  ON grocery_lists FOR SELECT
  USING (is_household_member(household_id));

CREATE POLICY "Users can create lists in their households"
  ON grocery_lists FOR INSERT
  WITH CHECK (is_household_member(household_id));

CREATE POLICY "Users can update lists in their households"
  ON grocery_lists FOR UPDATE
  USING (is_household_member(household_id));

CREATE POLICY "Users can delete lists in their households"
  ON grocery_lists FOR DELETE
  USING (is_household_member(household_id));

-- Grocery items policies
CREATE POLICY "Users can view items of their household lists"
  ON grocery_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM grocery_lists
      WHERE grocery_lists.id = grocery_items.list_id
      AND is_household_member(grocery_lists.household_id)
    )
  );

CREATE POLICY "Users can create items in their household lists"
  ON grocery_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM grocery_lists
      WHERE grocery_lists.id = grocery_items.list_id
      AND is_household_member(grocery_lists.household_id)
    )
  );

CREATE POLICY "Users can update items in their household lists"
  ON grocery_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM grocery_lists
      WHERE grocery_lists.id = grocery_items.list_id
      AND is_household_member(grocery_lists.household_id)
    )
  );

CREATE POLICY "Users can delete items in their household lists"
  ON grocery_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM grocery_lists
      WHERE grocery_lists.id = grocery_items.list_id
      AND is_household_member(grocery_lists.household_id)
    )
  );

-- Subscriptions policies
CREATE POLICY "Users can view subscriptions of their households"
  ON subscriptions FOR SELECT
  USING (is_household_member(household_id));

CREATE POLICY "Users can create subscriptions in their households"
  ON subscriptions FOR INSERT
  WITH CHECK (is_household_member(household_id));

CREATE POLICY "Users can update subscriptions in their households"
  ON subscriptions FOR UPDATE
  USING (is_household_member(household_id));

CREATE POLICY "Users can delete subscriptions in their households"
  ON subscriptions FOR DELETE
  USING (is_household_member(household_id));

-- Trips policies
CREATE POLICY "Users can view trips of their households"
  ON trips FOR SELECT
  USING (is_household_member(household_id));

CREATE POLICY "Users can create trips in their households"
  ON trips FOR INSERT
  WITH CHECK (is_household_member(household_id));

CREATE POLICY "Users can update trips in their households"
  ON trips FOR UPDATE
  USING (is_household_member(household_id));

CREATE POLICY "Users can delete trips in their households"
  ON trips FOR DELETE
  USING (is_household_member(household_id));

-- Trip spots policies
CREATE POLICY "Users can view spots of their household trips"
  ON trip_spots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_spots.trip_id
      AND is_household_member(trips.household_id)
    )
  );

CREATE POLICY "Users can create spots in their household trips"
  ON trip_spots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_spots.trip_id
      AND is_household_member(trips.household_id)
    )
  );

CREATE POLICY "Users can update spots in their household trips"
  ON trip_spots FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_spots.trip_id
      AND is_household_member(trips.household_id)
    )
  );

CREATE POLICY "Users can delete spots in their household trips"
  ON trip_spots FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_spots.trip_id
      AND is_household_member(trips.household_id)
    )
  );

-- Trip media policies
CREATE POLICY "Users can view media of their household trips"
  ON trip_media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trip_spots
      JOIN trips ON trips.id = trip_spots.trip_id
      WHERE trip_spots.id = trip_media.spot_id
      AND is_household_member(trips.household_id)
    )
  );

CREATE POLICY "Users can create media in their household trips"
  ON trip_media FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_spots
      JOIN trips ON trips.id = trip_spots.trip_id
      WHERE trip_spots.id = trip_media.spot_id
      AND is_household_member(trips.household_id)
    )
  );

CREATE POLICY "Users can delete media in their household trips"
  ON trip_media FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM trip_spots
      JOIN trips ON trips.id = trip_spots.trip_id
      WHERE trip_spots.id = trip_media.spot_id
      AND is_household_member(trips.household_id)
    )
  );

-- Restaurants policies
CREATE POLICY "Users can view restaurants of their households"
  ON restaurants FOR SELECT
  USING (is_household_member(household_id));

CREATE POLICY "Users can create restaurants in their households"
  ON restaurants FOR INSERT
  WITH CHECK (is_household_member(household_id));

CREATE POLICY "Users can update restaurants in their households"
  ON restaurants FOR UPDATE
  USING (is_household_member(household_id));

CREATE POLICY "Users can delete restaurants in their households"
  ON restaurants FOR DELETE
  USING (is_household_member(household_id));

-- Movies policies
CREATE POLICY "Users can view movies of their households"
  ON movies FOR SELECT
  USING (is_household_member(household_id));

CREATE POLICY "Users can create movies in their households"
  ON movies FOR INSERT
  WITH CHECK (is_household_member(household_id));

CREATE POLICY "Users can update movies in their households"
  ON movies FOR UPDATE
  USING (is_household_member(household_id));

CREATE POLICY "Users can delete movies in their households"
  ON movies FOR DELETE
  USING (is_household_member(household_id));

-- Fuel entries policies
CREATE POLICY "Users can view fuel entries of their households"
  ON fuel_entries FOR SELECT
  USING (is_household_member(household_id));

CREATE POLICY "Users can create fuel entries in their households"
  ON fuel_entries FOR INSERT
  WITH CHECK (is_household_member(household_id));

CREATE POLICY "Users can update fuel entries in their households"
  ON fuel_entries FOR UPDATE
  USING (is_household_member(household_id));

CREATE POLICY "Users can delete fuel entries in their households"
  ON fuel_entries FOR DELETE
  USING (is_household_member(household_id));

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Households table
CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Household members (junction table)
CREATE TABLE household_members (
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (household_id, user_id)
);

-- Grocery categories
CREATE TABLE grocery_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, name)
);

-- Grocery lists
CREATE TABLE grocery_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Liste principale',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grocery items
CREATE TYPE grocery_item_status AS ENUM ('HOME', 'MUST_BUY', 'BOUGHT');
CREATE TABLE grocery_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID REFERENCES grocery_lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity TEXT,
  category_id UUID REFERENCES grocery_categories(id) ON DELETE SET NULL,
  status grocery_item_status DEFAULT 'HOME',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TYPE billing_cycle AS ENUM ('monthly', 'yearly');
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  provider TEXT,
  billing_cycle billing_cycle NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  next_renewal DATE,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trips
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  country TEXT,
  city TEXT,
  start_date DATE,
  end_date DATE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trip spots (geolocated points)
CREATE TABLE trip_spots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trip media (photos/videos)
CREATE TYPE media_type AS ENUM ('image', 'video');
CREATE TABLE trip_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  spot_id UUID REFERENCES trip_spots(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  media_type media_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Restaurants
CREATE TYPE price_level AS ENUM ('€', '€€', '€€€', '€€€€');
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  cuisine TEXT,
  price_level price_level,
  notes TEXT,
  google_maps_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Movies
CREATE TYPE movie_status AS ENUM ('TO_WATCH', 'WATCHED');
CREATE TABLE movies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  year INTEGER,
  status movie_status DEFAULT 'TO_WATCH',
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fuel entries
CREATE TABLE fuel_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  odometer_km DECIMAL(10, 2) NOT NULL,
  liters DECIMAL(6, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  station TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_household_members_user_id ON household_members(user_id);
CREATE INDEX idx_household_members_household_id ON household_members(household_id);
CREATE INDEX idx_grocery_items_list_id ON grocery_items(list_id);
CREATE INDEX idx_grocery_items_status ON grocery_items(status);
CREATE INDEX idx_subscriptions_household_id ON subscriptions(household_id);
CREATE INDEX idx_subscriptions_next_renewal ON subscriptions(next_renewal);
CREATE INDEX idx_trips_household_id ON trips(household_id);
CREATE INDEX idx_trip_spots_trip_id ON trip_spots(trip_id);
CREATE INDEX idx_trip_media_spot_id ON trip_media(spot_id);
CREATE INDEX idx_restaurants_household_id ON restaurants(household_id);
CREATE INDEX idx_movies_household_id ON movies(household_id);
CREATE INDEX idx_fuel_entries_household_id ON fuel_entries(household_id);
CREATE INDEX idx_fuel_entries_date ON fuel_entries(date);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_grocery_items_updated_at BEFORE UPDATE ON grocery_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_movies_updated_at BEFORE UPDATE ON movies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

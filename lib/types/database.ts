export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      households: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
      };
      household_members: {
        Row: {
          household_id: string;
          user_id: string;
          role: 'owner' | 'member';
          created_at: string;
        };
        Insert: {
          household_id: string;
          user_id: string;
          role?: 'owner' | 'member';
          created_at?: string;
        };
        Update: {
          household_id?: string;
          user_id?: string;
          role?: 'owner' | 'member';
          created_at?: string;
        };
      };
      grocery_categories: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          name?: string;
          created_at?: string;
        };
      };
      grocery_lists: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          name?: string;
          created_at?: string;
        };
      };
      grocery_items: {
        Row: {
          id: string;
          list_id: string;
          name: string;
          quantity: string | null;
          category_id: string | null;
          status: 'HOME' | 'MUST_BUY' | 'BOUGHT';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          list_id: string;
          name: string;
          quantity?: string | null;
          category_id?: string | null;
          status?: 'HOME' | 'MUST_BUY' | 'BOUGHT';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          list_id?: string;
          name?: string;
          quantity?: string | null;
          category_id?: string | null;
          status?: 'HOME' | 'MUST_BUY' | 'BOUGHT';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          provider: string | null;
          billing_cycle: 'monthly' | 'yearly';
          price: number;
          start_date: string;
          end_date: string | null;
          next_renewal: string | null;
          payment_method: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          provider?: string | null;
          billing_cycle: 'monthly' | 'yearly';
          price: number;
          start_date: string;
          end_date?: string | null;
          next_renewal?: string | null;
          payment_method?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          name?: string;
          provider?: string | null;
          billing_cycle?: 'monthly' | 'yearly';
          price?: number;
          start_date?: string;
          end_date?: string | null;
          next_renewal?: string | null;
          payment_method?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      trips: {
        Row: {
          id: string;
          household_id: string;
          title: string;
          country: string | null;
          city: string | null;
          start_date: string | null;
          end_date: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          title: string;
          country?: string | null;
          city?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          title?: string;
          country?: string | null;
          city?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      trip_spots: {
        Row: {
          id: string;
          trip_id: string;
          title: string;
          lat: number;
          lng: number;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          title: string;
          lat: number;
          lng: number;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          title?: string;
          lat?: number;
          lng?: number;
          description?: string | null;
          created_at?: string;
        };
      };
      trip_media: {
        Row: {
          id: string;
          spot_id: string;
          storage_path: string;
          media_type: 'image' | 'video';
          created_at: string;
        };
        Insert: {
          id?: string;
          spot_id: string;
          storage_path: string;
          media_type: 'image' | 'video';
          created_at?: string;
        };
        Update: {
          id?: string;
          spot_id?: string;
          storage_path?: string;
          media_type?: 'image' | 'video';
          created_at?: string;
        };
      };
      restaurants: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          address: string | null;
          lat: number | null;
          lng: number | null;
          rating: number | null;
          cuisine: string | null;
          price_level: '€' | '€€' | '€€€' | '€€€€' | null;
          notes: string | null;
          google_maps_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          address?: string | null;
          lat?: number | null;
          lng?: number | null;
          rating?: number | null;
          cuisine?: string | null;
          price_level?: '€' | '€€' | '€€€' | '€€€€' | null;
          notes?: string | null;
          google_maps_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          name?: string;
          address?: string | null;
          lat?: number | null;
          lng?: number | null;
          rating?: number | null;
          cuisine?: string | null;
          price_level?: '€' | '€€' | '€€€' | '€€€€' | null;
          notes?: string | null;
          google_maps_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      movies: {
        Row: {
          id: string;
          household_id: string;
          title: string;
          year: number | null;
          status: 'TO_WATCH' | 'WATCHED';
          rating: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          title: string;
          year?: number | null;
          status?: 'TO_WATCH' | 'WATCHED';
          rating?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          title?: string;
          year?: number | null;
          status?: 'TO_WATCH' | 'WATCHED';
          rating?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      fuel_entries: {
        Row: {
          id: string;
          household_id: string;
          date: string;
          odometer_km: number;
          liters: number;
          total_price: number;
          station: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          date: string;
          odometer_km: number;
          liters: number;
          total_price: number;
          station?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          date?: string;
          odometer_km?: number;
          liters?: number;
          total_price?: number;
          station?: string | null;
          created_at?: string;
        };
      };
    };
  };
}

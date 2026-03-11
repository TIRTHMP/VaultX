import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Database = {
  public: {
    Tables: {
      cards: {
        Row: {
          id: string;
          user_id: string;
          card_holder_name: string;
          card_number_encrypted: string;
          expiry_date: string;
          card_type: string;
          bank_name: string;
          notes_encrypted: string | null;
          color_scheme: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['cards']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['cards']['Insert']>;
      };
      passwords: {
        Row: {
          id: string;
          user_id: string;
          site_name: string;
          site_url: string | null;
          username: string;
          password_encrypted: string;
          notes: string | null;
          icon_url: string | null;
          category: string;
          created_at: string;
          updated_at: string;
          last_used: string | null;
        };
        Insert: Omit<Database['public']['Tables']['passwords']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['passwords']['Insert']>;
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          file_path: string;
          file_size: number;
          mime_type: string;
          category: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['documents']['Insert']>;
      };
    };
  };
};

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      claim_invites: {
        Row: {
          created_at: string;
          expires_at: string;
          profile_id: string;
          token: string;
          used_at: string | null;
        };
        Insert: {
          created_at?: string;
          expires_at?: string;
          profile_id: string;
          token?: string;
          used_at?: string | null;
        };
        Update: {
          created_at?: string;
          expires_at?: string;
          profile_id?: string;
          token?: string;
          used_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'claim_invites_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      featured_slots: {
        Row: {
          created_at: string;
          ends_at: string;
          id: string;
          project_id: string;
          sponsor_label: string | null;
          starts_at: string;
        };
        Insert: {
          created_at?: string;
          ends_at: string;
          id?: string;
          project_id: string;
          sponsor_label?: string | null;
          starts_at: string;
        };
        Update: {
          created_at?: string;
          ends_at?: string;
          id?: string;
          project_id?: string;
          sponsor_label?: string | null;
          starts_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'featured_slots_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      follows: {
        Row: {
          created_at: string;
          followee_id: string;
          follower_id: string;
        };
        Insert: {
          created_at?: string;
          followee_id: string;
          follower_id: string;
        };
        Update: {
          created_at?: string;
          followee_id?: string;
          follower_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'follows_followee_id_fkey';
            columns: ['followee_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'follows_follower_id_fkey';
            columns: ['follower_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      likes: {
        Row: {
          created_at: string;
          profile_id: string;
          project_id: string;
        };
        Insert: {
          created_at?: string;
          profile_id: string;
          project_id: string;
        };
        Update: {
          created_at?: string;
          profile_id?: string;
          project_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'likes_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'likes_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          claimed_at: string | null;
          created_at: string;
          display_name: string | null;
          followers_count: number;
          github_id: number;
          github_username: string;
          id: string;
          is_admin: boolean;
          links: Json;
          user_id: string | null;
          username: string;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          claimed_at?: string | null;
          created_at?: string;
          display_name?: string | null;
          followers_count?: number;
          github_id: number;
          github_username: string;
          id?: string;
          is_admin?: boolean;
          links?: Json;
          user_id?: string | null;
          username: string;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          claimed_at?: string | null;
          created_at?: string;
          display_name?: string | null;
          followers_count?: number;
          github_id?: number;
          github_username?: string;
          id?: string;
          is_admin?: boolean;
          links?: Json;
          user_id?: string | null;
          username?: string;
        };
        Relationships: [];
      };
      project_updates: {
        Row: {
          body_md: string;
          created_at: string;
          id: string;
          project_id: string;
          title: string | null;
        };
        Insert: {
          body_md: string;
          created_at?: string;
          id?: string;
          project_id: string;
          title?: string | null;
        };
        Update: {
          body_md?: string;
          created_at?: string;
          id?: string;
          project_id?: string;
          title?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'project_updates_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      projects: {
        Row: {
          created_at: string;
          demo_url: string | null;
          description_md: string | null;
          forks_count: number;
          github_repo_id: number;
          id: string;
          last_synced_at: string | null;
          license: string | null;
          likes_count: number;
          name: string;
          primary_language: string | null;
          profile_id: string;
          published_at: string | null;
          readme_etag: string | null;
          readme_html: string | null;
          repo_etag: string | null;
          repo_full_name: string;
          repo_url: string;
          saves_count: number;
          screenshots: Json;
          slug: string;
          sort_order: number;
          stars_count: number;
          status: Database['public']['Enums']['project_status'];
          tagline: string | null;
          tags: string[];
          topics: string[];
          trending_score: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          demo_url?: string | null;
          description_md?: string | null;
          forks_count?: number;
          github_repo_id: number;
          id?: string;
          last_synced_at?: string | null;
          license?: string | null;
          likes_count?: number;
          name: string;
          primary_language?: string | null;
          profile_id: string;
          published_at?: string | null;
          readme_etag?: string | null;
          readme_html?: string | null;
          repo_etag?: string | null;
          repo_full_name: string;
          repo_url: string;
          saves_count?: number;
          screenshots?: Json;
          slug: string;
          sort_order?: number;
          stars_count?: number;
          status?: Database['public']['Enums']['project_status'];
          tagline?: string | null;
          tags?: string[];
          topics?: string[];
          trending_score?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          demo_url?: string | null;
          description_md?: string | null;
          forks_count?: number;
          github_repo_id?: number;
          id?: string;
          last_synced_at?: string | null;
          license?: string | null;
          likes_count?: number;
          name?: string;
          primary_language?: string | null;
          profile_id?: string;
          published_at?: string | null;
          readme_etag?: string | null;
          readme_html?: string | null;
          repo_etag?: string | null;
          repo_full_name?: string;
          repo_url?: string;
          saves_count?: number;
          screenshots?: Json;
          slug?: string;
          sort_order?: number;
          stars_count?: number;
          status?: Database['public']['Enums']['project_status'];
          tagline?: string | null;
          tags?: string[];
          topics?: string[];
          trending_score?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'projects_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      saves: {
        Row: {
          created_at: string;
          profile_id: string;
          project_id: string;
        };
        Insert: {
          created_at?: string;
          profile_id: string;
          project_id: string;
        };
        Update: {
          created_at?: string;
          profile_id?: string;
          project_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'saves_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'saves_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      tags: {
        Row: {
          created_at: string;
          kind: string;
          label: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          kind: string;
          label: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          kind?: string;
          label?: string;
          slug?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      compute_trending: {
        Args: { likes: number; pub: string; saves: number };
        Returns: number;
      };
      current_profile_id: { Args: never; Returns: string };
    };
    Enums: {
      project_status: 'draft' | 'published';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      project_status: ['draft', 'published'],
    },
  },
} as const;

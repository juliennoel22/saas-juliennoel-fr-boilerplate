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
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          credits: number;
          plan: string;
          is_active: boolean;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          utm_source: string | null;
          utm_campaign: string | null;
          utm_content: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          credits?: number;
          plan?: string;
          is_active?: boolean;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          utm_source?: string | null;
          utm_campaign?: string | null;
          utm_content?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          credits?: number;
          plan?: string;
          is_active?: boolean;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          utm_source?: string | null;
          utm_campaign?: string | null;
          utm_content?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      webhook_events: {
        Row: {
          id: string;
          provider: string;
          event_type: string;
          payload: Json | null;
          processed_at: string;
        };
        Insert: {
          id: string;
          provider?: string;
          event_type: string;
          payload?: Json | null;
          processed_at?: string;
        };
        Update: {
          id?: string;
          provider?: string;
          event_type?: string;
          payload?: Json | null;
          processed_at?: string;
        };
        Relationships: [];
      };
      credit_ledger: {
        Row: {
          id: string;
          user_id: string;
          delta: number;
          reason: string;
          reference_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          delta: number;
          reason: string;
          reference_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          delta?: number;
          reason?: string;
          reference_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "credit_ledger_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      decrement_user_credits: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_reason: string;
          p_reference_id?: string | null;
        };
        Returns: number;
      };
      credit_user_credits: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_reason: string;
          p_reference_id?: string | null;
        };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type CreditLedgerRow = Database["public"]["Tables"]["credit_ledger"]["Row"];

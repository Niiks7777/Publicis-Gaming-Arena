export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      pk_users: {
        Row: {
          id: string;
          created_at: string | null;
          name: string;
          agency: string;
          function: string;
        };
        Insert: {
          id?: string;
          created_at?: string | null;
          name: string;
          agency: string;
          function: string;
        };
        Update: {
          id?: string;
          created_at?: string | null;
          name?: string;
          agency?: string;
          function?: string;
        };
      };
      pk_categories: {
        Row: {
          id: string;
          slug: string;
          label: string;
        };
        Insert: {
          id?: string;
          slug: string;
          label: string;
        };
        Update: {
          id?: string;
          slug?: string;
          label?: string;
        };
      };
      pk_levels: {
        Row: {
          id: string;
          slug: string;
          label: string;
        };
        Insert: {
          id?: string;
          slug: string;
          label: string;
        };
        Update: {
          id?: string;
          slug?: string;
          label?: string;
        };
      };
      pk_questions: {
        Row: {
          id: string;
          created_at: string | null;
          category_slug: string | null;
          level_slug: string | null;
          question: string;
          choices: Json;
          correct_index: number;
          topic_cluster: string | null;
          rationale: string | null;
          hash_hint: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string | null;
          category_slug?: string | null;
          level_slug?: string | null;
          question: string;
          choices: Json;
          correct_index: number;
          topic_cluster?: string | null;
          rationale?: string | null;
          hash_hint?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string | null;
          category_slug?: string | null;
          level_slug?: string | null;
          question?: string;
          choices?: Json;
          correct_index?: number;
          topic_cluster?: string | null;
          rationale?: string | null;
          hash_hint?: string | null;
        };
      };
      pk_quiz_attempts: {
        Row: {
          id: string;
          created_at: string | null;
          user_id: string;
          category_slug: string;
          level_slug: string;
          total_score: number;
          duration_seconds: number;
        };
        Insert: {
          id?: string;
          created_at?: string | null;
          user_id: string;
          category_slug: string;
          level_slug: string;
          total_score?: number;
          duration_seconds: number;
        };
        Update: {
          id?: string;
          created_at?: string | null;
          user_id?: string;
          category_slug?: string;
          level_slug?: string;
          total_score?: number;
          duration_seconds?: number;
        };
      };
      pk_attempt_items: {
        Row: {
          id: string;
          attempt_id: string;
          question_id: string | null;
          user_answer_index: number | null;
          correct: boolean;
          time_taken_seconds: number;
          score_delta: number;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          question_id?: string | null;
          user_answer_index?: number | null;
          correct: boolean;
          time_taken_seconds: number;
          score_delta: number;
        };
        Update: {
          id?: string;
          attempt_id?: string;
          question_id?: string | null;
          user_answer_index?: number | null;
          correct?: boolean;
          time_taken_seconds?: number;
          score_delta?: number;
        };
      };
      pk_leaderboard: {
        Row: {
          id: string;
          user_id: string;
          agency: string;
          category_slug: string | null;
          level_slug: string | null;
          score: number;
          occurred_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          agency: string;
          category_slug?: string | null;
          level_slug?: string | null;
          score: number;
          occurred_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          agency?: string;
          category_slug?: string | null;
          level_slug?: string | null;
          score?: number;
          occurred_at?: string | null;
        };
      };
    };
  };
};

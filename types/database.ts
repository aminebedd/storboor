/**
 * Supabase Database Types
 * These types match the exact structure of the Supabase tables
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          name_ar: string
          name_fr: string
          slug: string
          description: string | null
          image: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          name_ar: string
          name_fr: string
          slug: string
          description?: string | null
          image?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          name_ar?: string
          name_fr?: string
          slug?: string
          description?: string | null
          image?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          name_ar: string
          name_fr: string
          description: string | null
          description_ar: string | null
          description_fr: string | null
          category_id: string
          material: string | null
          price: number | null
          stock_quantity: number
          low_stock_threshold: number
          specifications: Json | null
          images: string[] | null
          is_active: boolean
          is_featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          name_ar: string
          name_fr: string
          description?: string | null
          description_ar?: string | null
          description_fr?: string | null
          category_id: string
          material?: string | null
          price?: number | null
          stock_quantity?: number
          low_stock_threshold?: number
          specifications?: Json | null
          images?: string[] | null
          is_active?: boolean
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          name_ar?: string
          name_fr?: string
          description?: string | null
          description_ar?: string | null
          description_fr?: string | null
          category_id?: string
          material?: string | null
          price?: number | null
          stock_quantity?: number
          low_stock_threshold?: number
          specifications?: Json | null
          images?: string[] | null
          is_active?: boolean
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          company: string | null
          address: string | null
          city: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          company?: string | null
          address?: string | null
          city?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          company?: string | null
          address?: string | null
          city?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          customer_id: string | null
          customer_first_name: string
          customer_last_name: string
          customer_email: string
          customer_phone: string | null
          customer_company: string | null
          customer_address: string | null
          customer_city: string | null
          customer_notes: string | null
          status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
          total_price: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id?: string | null
          customer_first_name: string
          customer_last_name: string
          customer_email: string
          customer_phone?: string | null
          customer_company?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_notes?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
          total_price?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string | null
          customer_first_name?: string
          customer_last_name?: string
          customer_email?: string
          customer_phone?: string | null
          customer_company?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_notes?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
          total_price?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          price_at_order: number | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          price_at_order?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          price_at_order?: number | null
          created_at?: string
        }
      }
      stock_history: {
        Row: {
          id: string
          product_id: string
          change_type: 'add' | 'remove' | 'adjust' | 'order_approved' | 'order_cancelled'
          quantity_change: number
          previous_quantity: number
          new_quantity: number
          order_id: string | null
          notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          change_type: 'add' | 'remove' | 'adjust' | 'order_approved' | 'order_cancelled'
          quantity_change: number
          previous_quantity: number
          new_quantity: number
          order_id?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          change_type?: 'add' | 'remove' | 'adjust' | 'order_approved' | 'order_cancelled'
          quantity_change?: number
          previous_quantity?: number
          new_quantity?: number
          order_id?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
    }
  }
}

// Helper types for easier usage
export type Category = Database['public']['Tables']['categories']['Row']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type CategoryUpdate = Database['public']['Tables']['categories']['Update']

export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']

export type Customer = Database['public']['Tables']['customers']['Row']
export type CustomerInsert = Database['public']['Tables']['customers']['Insert']
export type CustomerUpdate = Database['public']['Tables']['customers']['Update']

export type Order = Database['public']['Tables']['orders']['Row']
export type OrderInsert = Database['public']['Tables']['orders']['Insert']
export type OrderUpdate = Database['public']['Tables']['orders']['Update']

export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type OrderItemInsert = Database['public']['Tables']['order_items']['Insert']
export type OrderItemUpdate = Database['public']['Tables']['order_items']['Update']

export type StockHistory = Database['public']['Tables']['stock_history']['Row']
export type StockHistoryInsert = Database['public']['Tables']['stock_history']['Insert']

// Extended types with relations
export type ProductWithCategory = Product & {
  categories: Category
}

export type OrderWithItems = Order & {
  order_items: (OrderItem & {
    products: Product
  })[]
}

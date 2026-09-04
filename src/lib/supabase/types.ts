export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ── Existing enums ─────────────────────────────────────────────────────────
export type OrderStatus  = 'pending' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'rejected'
export type TableStatus  = 'available' | 'occupied' | 'reserved'
export type UserRole     = 'manager' | 'admin'

// ── New enums ──────────────────────────────────────────────────────────────
export type EmployeeRole   = 'Barista' | 'Chef' | 'Baker' | 'Waiter' | 'Cashier' | 'Manager' | 'Cleaner' | 'Security' | 'Delivery' | 'Other'
export type EmployeeStatus = 'active' | 'inactive'
export type AttendanceStatus = 'present' | 'absent' | 'half_day' | 'leave' | 'late'
export type TransactionType  = 'advance' | 'salary' | 'bonus' | 'deduction' | 'other'
export type PaymentMethod    = 'cash' | 'bank_transfer' | 'upi' | 'cheque' | 'other'
export type InventoryUnit    = 'kg' | 'g' | 'litre' | 'ml' | 'pcs' | 'box' | 'packet' | 'dozen' | 'other'
export type MovementType     = 'add' | 'reduce' | 'wastage' | 'adjustment' | 'opening'

export interface Database {
  public: {
    Tables: {
      // ── Existing tables ──────────────────────────────────────────────────
      tables: {
        Row:    { id: string; table_number: string; qr_token: string; status: TableStatus; created_at: string }
        Insert: { id?: string; table_number: string; qr_token: string; status?: TableStatus; created_at?: string }
        Update: { id?: string; table_number?: string; qr_token?: string; status?: TableStatus; created_at?: string }
      }
      categories: {
        Row:    { id: string; name: string; sort_order: number; icon: string | null; created_at: string }
        Insert: { id?: string; name: string; sort_order?: number; icon?: string | null; created_at?: string }
        Update: { id?: string; name?: string; sort_order?: number; icon?: string | null; created_at?: string }
      }
      menu_items: {
        Row:    { id: string; category_id: string; name: string; description: string | null; price: number; image_url: string | null; is_available: boolean; is_veg: boolean; sort_order: number; created_at: string }
        Insert: { id?: string; category_id: string; name: string; description?: string | null; price: number; image_url?: string | null; is_available?: boolean; is_veg?: boolean; sort_order?: number; created_at?: string }
        Update: { id?: string; category_id?: string; name?: string; description?: string | null; price?: number; image_url?: string | null; is_available?: boolean; is_veg?: boolean; sort_order?: number; created_at?: string }
      }
      orders: {
        Row:    { id: string; order_number: string; table_id: string; status: OrderStatus; subtotal: number; tax: number; total: number; notes: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; order_number?: string; table_id: string; status?: OrderStatus; subtotal: number; tax: number; total: number; notes?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; order_number?: string; table_id?: string; status?: OrderStatus; subtotal?: number; tax?: number; total?: number; notes?: string | null; created_at?: string; updated_at?: string }
      }
      order_items: {
        Row:    { id: string; order_id: string; menu_item_id: string | null; item_name: string; quantity: number; price: number; special_instructions: string | null }
        Insert: { id?: string; order_id: string; menu_item_id?: string | null; item_name: string; quantity: number; price: number; special_instructions?: string | null }
        Update: { id?: string; order_id?: string; menu_item_id?: string | null; item_name?: string; quantity?: number; price?: number; special_instructions?: string | null }
      }
      profiles: {
        Row:    { id: string; email: string; role: UserRole; created_at: string }
        Insert: { id: string; email: string; role?: UserRole; created_at?: string }
        Update: { id?: string; email?: string; role?: UserRole; created_at?: string }
      }

      // ── New tables ───────────────────────────────────────────────────────
      employees: {
        Row: {
          id: string; employee_id: string; name: string; phone: string | null; email: string | null
          role: EmployeeRole; joining_date: string; leaving_date: string | null
          monthly_salary: number; status: EmployeeStatus; address: string | null
          notes: string | null; created_at: string; updated_at: string
        }
        Insert: {
          id?: string; employee_id: string; name: string; phone?: string | null; email?: string | null
          role?: EmployeeRole; joining_date?: string; leaving_date?: string | null
          monthly_salary?: number; status?: EmployeeStatus; address?: string | null
          notes?: string | null; created_at?: string; updated_at?: string
        }
        Update: {
          id?: string; employee_id?: string; name?: string; phone?: string | null; email?: string | null
          role?: EmployeeRole; joining_date?: string; leaving_date?: string | null
          monthly_salary?: number; status?: EmployeeStatus; address?: string | null
          notes?: string | null; created_at?: string; updated_at?: string
        }
      }
      attendance: {
        Row: {
          id: string; employee_id: string; date: string; status: AttendanceStatus
          check_in: string | null; check_out: string | null; remarks: string | null
          created_at: string; updated_at: string
        }
        Insert: {
          id?: string; employee_id: string; date: string; status?: AttendanceStatus
          check_in?: string | null; check_out?: string | null; remarks?: string | null
          created_at?: string; updated_at?: string
        }
        Update: {
          id?: string; employee_id?: string; date?: string; status?: AttendanceStatus
          check_in?: string | null; check_out?: string | null; remarks?: string | null
          created_at?: string; updated_at?: string
        }
      }
      employee_transactions: {
        Row: {
          id: string; employee_id: string; type: TransactionType; amount: number
          description: string | null; payment_method: PaymentMethod
          reference_month: string | null; created_at: string
        }
        Insert: {
          id?: string; employee_id: string; type: TransactionType; amount: number
          description?: string | null; payment_method?: PaymentMethod
          reference_month?: string | null; created_at?: string
        }
        Update: {
          id?: string; employee_id?: string; type?: TransactionType; amount?: number
          description?: string | null; payment_method?: PaymentMethod
          reference_month?: string | null; created_at?: string
        }
      }
      inventory_categories: {
        Row:    { id: string; name: string; created_at: string }
        Insert: { id?: string; name: string; created_at?: string }
        Update: { id?: string; name?: string; created_at?: string }
      }
      inventory_items: {
        Row: {
          id: string; category_id: string | null; name: string; unit: InventoryUnit
          current_stock: number; min_stock: number; purchase_price: number | null
          supplier: string | null; is_active: boolean; notes: string | null
          created_at: string; updated_at: string
        }
        Insert: {
          id?: string; category_id?: string | null; name: string; unit?: InventoryUnit
          current_stock?: number; min_stock?: number; purchase_price?: number | null
          supplier?: string | null; is_active?: boolean; notes?: string | null
          created_at?: string; updated_at?: string
        }
        Update: {
          id?: string; category_id?: string | null; name?: string; unit?: InventoryUnit
          current_stock?: number; min_stock?: number; purchase_price?: number | null
          supplier?: string | null; is_active?: boolean; notes?: string | null
          created_at?: string; updated_at?: string
        }
      }
      inventory_movements: {
        Row: {
          id: string; item_id: string; type: MovementType; quantity: number
          note: string | null; created_by: string | null; created_at: string
        }
        Insert: {
          id?: string; item_id: string; type: MovementType; quantity: number
          note?: string | null; created_by?: string | null; created_at?: string
        }
        Update: {
          id?: string; item_id?: string; type?: MovementType; quantity?: number
          note?: string | null; created_by?: string | null; created_at?: string
        }
      }
    }
  }
}

// ── Convenience row types ──────────────────────────────────────────────────
export type CafeTable    = Database['public']['Tables']['tables']['Row']
export type Category     = Database['public']['Tables']['categories']['Row']
export type MenuItem     = Database['public']['Tables']['menu_items']['Row']
export type Order        = Database['public']['Tables']['orders']['Row']
export type OrderItem    = Database['public']['Tables']['order_items']['Row']
export type Profile      = Database['public']['Tables']['profiles']['Row']

export type Employee            = Database['public']['Tables']['employees']['Row']
export type Attendance          = Database['public']['Tables']['attendance']['Row']
export type EmployeeTransaction = Database['public']['Tables']['employee_transactions']['Row']
export type InventoryCategory   = Database['public']['Tables']['inventory_categories']['Row']
export type InventoryItem       = Database['public']['Tables']['inventory_items']['Row']
export type InventoryMovement   = Database['public']['Tables']['inventory_movements']['Row']

// ── Extended types ─────────────────────────────────────────────────────────
export type OrderWithItems = Order & {
  order_items: (OrderItem & { menu_item?: MenuItem | null })[]
  table: CafeTable
}
export type MenuItemWithCategory = MenuItem & { category: Category }
export type InventoryItemWithCategory = InventoryItem & { category: InventoryCategory | null }

export interface CartItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
  imageUrl: string | null
  specialInstructions: string
  isVeg: boolean
}

// ── Utility helpers ────────────────────────────────────────────────────────
export function stockStatus(item: InventoryItem): 'out' | 'low' | 'ok' {
  if (item.current_stock <= 0) return 'out'
  if (item.current_stock < item.min_stock) return 'low'
  return 'ok'
}

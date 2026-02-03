/**
 * Quotes API Route (Supabase)
 * 
 * POST /api/quotes - Create a new quote request
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validate required fields
    if (!body.full_name || !body.email || !body.phone) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create quote request in database
    const { data: quote, error } = await supabase
      .from("quote_requests")
      .insert({
        full_name: body.full_name,
        email: body.email,
        phone: body.phone,
        product_id: body.product_id || null,
        dimensions: body.dimensions || null,
        quantity: body.quantity || 1,
        notes: body.notes || null,
        is_custom_request: body.is_custom_request || false,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating quote:", error);
      
      // If table doesn't exist, create it
      if (error.code === "42P01") {
        // Create the table and try again
        await supabase.rpc("create_quote_requests_table");
        
        const { data: retryQuote, error: retryError } = await supabase
          .from("quote_requests")
          .insert({
            full_name: body.full_name,
            email: body.email,
            phone: body.phone,
            product_id: body.product_id || null,
            dimensions: body.dimensions || null,
            quantity: body.quantity || 1,
            notes: body.notes || null,
            is_custom_request: body.is_custom_request || false,
            status: "pending",
          })
          .select()
          .single();
          
        if (retryError) {
          return NextResponse.json<ApiResponse<null>>(
            { success: false, error: retryError.message },
            { status: 500 }
          );
        }
        
        return NextResponse.json<ApiResponse<typeof retryQuote>>(
          { success: true, data: retryQuote, message: "Quote request submitted successfully" },
          { status: 201 }
        );
      }
      
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<typeof quote>>(
      { success: true, data: quote, message: "Quote request submitted successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Quote submission error:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to submit quote request" },
      { status: 500 }
    );
  }
}

// Using import maps from deno.json
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
// Import Python integration
import { Python } from "https://deno.land/x/python@0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get request data
    const { documentId } = await req.json();
    
    if (!documentId) {
      return new Response(
        JSON.stringify({ error: 'Document ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Create Supabase client with service role key (from environment variables)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get translation job details
    const { data: translation, error: translationError } = await supabaseAdmin
      .from('translations')
      .select('*')
      .eq('id', documentId)
      .single();

    if (translationError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch translation job' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Update status to processing
    await supabaseAdmin
      .from('translations')
      .update({ status: 'processing' })
      .eq('id', documentId);

    // Download source file from storage
    const { data: fileData, error: fileError } = await supabaseAdmin
      .storage
      .from('documents')
      .download(translation.source_file_id);

    if (fileError) {
      await updateTranslationStatus(supabaseAdmin, documentId, 'error', 'Failed to download source file');
      return new Response(
        JSON.stringify({ error: 'Failed to download source file' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Convert file data to text
    const sourceText = await fileData.text();

    // Process the translation using the Python translator module
    try {
      // Initialize Python interpreter
      const python = new Python();
      
      // Prepare arguments for the Python script
      const args = JSON.stringify({
        documentId: documentId,
        supabaseUrl: Deno.env.get('SUPABASE_URL'),
        supabaseKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
        sourceText: sourceText
      });
      
      // Run the Python script - use await to properly handle async Python functions
      const result = await python.runModule({
        moduleName: "translator",
        functionName: "run_translation",
        kwargs: { args: args },
        runSync: false // Set to false to handle async Python functions
      });
      
      if (!result || result.error) {
        throw new Error(result?.error || 'Unknown Python execution error');
      }

      // Parse the result - ensure we're accessing the correct property
      const translatedFilePath = result.translated_file_path || result.document_id;
      
      // Update translation record with translated file path and completed status
      await supabaseAdmin
        .from('translations')
        .update({
          status: 'completed',
          translated_file_path: translatedFilePath
        })
        .eq('id', documentId);
      
      return new Response(
        JSON.stringify({ success: true, translationId: documentId, translatedFilePath }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    } catch (translationError) {
      console.error('Python translation error:', translationError.message);
      await updateTranslationStatus(supabaseAdmin, documentId, 'error', translationError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to process translation: ' + translationError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // This return statement is unreachable because the function already returns inside the try/catch block above

  } catch (error) {
    console.error('Translation error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Helper function to update translation status
async function updateTranslationStatus(supabase, documentId, status, errorMessage = null) {
  const updateData = { status };
  if (errorMessage) {
    updateData.error = errorMessage;
  }

  await supabase
    .from('translations')
    .update(updateData)
    .eq('id', documentId);
}
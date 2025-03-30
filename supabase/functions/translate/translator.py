import os
import tempfile
import sys
import json
from datetime import datetime

# Add the translator agent to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../../translatorAgent'))

try:
    from src.translator_agent.crew import TranslationCrew
except ImportError:
    # Fallback for when the module can't be imported
    class TranslationCrew:
        def crew(self):
            return self
        
        def kickoff(self, inputs):
            # Simulate translation for testing
            return f"[Simulated translation from {inputs['source_language']} to {inputs['target_language']}]\n\n{inputs['source_text']}"

# Entry point for Deno Python module
def run_translation(args):
    try:
        # Parse the arguments
        params = json.loads(args)
        document_id = params['documentId']
        supabase_url = params['supabaseUrl']
        supabase_key = params['supabaseKey']
        
        # Import the Supabase client
        from supabase import create_client
        supabase = create_client(supabase_url, supabase_key)
        
        # Create the translator
        translator = SupabaseTranslator(supabase)
        
        # Process the translation
        result = translator.process_translation(document_id)
        
        # Return the result
        return result
    except Exception as e:
        return {"error": str(e)}

class SupabaseTranslator:
    def __init__(self, supabase_client):
        self.supabase = supabase_client
    
    async def process_translation(self, document_id):
        """Process a translation job from Supabase"""
        try:
            # Get translation job details
            translation = await self._get_translation(document_id)
            
            # Update job status to processing
            await self._update_translation_status(document_id, 'processing')
            
            # Download source file
            source_text = await self._get_source_file(translation['source_file_id'])
            
            # Prepare translation inputs
            inputs = {
                'source_text': source_text,
                'source_language': translation['source_language'],
                'target_language': translation['target_language'],
                'topic': translation.get('topic', 'General'),
                'current_year': str(datetime.now().year)
            }
            
            # Run translation
            result_text = await self._run_translation(inputs)
            
            # Upload translated file
            translated_file_path = await self._upload_translated_file(
                result_text, 
                translation['user_id'], 
                document_id
            )
            
            # Update job status to completed
            await self._update_translation_status(
                document_id, 
                'completed', 
                translated_file_path=translated_file_path
            )
            
            return {
                'success': True,
                'document_id': document_id,
                'translated_file_path': translated_file_path
            }
            
        except Exception as e:
            error_message = str(e)
            print(f"Error processing translation {document_id}: {error_message}")
            await self._update_translation_status(document_id, 'error', error=error_message)
            raise
    
    async def _get_translation(self, document_id):
        """Get translation job details from Supabase"""
        response = await self.supabase.table('translations').select('*').eq('id', document_id).single().execute()
        
        if 'error' in response or not response.get('data'):
            raise Exception(f"Failed to fetch translation job: {response.get('error')}")
        
        return response['data']
    
    async def _update_translation_status(self, document_id, status, translated_file_path=None, error=None):
        """Update translation job status in Supabase"""
        update_data = {'status': status}
        
        if translated_file_path:
            update_data['translated_file_path'] = translated_file_path
        
        if error:
            update_data['error'] = error
        
        await self.supabase.table('translations').update(update_data).eq('id', document_id).execute()
    
    async def _get_source_file(self, file_id):
        """Download source file from Supabase storage"""
        response = await self.supabase.storage.from_('documents').download(file_id)
        
        if not response or 'error' in response:
            raise Exception(f"Failed to download source file: {response.get('error')}")
        
        # Convert the file data to text
        return await response.text()
    
    async def _run_translation(self, inputs):
        """Run translation using the translator agent"""
        try:
            # Create a translation crew instance
            crew = TranslationCrew()
            
            # Run the translation
            result = crew.crew().kickoff(inputs=inputs)
            
            # Extract the string content from CrewOutput
            if hasattr(result, 'output'):
                return result.output
            elif hasattr(result, 'value'):
                return result.value
            else:
                return str(result)
                
        except Exception as e:
            raise Exception(f"Translation processing error: {str(e)}")
    
    async def _upload_translated_file(self, translated_text, user_id, document_id):
        """Upload translated file to Supabase storage"""
        # Create a temporary file for the translated content
        with tempfile.NamedTemporaryFile(delete=False, suffix='.txt', mode='w', encoding='utf-8') as temp_file:
            temp_file.write(translated_text)
            temp_path = temp_file.name
        
        try:
            # Upload the file to Supabase storage
            file_path = f"translated/{user_id}/{document_id}.txt"
            
            with open(temp_path, 'rb') as f:
                response = await self.supabase.storage.from_('documents').upload(
                    file_path,
                    f,
                    {'content-type': 'text/plain', 'upsert': True}
                )
            
            if 'error' in response:
                raise Exception(f"Failed to upload translated file: {response.get('error')}")
            
            return file_path
            
        finally:
            # Clean up the temporary file
            if os.path.exists(temp_path):
                os.unlink(temp_path)
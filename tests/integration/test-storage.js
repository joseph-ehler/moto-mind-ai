// Quick test to check Supabase storage setup
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function testStorage() {
  console.log('🔍 Testing Supabase storage...')
  
  try {
    // Test if documents bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Cannot list buckets:', bucketsError)
      return
    }
    
    console.log('📁 Available buckets:', buckets.map(b => b.name))
    
    const documentsBucket = buckets.find(b => b.name === 'documents')
    if (!documentsBucket) {
      console.log('❌ "documents" bucket does not exist!')
      console.log('💡 You need to create it in Supabase dashboard')
      return
    }
    
    console.log('✅ "documents" bucket exists')
    
    // Test upload a small file
    const testContent = Buffer.from('test document content')
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(`test-${Date.now()}.txt`, testContent, {
        contentType: 'text/plain'
      })
    
    if (uploadError) {
      console.error('❌ Upload failed:', uploadError)
      return
    }
    
    console.log('✅ Upload successful:', uploadData.path)
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(uploadData.path)
    
    console.log('✅ Public URL:', urlData.publicUrl)
    
  } catch (error) {
    console.error('❌ Storage test failed:', error)
  }
}

testStorage()

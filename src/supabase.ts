import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xeemhgiwpmnngjxmdntm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlZW1oZ2l3cG1ubmdqeG1kbnRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNzg0NjYsImV4cCI6MjA4ODY1NDQ2Nn0.8F-zHbj0UFnVoKf1e4PMr3V4nynSFRIjhLQh8Wk7cfo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
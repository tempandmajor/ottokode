'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, Upload, Database, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface IndexStatus {
  id: number
  last_run: string
  last_commit: string | null
}

interface FileUpload {
  path: string
  content: string
}

export default function AdminIndexingPage() {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [indexing, setIndexing] = useState(false)
  const [status, setStatus] = useState<IndexStatus | null>(null)
  const [embeddingsCount, setEmbeddingsCount] = useState(0)

  // Form state
  const [files, setFiles] = useState<FileUpload[]>([
    { path: 'README.md', content: '# Sample README\n\nThis is a test file for indexing.' },
    { path: 'src/utils.ts', content: 'export function formatDate(date: Date): string {\n  return date.toISOString().split("T")[0]\n}' }
  ])
  const [filterPath, setFilterPath] = useState('admin-test')

  const checkAdminStatus = useCallback(async function checkAdminStatus() {
    if (!user) {
      setLoading(false)
      return
    }

    // Robust admin check: allowlist domain via env or users.is_admin flag in DB
    const adminDomain = process.env.NEXT_PUBLIC_ADMIN_DOMAIN?.toLowerCase()
    let admin = false

    if (adminDomain && (user.email || '').toLowerCase().endsWith(`@${adminDomain}`)) {
      admin = true
    } else {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', user.id)
          .maybeSingle()
        if (!error && data?.is_admin === true) admin = true
      } catch (e) {
        // ignore, will fall back to false
      }
    }

    setIsAdmin(admin)
    setLoading(false)
  }, [user])

  useEffect(() => {
    checkAdminStatus()
    fetchIndexStatus()
    fetchEmbeddingsCount()
  }, [user, checkAdminStatus])

  async function fetchIndexStatus() {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('ai_index_status')
        .select('*')
        .order('id', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        console.error('Error fetching index status:', error)
        return
      }

      setStatus(data)
    } catch (error) {
      console.error('Error fetching index status:', error)
    }
  }

  async function fetchEmbeddingsCount() {
    try {
      const supabase = createClient()
      const { count, error } = await supabase
        .from('ai_embeddings')
        .select('*', { count: 'exact', head: true })

      if (!error) {
        setEmbeddingsCount(count || 0)
      }
    } catch (error) {
      console.error('Error fetching embeddings count:', error)
    }
  }

  async function handleIndexFiles() {
    if (!user || files.length === 0) return

    setIndexing(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('No valid session found')
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gbugafddunddrvkvgifl.supabase.co'
      const functionUrl = supabaseUrl.replace('.supabase.co', '.functions.supabase.co')

      const response = await fetch(`${functionUrl}/index-repo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'files',
          files: files,
          filterPath: filterPath || null
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Indexing failed')
      }

      toast.success(`Successfully indexed ${result.indexed_chunks} chunks from ${result.files_processed} files!`)

      // Refresh status and count
      await fetchIndexStatus()
      await fetchEmbeddingsCount()

    } catch (error) {
      console.error('Indexing error:', error)
      toast.error(error instanceof Error ? error.message : 'Indexing failed')
    } finally {
      setIndexing(false)
    }
  }

  function addFile() {
    setFiles([...files, { path: '', content: '' }])
  }

  function updateFile(index: number, field: 'path' | 'content', value: string) {
    const updated = [...files]
    updated[index][field] = value
    setFiles(updated)
  }

  function removeFile(index: number) {
    setFiles(files.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Please log in to access admin features.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Access denied. Admin privileges required.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">AI Repo Indexing</h1>
        <p className="text-muted-foreground mt-2">
          Upload files to index for AI-powered context-aware suggestions
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Embeddings</p>
                <p className="text-2xl font-bold">{embeddingsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Last Indexed</p>
                <p className="text-sm text-muted-foreground">
                  {status?.last_run ? new Date(status.last_run).toLocaleString() : 'Never'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Badge variant={status ? 'default' : 'secondary'}>
                {status ? 'Initialized' : 'Not Initialized'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Indexing Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Index Files</span>
          </CardTitle>
          <CardDescription>
            Upload and index files for AI context retrieval. Files will be chunked and embedded.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="filterPath">Repository Path (optional)</Label>
            <Input
              id="filterPath"
              value={filterPath}
              onChange={(e) => setFilterPath(e.target.value)}
              placeholder="e.g., 'web-app' or 'main-repo'"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Files to Index</Label>
            <div className="space-y-4 mt-2">
              {files.map((file, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Input
                      placeholder="File path (e.g., 'src/utils.ts')"
                      value={file.path}
                      onChange={(e) => updateFile(index, 'path', e.target.value)}
                      className="flex-1 mr-2"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={files.length === 1}
                    >
                      Remove
                    </Button>
                  </div>
                  <Textarea
                    placeholder="File content..."
                    value={file.content}
                    onChange={(e) => updateFile(index, 'content', e.target.value)}
                    rows={6}
                  />
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={addFile}
              className="mt-4"
            >
              Add Another File
            </Button>
          </div>

          <div className="flex space-x-4">
            <Button
              onClick={handleIndexFiles}
              disabled={indexing || files.length === 0 || files.some(f => !f.path || !f.content)}
              className="flex items-center space-x-2"
            >
              {indexing && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{indexing ? 'Indexing...' : 'Index Files'}</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                fetchIndexStatus()
                fetchEmbeddingsCount()
              }}
            >
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <p><strong>1. Deploy Edge Function:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Go to Supabase Dashboard → Edge Functions</li>
              <li>Create new function named &quot;index-repo&quot;</li>
              <li>Copy contents from <code>supabase/functions/index-repo/index.ts</code></li>
            </ul>

            <p><strong>2. Set Environment Variables:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><code>SUPABASE_URL={process.env.NEXT_PUBLIC_SUPABASE_URL}</code></li>
              <li><code>SUPABASE_SERVICE_ROLE_KEY=your_service_key</code></li>
              <li><code>OPENAI_API_KEY=your_openai_key</code> (optional)</li>
            </ul>

            <p><strong>3. Test URL:</strong></p>
            <code className="block bg-muted p-2 rounded">
              {process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '.functions.supabase.co')}/index-repo
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
-- Create function to get user patch statistics efficiently
CREATE OR REPLACE FUNCTION get_user_patch_stats(user_id UUID)
RETURNS JSON
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'totalProposals', COALESCE(proposals.count, 0),
    'totalApplications', COALESCE(applications.count, 0),
    'totalRejections', COALESCE(rejections.count, 0),
    'uniqueFiles', COALESCE(unique_files.count, 0)
  )
  FROM
    (SELECT COUNT(*) as count FROM ai_patch_audit WHERE ai_patch_audit.user_id = get_user_patch_stats.user_id AND action = 'propose') proposals,
    (SELECT COUNT(*) as count FROM ai_patch_audit WHERE ai_patch_audit.user_id = get_user_patch_stats.user_id AND action = 'apply') applications,
    (SELECT COUNT(*) as count FROM ai_patch_audit WHERE ai_patch_audit.user_id = get_user_patch_stats.user_id AND action = 'reject') rejections,
    (SELECT COUNT(DISTINCT file_path) as count FROM ai_patch_audit WHERE ai_patch_audit.user_id = get_user_patch_stats.user_id) unique_files;
$$;

-- Create function to get recent patch activity with aggregated data
CREATE OR REPLACE FUNCTION get_recent_patch_activity(user_id UUID, limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
  file_path TEXT,
  latest_action TEXT,
  latest_created_at TIMESTAMPTZ,
  action_counts JSON,
  latest_provider TEXT,
  latest_model TEXT
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    apa.file_path,
    (array_agg(apa.action ORDER BY apa.created_at DESC))[1] as latest_action,
    MAX(apa.created_at) as latest_created_at,
    json_build_object(
      'propose', COUNT(*) FILTER (WHERE apa.action = 'propose'),
      'apply', COUNT(*) FILTER (WHERE apa.action = 'apply'),
      'reject', COUNT(*) FILTER (WHERE apa.action = 'reject')
    ) as action_counts,
    (array_agg(apa.provider ORDER BY apa.created_at DESC))[1] as latest_provider,
    (array_agg(apa.model ORDER BY apa.created_at DESC))[1] as latest_model
  FROM ai_patch_audit apa
  WHERE apa.user_id = get_recent_patch_activity.user_id
  GROUP BY apa.file_path
  ORDER BY latest_created_at DESC
  LIMIT limit_count;
$$;

-- Create index for better performance on audit queries
CREATE INDEX IF NOT EXISTS idx_ai_patch_audit_user_file_created
ON ai_patch_audit(user_id, file_path, created_at DESC);

-- Create index for action-based queries
CREATE INDEX IF NOT EXISTS idx_ai_patch_audit_user_action_created
ON ai_patch_audit(user_id, action, created_at DESC);
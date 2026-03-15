-- ============================================
-- Add dashboard_widget_config column for widget sizes
-- ============================================

-- Add new column for storing widget configuration with sizes
-- Format: [{ "id": "cv", "size": "large" }, { "id": "quests", "size": "medium" }, ...]
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS dashboard_widget_config JSONB DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN user_preferences.dashboard_widget_config IS
'Widget configuration with sizes. Format: [{ "id": "widgetId", "size": "mini|medium|large" }]';

-- Update the get_or_create_user_preferences function to include the new column
CREATE OR REPLACE FUNCTION get_or_create_user_preferences(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Try to get existing preferences
  SELECT jsonb_build_object(
    'dashboard_widgets', COALESCE(dashboard_widgets, '[]'::jsonb),
    'dashboard_widget_config', COALESCE(dashboard_widget_config,
      '[{"id":"cv","size":"large"},{"id":"quests","size":"medium"},{"id":"jobSearch","size":"medium"},{"id":"wellness","size":"mini"},{"id":"exercises","size":"mini"}]'::jsonb
    )
  ) INTO result
  FROM user_preferences
  WHERE user_id = p_user_id;

  -- If not found, create default preferences
  IF result IS NULL THEN
    INSERT INTO user_preferences (
      user_id,
      dashboard_widgets,
      dashboard_widget_config
    )
    VALUES (
      p_user_id,
      '["cv", "quests", "jobSearch", "wellness", "exercises"]'::jsonb,
      '[{"id":"cv","size":"large"},{"id":"quests","size":"medium"},{"id":"jobSearch","size":"medium"},{"id":"wellness","size":"mini"},{"id":"exercises","size":"mini"}]'::jsonb
    )
    RETURNING jsonb_build_object(
      'dashboard_widgets', dashboard_widgets,
      'dashboard_widget_config', dashboard_widget_config
    ) INTO result;
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

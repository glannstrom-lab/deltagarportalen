-- Migration: Expand user_adaptations with new categories and tracking
-- Adds technical, communication, environmental categories plus detailed tracking

-- Add new category columns
ALTER TABLE user_adaptations
ADD COLUMN IF NOT EXISTS technical_adaptations text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS communication_adaptations text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS environmental_adaptations text[] DEFAULT '{}';

-- Add adaptation details for tracking status, ratings, reminders per adaptation
-- Structure: { "category-key": { key, status, rating, requestedDate, grantedDate, notes, reminderDate } }
ALTER TABLE user_adaptations
ADD COLUMN IF NOT EXISTS adaptation_details jsonb DEFAULT '{}';

-- Add comment to explain the structure
COMMENT ON COLUMN user_adaptations.adaptation_details IS
'JSON object tracking individual adaptation status. Keys are "category-optionKey".
Values: { status: identified|requested|granted|denied|active, rating: 1-5, requestedDate, grantedDate, notes, reminderDate }';

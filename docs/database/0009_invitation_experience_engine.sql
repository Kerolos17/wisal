ALTER TABLE invitations ADD COLUMN opening_style text NOT NULL DEFAULT 'envelope';
ALTER TABLE invitations ADD COLUMN layout_style text NOT NULL DEFAULT 'classic';
ALTER TABLE invitations ADD CONSTRAINT invitations_opening_style_check CHECK (opening_style IN ('envelope', 'card', 'curtain'));
ALTER TABLE invitations ADD CONSTRAINT invitations_layout_style_check CHECK (layout_style IN ('classic', 'story', 'cinematic'));

-- Beta: upgrade all existing free users to unlimited
UPDATE profiles SET tier = 'unlimited' WHERE tier = 'free';

-- Beta: change default tier for new signups to unlimited
ALTER TABLE profiles ALTER COLUMN tier SET DEFAULT 'unlimited';

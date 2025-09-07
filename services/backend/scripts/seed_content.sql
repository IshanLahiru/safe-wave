-- Content Categories
INSERT INTO content_categories (name, description, icon, color, sort_order)
VALUES
('Meditation & Mindfulness', 'Guided meditation and mindfulness practices', 'brain.head.profile', '#4CAF50', 1),
('Relaxation & Sleep', 'Content to help you relax and sleep better', 'bed.double.fill', '#2196F3', 2),
('Stress Relief', 'Techniques and activities to reduce stress', 'heart.fill', '#FF9800', 3),
('Healthy Eating', 'Nutritious meals that support mental health', 'leaf.fill', '#8BC34A', 4),
('Exercise & Movement', 'Physical activities for mental wellness', 'figure.walk', '#E91E63', 5),
('Inspiration & Motivation', 'Uplifting content to boost your mood', 'star.fill', '#FFD700', 6);

-- Videos
INSERT INTO videos (title, description, youtube_id, thumbnail_url, duration, category_id, stress_level, mood_boost, relaxation_score, tags, is_featured)
VALUES
('10 Minute Meditation for Beginners', 'A gentle introduction to meditation for stress relief', 'inpok4MKVLM', 'https://img.youtube.com/vi/inpok4MKVLM/maxresdefault.jpg', 600, 1, 'high', 8.5, 9.0, '["meditation","beginners","stress-relief"]'::jsonb, TRUE),
('Deep Breathing Exercise for Anxiety', 'Simple breathing technique to calm your mind', 'aXIt9sF6xqo', 'https://img.youtube.com/vi/aXIt9sF6xqo/maxresdefault.jpg', 480, 3, 'high', 7.5, 8.5, '["breathing","anxiety","calm"]'::jsonb, TRUE),
('Sleep Music: Deep Relaxation', 'Soothing sounds to help you fall asleep', '1ZYbU82GVz4', 'https://img.youtube.com/vi/1ZYbU82GVz4/maxresdefault.jpg', 3600, 2, 'medium', 6.5, 9.5, '["sleep","relaxation","music"]'::jsonb, TRUE),
('Gentle Yoga for Stress Relief', 'Easy yoga poses to release tension', 'VaoV1PrYFW4', 'https://img.youtube.com/vi/VaoV1PrYFW4/maxresdefault.jpg', 900, 5, 'medium', 8.0, 8.0, '["yoga","gentle","stress-relief"]'::jsonb, FALSE),
('Mindful Walking Meditation', 'Combine movement with mindfulness', 'kQpJvJb1dQY', 'https://img.youtube.com/vi/kQpJvJb1dQY/maxresdefault.jpg', 720, 1, 'low', 7.0, 7.5, '["walking","meditation","mindfulness"]'::jsonb, FALSE);

-- Meal Plans
INSERT INTO meal_plans (title, description, category_id, difficulty, prep_time, cook_time, servings, calories_per_serving, protein, carbs, fat, stress_reduction_benefits, mood_boost_ingredients, ingredients, instructions, tips, image_url, is_featured)
VALUES
('Calming Chamomile Tea & Honey Toast', 'A soothing breakfast to start your day peacefully', 4, 'easy', 5, 3, 1, 180, 6.0, 28.0, 4.0,
 '["chamomile reduces anxiety","honey provides natural energy"]'::jsonb,
 '["chamomile","honey","whole grain bread"]'::jsonb,
 '["1 chamomile tea bag","1 slice whole grain bread","1 tbsp honey","1 tsp butter","1 cup hot water"]'::jsonb,
 '["Boil water and steep chamomile tea for 3-5 minutes","Toast bread until golden brown","Spread with butter and drizzle with honey","Enjoy with your calming tea"]'::jsonb,
 'Take your time to savor each bite and sip mindfully',
 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400',
 TRUE),

('Stress-Relief Smoothie Bowl', 'Nutrient-rich smoothie bowl with mood-boosting ingredients', 4, 'easy', 10, 0, 1, 320, 12.0, 45.0, 8.0,
 '["bananas contain tryptophan","berries are rich in antioxidants"]'::jsonb,
 '["banana","berries","almonds","dark chocolate"]'::jsonb,
 '["1 frozen banana","1/2 cup mixed berries","1/4 cup almond milk","1 tbsp almond butter","1 tbsp dark chocolate chips","1 tbsp granola"]'::jsonb,
 '["Blend frozen banana, berries, and almond milk until smooth","Pour into a bowl","Top with almond butter, chocolate chips, and granola","Enjoy immediately"]'::jsonb,
 'The cold temperature and creamy texture can be very soothing',
 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
 TRUE);

-- Quotes
INSERT INTO quotes (text, author, category_id, source, tags, mood_boost, inspiration_level, is_featured)
VALUES
('Peace comes from within. Do not seek it without.', 'Buddha', 6, 'Buddhist teachings', '["peace","inner-peace","mindfulness"]'::jsonb, 8.5, 9.0, TRUE),
('The only way to do great work is to love what you do.', 'Steve Jobs', 6, 'Stanford Commencement Speech', '["passion","work","motivation"]'::jsonb, 7.5, 8.5, TRUE),
('Happiness is not something ready-made. It comes from your own actions.', 'Dalai Lama', 6, 'The Art of Happiness', '["happiness","actions","mindfulness"]'::jsonb, 8.0, 8.0, FALSE),
('Take life day by day and be grateful for the little things.', 'Anonymous', 6, 'Traditional wisdom', '["gratitude","daily-life","mindfulness"]'::jsonb, 7.0, 7.5, FALSE),
('The present moment is filled with joy and happiness. If you are attentive, you will see it.', 'Thich Nhat Hanh', 1, 'Peace Is Every Step', '["present-moment","joy","mindfulness"]'::jsonb, 8.5, 8.0, FALSE);

-- Articles
INSERT INTO articles (title, content, excerpt, category_id, author, author_bio, read_time, tags, image_url, video_url, stress_reduction_tips, practical_exercises, is_featured)
VALUES
('5 Simple Breathing Techniques for Instant Stress Relief',
 'Stress is a natural part of life, but it doesn''t have to control you. These five simple breathing techniques can help you find calm in just a few minutes...',
 'Learn five powerful breathing techniques that can help you reduce stress and find calm in just a few minutes.',
 3, 'Wellness Team',
 'Our wellness team consists of certified stress management specialists...',
 5, '["breathing","stress-relief","techniques"]'::jsonb,
 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
 NULL,
 '["Practice in a quiet space","Start with just 2-3 minutes","Focus on the sensation of breathing","Be patient with yourself"]'::jsonb,
 '["Morning breathing routine","Mid-day stress reset","Evening relaxation practice"]'::jsonb,
 TRUE),

('The Science of Sleep: How to Improve Your Rest Quality',
 'Quality sleep is essential for mental health and stress management...',
 'Discover the science behind sleep and learn practical strategies to improve your sleep quality for better mental health.',
 2, 'Sleep Specialist',
 'Dr. Sarah Chen is a board-certified sleep medicine physician...',
 8, '["sleep","mental-health","wellness"]'::jsonb,
 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400',
 'https://www.youtube.com/watch?v=nm1TxQj9IsQ',
 '["Create a bedtime ritual","Use calming scents like lavender","Try progressive muscle relaxation","Keep a sleep journal"]'::jsonb,
 '["Evening wind-down routine","Sleep environment audit","Sleep schedule optimization"]'::jsonb,
 TRUE),

('Mindful Eating: Transform Your Relationship with Food',
 'Mindful eating is a powerful practice that can reduce stress, improve digestion...',
 'Learn how mindful eating can reduce stress, improve digestion, and transform your relationship with food.',
 4, 'Nutritionist Maria Rodriguez',
 'Maria Rodriguez is a registered dietitian and mindfulness coach...',
 6, '["mindful-eating","nutrition","stress-relief","wellness"]'::jsonb,
 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400',
 NULL,
 '["Start with one mindful meal per day","Create a calm eating environment","Put down utensils between bites","Practice gratitude before meals"]'::jsonb,
 '["5-minute raisin meditation","Hunger and fullness awareness practice","Gratitude journaling for meals"]'::jsonb,
 FALSE),

('Digital Detox: Reclaiming Your Mental Space',
 'In our hyper-connected world, taking regular breaks from digital devices is essential for mental health...',
 'Discover practical strategies for taking breaks from digital devices to reduce stress, improve focus, and reclaim your mental space.',
 3, 'Digital Wellness Expert',
 NULL,
 7, '["digital-detox","technology","mindfulness","mental-health"]'::jsonb,
 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400',
 'https://www.youtube.com/watch?v=VpHyLG-sc4g',
 '["Start with short 30-minute breaks","Use airplane mode instead of turning off devices","Find accountability partners for digital detox","Replace screen time with physical activities"]'::jsonb,
 '["Daily phone-free hour","Weekend morning digital detox","Mindful technology use tracking"]'::jsonb,
 FALSE);

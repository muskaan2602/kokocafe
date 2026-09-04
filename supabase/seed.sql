-- ============================================================
-- KOKO Café & Bakers — Seed Data
-- Run AFTER schema.sql
-- ============================================================

-- ============================================================
-- CAFÉ TABLES
-- ============================================================
insert into public.tables (table_number, qr_token, status) values
  ('T01', 'T01', 'available'),
  ('T02', 'T02', 'available'),
  ('T03', 'T03', 'available'),
  ('T04', 'T04', 'available'),
  ('T05', 'T05', 'available'),
  ('T06', 'T06', 'available'),
  ('T07', 'T07', 'available'),
  ('T08', 'T08', 'available'),
  ('T09', 'T09', 'available'),
  ('T10', 'T10', 'available')
on conflict (table_number) do nothing;

-- ============================================================
-- CATEGORIES
-- ============================================================
insert into public.categories (name, icon, sort_order) values
  ('Coffee',          '☕', 1),
  ('Hot Beverages',   '🍵', 2),
  ('Cold Beverages',  '🥤', 3),
  ('Breakfast',       '🍳', 4),
  ('Snacks',          '🍟', 5),
  ('Sandwiches',      '🥪', 6),
  ('Pizza',           '🍕', 7),
  ('Pasta',           '🍝', 8),
  ('Bakery',          '🥐', 9),
  ('Desserts',        '🍮', 10),
  ('Cakes',           '🎂', 11)
on conflict (name) do nothing;

-- ============================================================
-- MENU ITEMS
-- ============================================================
do $$
declare
  coffee_id         uuid;
  hot_bev_id        uuid;
  cold_bev_id       uuid;
  breakfast_id      uuid;
  snacks_id         uuid;
  sandwiches_id     uuid;
  pizza_id          uuid;
  pasta_id          uuid;
  bakery_id         uuid;
  desserts_id       uuid;
  cakes_id          uuid;
begin
  select id into coffee_id       from public.categories where name = 'Coffee';
  select id into hot_bev_id      from public.categories where name = 'Hot Beverages';
  select id into cold_bev_id     from public.categories where name = 'Cold Beverages';
  select id into breakfast_id    from public.categories where name = 'Breakfast';
  select id into snacks_id       from public.categories where name = 'Snacks';
  select id into sandwiches_id   from public.categories where name = 'Sandwiches';
  select id into pizza_id        from public.categories where name = 'Pizza';
  select id into pasta_id        from public.categories where name = 'Pasta';
  select id into bakery_id       from public.categories where name = 'Bakery';
  select id into desserts_id     from public.categories where name = 'Desserts';
  select id into cakes_id        from public.categories where name = 'Cakes';

  -- COFFEE
  insert into public.menu_items (category_id, name, description, price, image_url, is_available, is_veg, sort_order) values
    (coffee_id, 'Espresso',           'Rich, concentrated shot of perfectly pulled espresso.',                  80,  'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400', true, true, 1),
    (coffee_id, 'Cappuccino',         'Espresso with steamed milk foam — the classic Italian way.',            160, 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400', true, true, 2),
    (coffee_id, 'Flat White',         'Silky microfoam milk over a double ristretto shot.',                   180, 'https://images.unsplash.com/photo-1521302200778-33500795e128?w=400', true, true, 3),
    (coffee_id, 'Café Latte',         'Smooth espresso with generous steamed milk and a light foam layer.',   170, 'https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=400', true, true, 4),
    (coffee_id, 'Americano',          'Espresso shots diluted with hot water for a long black.',              120, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400', true, true, 5),
    (coffee_id, 'Mocha',              'Rich espresso blended with chocolate and steamed milk.',               190, 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=400', true, true, 6),
    (coffee_id, 'Caramel Latte',      'Creamy latte drizzled with house-made caramel sauce.',                 200, 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=400', true, true, 7),
    (coffee_id, 'Filter Coffee',      'South Indian-style decoction filter coffee served in a dabarah.',      60,  'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?w=400', true, true, 8)
  on conflict do nothing;

  -- HOT BEVERAGES
  insert into public.menu_items (category_id, name, description, price, image_url, is_available, is_veg, sort_order) values
    (hot_bev_id, 'Masala Chai',        'Aromatic spiced tea brewed with ginger, cardamom and cinnamon.',       60,  'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400', true, true, 1),
    (hot_bev_id, 'Green Tea',          'Delicate Japanese green tea, light and refreshing.',                   90,  'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', true, true, 2),
    (hot_bev_id, 'Hot Chocolate',      'Velvety Belgian chocolate melted into warm milk.',                    150, 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400', true, true, 3),
    (hot_bev_id, 'Turmeric Latte',     'Golden milk with turmeric, pepper, and warm spices.',                 140, 'https://images.unsplash.com/photo-1614121516254-00e9dec67a88?w=400', true, true, 4),
    (hot_bev_id, 'Peppermint Tea',     'Soothing peppermint leaves steeped to perfection.',                   80,  'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400', true, true, 5)
  on conflict do nothing;

  -- COLD BEVERAGES
  insert into public.menu_items (category_id, name, description, price, image_url, is_available, is_veg, sort_order) values
    (cold_bev_id, 'Classic Cold Coffee',   'Creamy chilled coffee blended with milk and ice cream.',          180, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400', true, true, 1),
    (cold_bev_id, 'Iced Caramel Latte',    'Cold espresso with milk over ice, finished with caramel.',        210, 'https://images.unsplash.com/photo-1582650625119-3a31f8fa2699?w=400', true, true, 2),
    (cold_bev_id, 'Mango Smoothie',        'Fresh Alphonso mango blended with yogurt and a hint of honey.',   180, 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400', true, true, 3),
    (cold_bev_id, 'Strawberry Milkshake',  'Thick milkshake with fresh strawberries and vanilla ice cream.',  200, 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=400', true, true, 4),
    (cold_bev_id, 'Lemon Mint Cooler',     'Fresh lemon juice with mint, salt and sparkling water.',          120, 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400', true, true, 5),
    (cold_bev_id, 'Virgin Mojito',         'Freshly muddled mint with lime, sugar and soda water.',           140, 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400', true, true, 6)
  on conflict do nothing;

  -- BREAKFAST
  insert into public.menu_items (category_id, name, description, price, image_url, is_available, is_veg, sort_order) values
    (breakfast_id, 'Avocado Toast',          'Smashed avocado on sourdough with cherry tomatoes and feta.',    220, 'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?w=400', true, true, 1),
    (breakfast_id, 'Classic Eggs Benedict',  'Poached eggs on English muffin with hollandaise sauce.',         260, 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=400', true, false, 2),
    (breakfast_id, 'KOKO Breakfast Platter', 'Scrambled eggs, sausage, toast, baked beans and grilled tomato.',380, 'https://images.unsplash.com/photo-1533920379810-6bedac961555?w=400', true, false, 3),
    (breakfast_id, 'Masala Omelette',        'Three-egg omelette with onion, tomato, green chilli and herbs.', 160, 'https://images.unsplash.com/photo-1510693206972-df098062cb71?w=400', true, false, 4),
    (breakfast_id, 'Banana Pancakes',        'Fluffy buttermilk pancakes with fresh banana and maple syrup.',  200, 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=400', true, true, 5),
    (breakfast_id, 'Overnight Oats',         'Rolled oats soaked in almond milk with berries and chia seeds.', 180, 'https://images.unsplash.com/photo-1495214783159-3503fd1b572d?w=400', true, true, 6)
  on conflict do nothing;

  -- SNACKS
  insert into public.menu_items (category_id, name, description, price, image_url, is_available, is_veg, sort_order) values
    (snacks_id, 'French Fries',         'Crispy golden fries with house seasoning and dips.',                  120, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400', true, true, 1),
    (snacks_id, 'Loaded Nachos',        'Tortilla chips with cheese sauce, jalapeños, salsa and sour cream.',  200, 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400', true, true, 2),
    (snacks_id, 'Bruschetta',           'Toasted baguette with tomato, basil and extra-virgin olive oil.',     160, 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400', true, true, 3),
    (snacks_id, 'Onion Rings',          'Beer-battered onion rings served with sriracha mayo.',                140, 'https://images.unsplash.com/photo-1612240498936-65f5101365d2?w=400', true, true, 4),
    (snacks_id, 'Chicken Wings',        '6 pcs crispy wings tossed in buffalo or BBQ sauce.',                  280, 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400', true, false, 5),
    (snacks_id, 'Veg Spring Rolls',     'Crispy rolls stuffed with seasoned vegetables, served with sweet chilli.', 160, 'https://images.unsplash.com/photo-1607330289024-1535c6b4e1c1?w=400', true, true, 6)
  on conflict do nothing;

  -- SANDWICHES
  insert into public.menu_items (category_id, name, description, price, image_url, is_available, is_veg, sort_order) values
    (sandwiches_id, 'Classic Club Sandwich',  'Triple-decker with chicken, bacon, lettuce, tomato and mayo.',  260, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400', true, false, 1),
    (sandwiches_id, 'Grilled Cheese',         'Sourdough with cheddar, emmental and a touch of mustard.',      180, 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=400', true, true, 2),
    (sandwiches_id, 'Cheese & Veggie Sub',    'Sub roll loaded with roasted veggies, mozzarella and pesto.',   200, 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400', true, true, 3),
    (sandwiches_id, 'Chicken Tikka Wrap',     'Soft tortilla with spiced chicken tikka, mint chutney and salad.', 240, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400', true, false, 4),
    (sandwiches_id, 'BLT Bagel',              'Toasted bagel with crispy bacon, lettuce, tomato and cream cheese.', 220, 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400', true, false, 5)
  on conflict do nothing;

  -- PIZZA
  insert into public.menu_items (category_id, name, description, price, image_url, is_available, is_veg, sort_order) values
    (pizza_id, 'Margherita',        'San Marzano tomato, fresh mozzarella, basil.',                           320, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400', true, true, 1),
    (pizza_id, 'BBQ Chicken',       'Smoky BBQ sauce, grilled chicken, red onion and coriander.',             420, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', true, false, 2),
    (pizza_id, 'Four Cheese',       'Mozzarella, cheddar, parmesan and gorgonzola on garlic base.',           400, 'https://images.unsplash.com/photo-1520201163981-8cc95007dd2a?w=400', true, true, 3),
    (pizza_id, 'Peri Peri Chicken', 'Peri peri marinated chicken with capsicum, onion and chilli flakes.',    440, 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=400', true, false, 4),
    (pizza_id, 'Garden Fresh',      'Mushroom, capsicum, olives, corn, onion and extra cheese.',              360, 'https://images.unsplash.com/photo-1548369937-47519962c11a?w=400', true, true, 5)
  on conflict do nothing;

  -- PASTA
  insert into public.menu_items (category_id, name, description, price, image_url, is_available, is_veg, sort_order) values
    (pasta_id, 'Penne Arrabbiata',      'Penne in spicy tomato-garlic sauce with fresh herbs.',               280, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400', true, true, 1),
    (pasta_id, 'Spaghetti Bolognese',   'Slow-cooked meat ragù with parmesan and fresh basil.',               340, 'https://images.unsplash.com/photo-1516100882582-96c3a05fe590?w=400', true, false, 2),
    (pasta_id, 'Pesto Fusilli',         'Fusilli tossed in house-made basil pesto with pine nuts.',           300, 'https://images.unsplash.com/photo-1473093226555-0965b8e64ff2?w=400', true, true, 3),
    (pasta_id, 'Chicken Alfredo',       'Fettuccine in cream sauce with grilled chicken and parmesan.',       360, 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=400', true, false, 4),
    (pasta_id, 'Mac & Cheese',          'Creamy macaroni with four-cheese sauce, breadcrumb topping.',        260, 'https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7?w=400', true, true, 5)
  on conflict do nothing;

  -- BAKERY
  insert into public.menu_items (category_id, name, description, price, image_url, is_available, is_veg, sort_order) values
    (bakery_id, 'Butter Croissant',    'Classic French croissant, golden and flaky.',                         80,  'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400', true, true, 1),
    (bakery_id, 'Almond Croissant',    'Buttery croissant filled with almond cream and topped with flakes.',  110, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400', true, true, 2),
    (bakery_id, 'Blueberry Muffin',    'Moist muffin bursting with fresh blueberries.',                       100, 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400', true, true, 3),
    (bakery_id, 'Banana Bread',        'Homestyle banana bread with walnuts, served warm with butter.',       120, 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=400', true, true, 4),
    (bakery_id, 'Cinnamon Roll',       'Soft roll swirled with cinnamon sugar, topped with cream cheese glaze.', 140, 'https://images.unsplash.com/photo-1509365390695-33aee754301f?w=400', true, true, 5),
    (bakery_id, 'Pain au Chocolat',    'Flaky pastry encasing dark chocolate.',                               110, 'https://images.unsplash.com/photo-1530610476181-d83430b64dcd?w=400', true, true, 6)
  on conflict do nothing;

  -- DESSERTS
  insert into public.menu_items (category_id, name, description, price, image_url, is_available, is_veg, sort_order) values
    (desserts_id, 'Chocolate Brownie',   'Dense, fudgy dark chocolate brownie with a crispy top.',            160, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400', true, true, 1),
    (desserts_id, 'Tiramisu',            'Classic Italian dessert with espresso-soaked ladyfingers and mascarpone.', 200, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400', true, true, 2),
    (desserts_id, 'Crème Brûlée',        'Vanilla custard with a perfectly caramelised sugar crust.',          220, 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=400', true, true, 3),
    (desserts_id, 'Waffles with Nutella','Belgian waffles with Nutella, banana and whipped cream.',            240, 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=400', true, true, 4),
    (desserts_id, 'Cheesecake Slice',    'New York-style baked cheesecake on a digestive biscuit base.',      220, 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=400', true, true, 5),
    (desserts_id, 'Gulab Jamun',         'Soft milk-solid dumplings soaked in rose-cardamom sugar syrup.',    100, 'https://images.unsplash.com/photo-1601303516534-bf5d1a6462f9?w=400', true, true, 6)
  on conflict do nothing;

  -- CAKES
  insert into public.menu_items (category_id, name, description, price, image_url, is_available, is_veg, sort_order) values
    (cakes_id, 'Chocolate Fudge Cake',  'Three layers of moist chocolate sponge with chocolate ganache.',    280, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400', true, true, 1),
    (cakes_id, 'Red Velvet Slice',      'Classic red velvet with cream cheese frosting.',                     260, 'https://images.unsplash.com/photo-1562440499-64c9a111f713?w=400', true, true, 2),
    (cakes_id, 'Lemon Drizzle Cake',    'Zesty lemon sponge with a sweet lemon glaze.',                       220, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', true, true, 3),
    (cakes_id, 'Carrot Walnut Cake',    'Spiced carrot cake with cream cheese frosting and candied walnuts.', 240, 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=400', true, true, 4),
    (cakes_id, 'Seasonal Special',      'Ask your server about today''s special creation from our bakery.',   300, 'https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?w=400', true, true, 5)
  on conflict do nothing;

end $$;
